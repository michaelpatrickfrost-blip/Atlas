import { z } from "zod";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldRuntimeAuthority } from "../fields/runtime-authority";
import { STUDIO_CAPABILITIES as CAP } from "../permissions";
import { compileStructuredPage, compileRetainedStructuredPage } from "../pages/definition-compiler";
import { pagePayloadSchema } from "../pages/schema";
import { publishCompiledDefinitionInTransaction } from "../definitions/publication";
import { activateCompiledVersionInTransaction } from "../definitions/activation";
import { lockFieldEntitiesInTransaction } from "../fields/entity-lock";
import { loadSealedConfigurationVersion } from "../configuration/pins";
import { checksum } from "../registry/contracts";

const identity = z.strictObject({ definitionId: z.uuid(), revision: z.number().int().nonnegative().max(2147483646) });
const saveSchema = identity.extend({ payload: pagePayloadSchema });
const createSchema = z.strictObject({ name: z.string().trim().min(1).max(150), payload: pagePayloadSchema });
const publishSchema = identity.extend({ acknowledgeWarnings: z.boolean() });
function conflict(): never { throw new Error("CONFLICT: someone else saved this screen. Your changes are kept; compare the saved draft before trying again."); }
const scopedDraft = (authority: FieldRuntimeAuthority, definitionId: string, revision?: number) => authority.transaction.studioDraft.findFirst({
  where: { definitionId, organisationId: authority.session.organisationId, ...(revision === undefined ? {} : { revision }),
    definition: { kind: "page", retiredAt: null } }, include: { definition: true, baseVersion: { select: { version: true } } },
});
const audit = (authority: FieldRuntimeAuthority, action: string, definitionId: string, after: Prisma.InputJsonValue) => writeAudit({
  organisationId: authority.session.organisationId, actorUserId: authority.session.userId, action,
  entityType: "StudioDefinition", entityId: definitionId, after,
}, authority.transaction);

/** All methods use the caller's freshly resolved, genuine selected-business
 * authority and its existing Serializable transaction. No parallel publisher.
 */
export async function createPageDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  assertCapability(authority.session, CAP.edit);
  const value = createSchema.parse(input), compiled = await compileStructuredPage(authority, value.payload);
  await lockFieldEntitiesInTransaction(authority.transaction, authority.session.organisationId, [compiled.payload.entity.id]);
  const definition = await authority.transaction.studioDefinition.create({ data: { organisationId: authority.session.organisationId,
    key: `screen.${crypto.randomUUID()}`, kind: "page", name: value.name, createdBy: authority.session.userId,
    draft: { create: { editorUserId: authority.session.userId, payload: compiled.payload } } }, select: { id: true } });
  await audit(authority, "studio.draft.created", definition.id, { kind: "page", name: value.name });
  return definition;
}

export async function readPageDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  assertCapability(authority.session, CAP.read);
  const definitionId = z.uuid().parse(input), draft = await scopedDraft(authority, definitionId);
  if (!draft) throw new Error("This business screen is unavailable.");
  const compiled = await compileStructuredPage(authority, draft.payload);
  const versions = await authority.transaction.studioDefinitionVersion.findMany({ where: { definitionId, organisationId: authority.session.organisationId },
    select: { id: true, version: true, publishedAt: true }, orderBy: { version: "desc" }, take: 50 });
  return { id: definitionId, name: draft.definition.name, revision: draft.revision, definitionRevision: draft.definition.revision,
    activeVersionId: draft.definition.activeVersionId, payload: compiled.payload, warnings: compiled.warnings,
    versions: versions.map(version => ({ ...version, publishedAt: version.publishedAt.toISOString() })) };
}

