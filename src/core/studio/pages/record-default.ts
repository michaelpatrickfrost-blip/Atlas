import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { sessionAuthorityStamp } from "@/core/auth/session";
import { withFieldRuntimeAuthority, fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from "../fields/runtime-authority";
import { referenceSchema } from "../compiler/reference";
import { resolveRecordProfileInTransaction } from "../record-types/runtime-profile";
import { loadSealedConfigurationVersion } from "../configuration/pins";
import { pageReferenceSchema } from "../record-types/schema";
import { pageApprovalsSchema } from "./approvals";
import { formFactorSchema, pageNodeIdSchema, pagePayloadSchema } from "./schema";
import { pageQueryRequestSchema } from "./owner-contract";
import { compilePage, samePageReference } from "./compiler";
import { pageReadScope } from "./definition-compiler";
import { readPublishedPageInTransaction } from "./runtime";
import { checksum } from "../registry/contracts";
import { prepareVisibleCustomerAction, prepareVisibleCustomerSurface } from "./customer-selection";
import { reconstructPageApprovalsInTransaction } from "./server-approvals";

const uuid = z.uuid().transform(value => value.toLowerCase());
const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const requestSchema = z.strictObject({ mode: z.literal("record_default"), entityId: z.literal("tickets.ticket"),
  recordId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/), formFactor: formFactorSchema,
  cursors: z.record(pageNodeIdSchema, pageQueryRequestSchema.shape.cursor).refine(value => Object.keys(value).length <= 100).default({}),
  // Route/current-selection assertions only. None select a pin or grant access.
  definitionId: uuid.optional(), expectedVersionId: uuid.optional(), expectedDefinitionRevision: revision.optional(),
  expectedProfileFingerprint: z.string().regex(/^[a-f0-9]{64}$/).optional(), expectedNativeRevision: z.number().int().positive().max(2147483647).optional() });
const controlSchema = requestSchema.extend({ componentId: pageNodeIdSchema, definitionId: uuid, expectedVersionId: uuid,
  expectedDefinitionRevision: revision, expectedProfileFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  expectedNativeRevision: z.number().int().positive().max(2147483647) });
const frameSchema = z.object({ kind: z.literal("page"), schemaVersion: z.literal(1), approvals: pageApprovalsSchema });
function unavailable(): never { throw new Error("NOT_FOUND: this record's business layout is unavailable."); }
function changed(): never { throw new Error("CONFLICT: this record's business layout changed. Refresh before continuing."); }
function genuine(authority: FieldRuntimeAuthority) {
  const stamp = sessionAuthorityStamp(authority.session);
  if (!stamp || stamp !== authority.stamp || stamp.organisationId !== authority.session.organisationId
    || stamp.userId !== authority.session.userId || stamp.membershipId !== authority.session.membershipId)
    throw new Error("FORBIDDEN: current authenticated business access is required.");
}
const exact = ({ id, version, schemaHash, contractHash }: z.infer<typeof referenceSchema>) => referenceSchema.parse({ id, version, schemaHash, contractHash });

/** Customer native-record layout. Uses the CURRENT canonical record profile and
 * its exact retained published Page pin, independently of a Page's active pointer.
 * No Studio authoring permission, caller pin/tenant/type or fallback to latest.
 */
