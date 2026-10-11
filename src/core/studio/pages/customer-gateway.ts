import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { sessionAuthorityStamp } from "@/core/auth/session";
import { referenceSchema } from "../compiler/reference";
import { checksum } from "../registry/contracts";
import { pageReferenceSchema } from "../record-types/schema";
import { fieldRuntimeAuthorityInTransaction, withFieldRuntimeAuthority, type FieldRuntimeAuthority } from "../fields/runtime-authority";
import { pageApprovalsSchema } from "./approvals";
import { pageReadRequestSchema, pageQueryRequestSchema } from "./owner-contract";
import { formFactorSchema, pageNodeIdSchema } from "./schema";
import { readPublishedPageInTransaction } from "./runtime";

const uuid = z.uuid().transform(value => value.toLowerCase());
const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const viewSchema = z.strictObject({ definitionId: uuid, request: pageReadRequestSchema, formFactor: formFactorSchema,
  cursors: z.record(pageNodeIdSchema, pageQueryRequestSchema.shape.cursor).refine(value => Object.keys(value).length <= 100).default({}) });
const actionSchema = viewSchema.extend({ componentId: pageNodeIdSchema, expectedVersionId: uuid, expectedDefinitionRevision: revision });
const definitionSchema = z.object({ id: uuid, organisationId: z.string().min(1), kind: z.literal("page"), name: z.string(),
  revision, retiredAt: z.null(), activeVersionId: uuid, activeVersion: z.object({ id: uuid, organisationId: z.string().min(1), definitionId: uuid,
    schemaVersion: z.literal(1), checksum: z.string().regex(/^[a-f0-9]{64}$/), compiledPlan: z.unknown() }) });
const frameSchema = z.object({ kind: z.literal("page"), schemaVersion: z.literal(1), approvals: pageApprovalsSchema });
function unavailable(): never { throw new Error("NOT_FOUND: this business screen is unavailable."); }
function changed(): never { throw new Error("CONFLICT: this business screen changed. Refresh before using its buttons."); }
function genuine(authority: FieldRuntimeAuthority) {
  const stamp = sessionAuthorityStamp(authority.session);
  if (!stamp || stamp !== authority.stamp || stamp.organisationId !== authority.session.organisationId
    || stamp.userId !== authority.session.userId || stamp.membershipId !== authority.session.membershipId)
    throw new Error("FORBIDDEN: current authenticated business access is required.");
}
async function refreshed(authority: FieldRuntimeAuthority) {
  genuine(authority);
  const current = await fieldRuntimeAuthorityInTransaction(authority.session, authority.transaction);
  genuine(current);
  return current;
}

/** Customer route address only. Tenant, active immutable pin and approvals are
 * derived on the server; Studio authoring permission is neither used nor granted. */
export async function readActiveCustomerPage(authenticated: Session, input: unknown) {
  const request = viewSchema.parse(input);
  return withFieldRuntimeAuthority(authenticated, async authority => (await readCurrent(authority, request)).view);
}
export async function readActiveCustomerPageInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const request = viewSchema.parse(input);
  return (await readCurrent(await refreshed(authority), request)).view;
}
async function readCurrent(authority: FieldRuntimeAuthority, request: z.infer<typeof viewSchema>, expected?: { versionId: string; definitionRevision: number }) {
  genuine(authority);
  const { session, transaction } = authority;
  // Stable current pointer while the owning read/action preparation runs. SSI and
  // existing sealed/current policy checks remain necessary after advisory waits.
  await transaction.$queryRaw`SELECT id FROM studio_definitions WHERE id=${request.definitionId}::uuid
    AND "organisationId"=${session.organisationId} AND kind='page' AND "retiredAt" IS NULL FOR SHARE`;
  const stored = await transaction.studioDefinition.findFirst({ where: { id: request.definitionId, organisationId: session.organisationId,
    kind: "page", retiredAt: null }, select: { id: true, organisationId: true, kind: true, name: true, revision: true,
    retiredAt: true, activeVersionId: true, activeVersion: { select: { id: true, organisationId: true, definitionId: true,
      schemaVersion: true, checksum: true, compiledPlan: true } } } });
  if (!stored) unavailable();
  const parsed = definitionSchema.safeParse(stored);
  if (!parsed.success) unavailable();
  const definition = parsed.data, version = definition.activeVersion;
  if (definition.id !== request.definitionId || definition.organisationId !== session.organisationId
    || version.id !== definition.activeVersionId || version.definitionId !== definition.id || version.organisationId !== session.organisationId
    || checksum(version.compiledPlan) !== version.checksum) unavailable();
  if (expected && (version.id !== expected.versionId || definition.revision !== expected.definitionRevision)) changed();
  const frame = frameSchema.safeParse(version.compiledPlan);
  if (!frame.success) unavailable();
  const page = pageReferenceSchema.parse({ kind: "page", definitionId: definition.id, versionId: version.id,
    schemaVersion: version.schemaVersion, checksum: version.checksum });
  const model = await readPublishedPageInTransaction(authority, { page, request: request.request, formFactor: request.formFactor, cursors: request.cursors });
  const { id, version: sourceVersion, schemaHash, contractHash } = frame.data.approvals.sourcePage;
  return { view: { definitionId: definition.id, definitionRevision: definition.revision, versionId: version.id, name: definition.name, model },
    sourcePage: referenceSchema.parse({ id, version: sourceVersion, schemaHash, contractHash }) };
}