export async function savePageDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  assertCapability(authority.session, CAP.edit);
  const value = saveSchema.parse(input), draft = await scopedDraft(authority, value.definitionId, value.revision);
  if (!draft) conflict();
  const compiled = await compileStructuredPage(authority, value.payload), previous = pagePayloadSchema.parse(draft.payload);
  // A published screen's canonical owner cannot be changed through a draft.
  if (compiled.payload.entity.id !== previous.entity.id) throw new Error("Choose a new screen to design a different business area.");
  await lockFieldEntitiesInTransaction(authority.transaction, authority.session.organisationId, [compiled.payload.entity.id]);
  const changed = await authority.transaction.studioDraft.updateMany({ where: { id: draft.id, organisationId: authority.session.organisationId,
    revision: value.revision, definition: { retiredAt: null } }, data: { payload: compiled.payload, revision: { increment: 1 }, editorUserId: authority.session.userId,
    validation: { checksum: compiled.checksum, warnings: compiled.warnings, validatedRevision: value.revision + 1 } } });
  if (changed.count !== 1) conflict();
  await audit(authority, "studio.draft.updated", value.definitionId, { revision: value.revision + 1 });
  return { revision: value.revision + 1, payload: compiled.payload, warnings: compiled.warnings };
}

export async function reviewPageDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  assertCapability(authority.session, CAP.edit);
  const value = identity.parse(input), draft = await scopedDraft(authority, value.definitionId, value.revision);
  if (!draft) conflict();
  const compiled = await compileStructuredPage(authority, draft.payload);
  const changed = await authority.transaction.studioDraft.updateMany({ where: { id: draft.id, organisationId: authority.session.organisationId, revision: value.revision },
    data: { validation: { checksum: compiled.checksum, warnings: compiled.warnings, validatedRevision: value.revision } } });
  if (changed.count !== 1) conflict();
  return { payload: compiled.payload, checksum: compiled.checksum, warnings: compiled.warnings };
}

/** Publish and go live are atomic: a failed activation leaves neither a new
 * version nor a partial pointer/Audit. Runtime compatibility is enforced by the
 * original primitives, independently of anything the browser reviewed.
 */
export async function publishPageDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  assertCapability(authority.session, CAP.publish);
  const value = publishSchema.parse(input), draft = await scopedDraft(authority, value.definitionId, value.revision);
  if (!draft) conflict();
  const compiled = await compileStructuredPage(authority, draft.payload);
  if (compiled.warnings.length && !value.acknowledgeWarnings) throw new Error("Review and acknowledge the screen warnings before publishing.");
  const published = await publishCompiledDefinitionInTransaction(authority.transaction, authority.session, draft, value.revision, compiled);
  const activated = await activateCompiledVersionInTransaction(authority.transaction, authority.session, value.definitionId,
    draft.definition.revision + 1, published.version, compiled);
  return { revision: published.draftRevision, definitionRevision: activated.revision, versionId: published.version.id, version: published.versionNumber };
}

export async function restorePageVersionInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  assertCapability(authority.session, CAP.publish);
  const value = z.strictObject({ definitionId: z.uuid(), versionId: z.uuid(), definitionRevision: z.number().int().nonnegative() }).parse(input);
  const version = await authority.transaction.studioDefinitionVersion.findFirst({ where: { id: value.versionId, definitionId: value.definitionId,
    organisationId: authority.session.organisationId, definition: { kind: "page", retiredAt: null } } });
  if (!version) throw new Error("This previous screen is unavailable.");
  const sealed = await loadSealedConfigurationVersion(authority.session, authority.transaction, {
    kind: "page", definitionId: value.definitionId, versionId: version.id,
    schemaVersion: version.schemaVersion, checksum: version.checksum,
  });
  const compiled = await compileRetainedStructuredPage(authority, sealed);
  if (checksum(version.compiledPlan) !== compiled.checksum || version.checksum !== compiled.checksum)
    throw new Error("DEPENDENCY_BROKEN: this previous screen needs a new review before it can go live.");
  return activateCompiledVersionInTransaction(authority.transaction, authority.session, value.definitionId, value.definitionRevision, version, compiled);
}