export async function readRecordDefaultCustomerPage(authenticated: Session, input: unknown) {
  const request = requestSchema.parse(input);
  return withFieldRuntimeAuthority(authenticated, async authority => (await readDefault(authority, request))?.view ?? null);
}
export async function readRecordDefaultCustomerPageInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const request = requestSchema.parse(input);
  genuine(authority);
  const current = await fieldRuntimeAuthorityInTransaction(authority.session, authority.transaction);
  genuine(current);
  return (await readDefault(current, request))?.view ?? null;
}
async function selectDefault(authority: FieldRuntimeAuthority, request: z.infer<typeof requestSchema>) {
  genuine(authority);
  const { session, transaction, registry } = authority, context = { session, transaction };
  // Current Tickets9 is the concrete owner-approved adapter. Describe selects
  // metadata only; the real Page callback verifies native tenant/private Read
  // BEFORE profile/assignment/Page metadata or any typed values are inspected.
  const entity = exact(registry.describe(request.entityId, 9));
  const source = registry.describePageSourceForEntity(entity), sourcePage = exact(source.metadata);
  const nativeRequest = { kind: "record" as const, recordId: request.recordId };
  const owner = await registry.authorisePageRead(context, sourcePage, nativeRequest);
  if (!samePageReference(owner.source, entity) || owner.anchor.kind !== "record"
    || owner.anchor.organisationId !== session.organisationId || owner.anchor.recordId !== request.recordId
    || owner.anchor.nativeRevision === undefined) unavailable();
  const nativeRevision = owner.anchor.nativeRevision;
  const resolved = await resolveRecordProfileInTransaction(authority, { entity, recordId: request.recordId,
    expectedRevision: nativeRevision }, { kind: "ordinary" });
  const selected = resolved.profile?.page;
  if (!selected) {
    if (request.definitionId !== undefined || request.expectedVersionId !== undefined || request.expectedDefinitionRevision !== undefined
      || request.expectedProfileFingerprint !== undefined || request.expectedNativeRevision !== undefined) changed();
    return null;
  }
  const pin = pageReferenceSchema.parse(selected);
  if ((request.definitionId !== undefined && request.definitionId !== pin.definitionId)
    || (request.expectedVersionId !== undefined && request.expectedVersionId !== pin.versionId)
    || (request.expectedProfileFingerprint !== undefined && request.expectedProfileFingerprint !== resolved.fingerprint)
    || (request.expectedNativeRevision !== undefined && request.expectedNativeRevision !== nativeRevision)) changed();
  const version = await loadSealedConfigurationVersion(session, transaction, pin), frame = frameSchema.parse(version.compiledPlan);
  const payload = pagePayloadSchema.parse(version.payload);
  if (!samePageReference(payload.entity, entity)) unavailable();
  // Preserve exact compatible historical source identity; its current owner
  // policy and module/grants are independently rechecked by the shared registry.
  const selectedSource = exact(frame.approvals.sourcePage);
  const selectedOwner = await registry.authorisePageRead(context, selectedSource, nativeRequest);
  if (!samePageReference(selectedOwner.source, entity) || selectedOwner.anchor.kind !== "record"
    || selectedOwner.anchor.organisationId !== session.organisationId || selectedOwner.anchor.recordId !== request.recordId
    || selectedOwner.anchor.nativeRevision !== nativeRevision || selectedOwner.anchor.revision !== owner.anchor.revision) changed();
  const currentApprovals = await reconstructPageApprovalsInTransaction(authority, { sourcePage: selectedSource,
    customFields: frame.approvals.customFields.map(field => field.reference),
    ...(frame.approvals.embeddedViews ? { embeddedViews: frame.approvals.embeddedViews.map(view => view.reference) } : {}) });
  const plan = compilePage(payload, currentApprovals);
  if (checksum(plan) !== pin.checksum || pageReadScope(plan, selectedOwner.policy) !== "record") unavailable();
  const definition = await transaction.studioDefinition.findFirst({ where: { id: pin.definitionId, organisationId: session.organisationId,
    kind: "page", retiredAt: null }, select: { id: true, organisationId: true, name: true, revision: true } });
  if (!definition || definition.id !== pin.definitionId || definition.organisationId !== session.organisationId) unavailable();
  if (request.expectedDefinitionRevision !== undefined && request.expectedDefinitionRevision !== definition.revision) changed();
  return { pin, sourcePage: selectedSource, anchor: selectedOwner.anchor, request: nativeRequest, target: { mode: "record_default" as const, entityId: entity.id, recordId: request.recordId, definitionId: pin.definitionId,
    definitionRevision: definition.revision, versionId: pin.versionId, name: definition.name,
    profileFingerprint: resolved.fingerprint, nativeRevision, recordTypeDefinitionId: resolved.recordType?.definitionId ?? null } };
}


/** Link target only: same genuine current native/profile/retained Page metadata
 * checks as the full reader, without evaluating visibility facts or reading any
 * Page query/typed values. Names identify the authorized layout, not access to a
 * component. Full reads and control preparation repeat their own staged grants. */
export async function recordDefaultCustomerPageTarget(authenticated: Session, input: unknown) {
  const request = requestSchema.parse(input);
  return withFieldRuntimeAuthority(authenticated, async authority => (await selectDefault(authority, request))?.target ?? null);
}
export async function recordDefaultCustomerPageTargetInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const request = requestSchema.parse(input);
  genuine(authority);
  const current = await fieldRuntimeAuthorityInTransaction(authority.session, authority.transaction);
  genuine(current);
  return (await selectDefault(current, request))?.target ?? null;
}
async function readDefault(authority: FieldRuntimeAuthority, request: z.infer<typeof requestSchema>) {
  const selection = await selectDefault(authority, request);
  if (!selection) return null;
  const model = await readPublishedPageInTransaction(authority, { page: selection.pin, request: selection.request,
    formFactor: request.formFactor, cursors: request.cursors });
  return { sourcePage: selection.sourcePage, anchor: selection.anchor, request: selection.request, view: { ...selection.target, model } };
}


/** Internal exact-profile visible command/form seams. Expected values assert the
 * freshly resolved selection; callers never supply a Page pin or type authority.
 * The shared selector and original owning command/form endpoints remain in use. */
async function controlSelection(authority: FieldRuntimeAuthority, input: unknown) {
  const request = controlSchema.parse(input);
  genuine(authority);
  const current = await fieldRuntimeAuthorityInTransaction(authority.session, authority.transaction);
  genuine(current);
  const selected = await readDefault(current, request);
  if (!selected) changed();
  return { authority: current, view: selected.view, sourcePage: selected.sourcePage, request: selected.request,
    expectedAnchor: selected.anchor, formFactor: request.formFactor, componentId: request.componentId };
}
export async function prepareVisibleRecordDefaultActionInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const selection = await controlSelection(authority, input);
  const prepared = await prepareVisibleCustomerAction(selection);
  return { ...prepared, mode: "record_default" as const, profileFingerprint: selection.view.profileFingerprint,
    nativeRevision: selection.view.nativeRevision, recordTypeDefinitionId: selection.view.recordTypeDefinitionId };
}
export async function prepareVisibleRecordDefaultSurfaceInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const selection = await controlSelection(authority, input);
  const prepared = await prepareVisibleCustomerSurface(selection);
  return { ...prepared, mode: "record_default" as const, definitionId: selection.view.definitionId,
    definitionRevision: selection.view.definitionRevision, versionId: selection.view.versionId,
    profileFingerprint: selection.view.profileFingerprint, nativeRevision: selection.view.nativeRevision,
    recordTypeDefinitionId: selection.view.recordTypeDefinitionId };
}