/** Internal owning-route seam ONLY. Never serialise this result or treat it as a
 * command execution grant: it includes live authority and its shared transaction.
 * No caller command/input/approval/tenant is accepted. Native owning endpoint must
 * independently bind input, repeat domain access and perform the operation. */
export async function prepareVisiblePageActionInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const request = actionSchema.parse(input), current = await refreshed(authority);
  const { view, sourcePage } = await readCurrent(current, request, { versionId: request.expectedVersionId, definitionRevision: request.expectedDefinitionRevision });
  const component = view.model.sections.flatMap(section => section.components).find(value => value.id === request.componentId);
  if (!component || component.type !== "action") unavailable();
  const owner = await current.registry.authorisePageRead({ session: current.session, transaction: current.transaction }, sourcePage, request.request);
  const command = await current.registry.resolve(current.session, component.command);
  const approval = owner.policy.commands.find(value => value.command.id === command.id && value.command.version === command.version);
  if (command.kind !== "command" || command.ownerModuleId !== owner.source.ownerModuleId || !approval
    || !approval.formFactors.includes(request.formFactor) || (approval.confirmation === "required" && !component.confirm)
    || command.details.sideEffect !== "none") unavailable();
  if (owner.anchor.kind !== request.request.kind || owner.anchor.organisationId !== current.session.organisationId
    || (request.request.kind === "record" && (owner.anchor.kind !== "record" || owner.anchor.recordId !== request.request.recordId))) unavailable();
  return { authority: current, definitionId: view.definitionId, definitionRevision: view.definitionRevision, versionId: view.versionId,
    sourcePage, ownerModuleId: owner.source.ownerModuleId, anchor: owner.anchor,
    component: { id: component.id, confirm: component.confirm, preview: component.preview }, command: referenceSchema.parse({ id: command.id, version: command.version, schemaHash: command.schemaHash, contractHash: command.contractHash }) };
}

/** Registered native form seam. Same current-pointer/visible-component/owning
 * anchor checks as buttons; the owner must independently build the complete form
 * manifest and use its original domain action. This result stays server-only. */
export async function prepareVisiblePageSurfaceInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const request = actionSchema.parse(input), current = await refreshed(authority);
  const { view, sourcePage } = await readCurrent(current, request, { versionId: request.expectedVersionId, definitionRevision: request.expectedDefinitionRevision });
  const component = view.model.sections.flatMap(section => section.components).find(value => value.id === request.componentId);
  if (!component || component.type !== "surface" || !component.surface) unavailable();
  const owner = await current.registry.authorisePageRead({ session: current.session, transaction: current.transaction }, sourcePage, request.request);
  const surface = await current.registry.resolve(current.session, component.surface);
  const approval = owner.policy.surfaces.find(value => value.surface.id === surface.id && value.surface.version === surface.version);
  if (surface.kind !== "surface" || surface.ownerModuleId !== owner.source.ownerModuleId || !approval
    || approval.family !== component.family || !approval.formFactors.includes(request.formFactor)
    || owner.anchor.kind !== "record" || request.request.kind !== "record" || owner.anchor.recordId !== request.request.recordId
    || owner.anchor.organisationId !== current.session.organisationId) unavailable();
  return { authority: current, anchor: owner.anchor, surface: referenceSchema.parse({ id: surface.id, version: surface.version,
    schemaHash: surface.schemaHash, contractHash: surface.contractHash }), ownerModuleId: owner.source.ownerModuleId };
}
