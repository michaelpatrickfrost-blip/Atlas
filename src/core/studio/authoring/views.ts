import { z } from "zod";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import type { Prisma } from "@/generated/prisma/client";
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from "../fields/runtime-authority";
import { STUDIO_CAPABILITIES as CAP } from "../permissions";
import { compileRegisteredView } from "../views/definition-compiler";
import { viewPayloadSchema } from "../views/schema";
import { assertSameViewOwner } from "../views/origin";
import { loadSealedViewVersion } from "../views/seal";
import { publishCompiledDefinitionInTransaction } from "../definitions/publication";
import { activateCompiledVersionInTransaction } from "../definitions/activation";

const identity = z.strictObject({ definitionId: z.uuid(), revision: z.number().int().nonnegative().max(2147483646) });
const saveSchema = identity.extend({ payload: viewPayloadSchema, name: z.string().trim().min(1).max(150).optional() });
const createSchema = z.strictObject({ name: z.string().trim().min(1).max(150), payload: viewPayloadSchema });
function conflict(): never { throw new Error("CONFLICT: someone else saved this dashboard. Your changes are kept; compare the saved draft before trying again."); }
async function current(authority: FieldRuntimeAuthority, capability: string) {
  const fresh = await fieldRuntimeAuthorityInTransaction(authority.session, authority.transaction);
  assertCapability(fresh.session, capability);
  if (!await fresh.transaction.moduleState.findFirst({ where: { organisationId: fresh.session.organisationId, moduleId: "studio", enabled: true, entitled: true }, select: { id: true } }))
    throw new Error("FORBIDDEN: this business design workspace is unavailable.");
  return fresh;
}
const scopedDraft = (authority: FieldRuntimeAuthority, definitionId: string, revision?: number) => authority.transaction.studioDraft.findFirst({
  where: { definitionId, organisationId: authority.session.organisationId, ...(revision === undefined ? {} : { revision }), definition: { kind: "view", retiredAt: null } },
  include: { definition: true, baseVersion: { select: { version: true } } },
});
const audit = (authority: FieldRuntimeAuthority, action: string, definitionId: string, after: Prisma.InputJsonValue) => writeAudit({
  organisationId: authority.session.organisationId, actorUserId: authority.session.userId, action, entityType: "StudioDefinition", entityId: definitionId, after,
}, authority.transaction);

/** Closed registered-owner metadata only. Every method refreshes the caller's
 * genuine selected business inside its existing Serializable transaction; the
 * original publisher/CAS/Audit remains the sole publication implementation. */
export async function createViewDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  authority = await current(authority, CAP.edit);
  const value = createSchema.parse(input), compiled = await compileRegisteredView(authority, value.payload);
  const definition = await authority.transaction.studioDefinition.create({ data: { organisationId: authority.session.organisationId,
    key: `view.${crypto.randomUUID()}`, kind: "view", name: value.name, createdBy: authority.session.userId,
    draft: { create: { editorUserId: authority.session.userId, payload: compiled.payload } } }, select: { id: true } });
  await audit(authority, "studio.draft.created", definition.id, { kind: "view", name: value.name });
  return { definitionId: definition.id, revision: 0 };
}
export async function readViewDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  authority = await current(authority, CAP.read);
  const definitionId = z.uuid().parse(input), draft = await scopedDraft(authority, definitionId);
  if (!draft) throw new Error("This business dashboard is unavailable.");
  const compiled = await compileRegisteredView(authority, draft.payload);
  const versions = await authority.transaction.studioDefinitionVersion.findMany({ where: { definitionId, organisationId: authority.session.organisationId },
    select: { id: true, version: true, publishedAt: true }, orderBy: { version: "desc" }, take: 50 });
  return { definitionId, name: draft.definition.name, updatedAt: draft.updatedAt.toISOString(), revision: draft.revision, definitionRevision: draft.definition.revision,
    activeVersionId: draft.definition.activeVersionId, payload: compiled.payload, warnings: compiled.warnings,
    versions: versions.map(version => ({ ...version, publishedAt: version.publishedAt.toISOString() })) };
}
export async function saveViewDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  authority = await current(authority, CAP.edit);
  const value = saveSchema.parse(input), draft = await scopedDraft(authority, value.definitionId, value.revision);
  if (!draft) conflict();
  const compiled = await compileRegisteredView(authority, value.payload);
  assertSameViewOwner(draft.payload, compiled.payload);
  if (value.name !== undefined && value.name !== draft.definition.name) {
    const renamed = await authority.transaction.studioDefinition.updateMany({ where: { id: value.definitionId, organisationId: authority.session.organisationId,
      kind: "view", retiredAt: null, revision: draft.definition.revision }, data: { name: value.name, revision: { increment: 1 } } });
    if (renamed.count !== 1) conflict();
  }
  const changed = await authority.transaction.studioDraft.updateMany({ where: { id: draft.id, organisationId: authority.session.organisationId,
    revision: value.revision, definition: { kind: "view", retiredAt: null } }, data: { payload: compiled.payload, revision: { increment: 1 }, editorUserId: authority.session.userId,
    validation: { checksum: compiled.checksum, warnings: compiled.warnings, validatedRevision: value.revision + 1 } } });
  if (changed.count !== 1) conflict();
  await audit(authority, "studio.draft.updated", value.definitionId, { revision: value.revision + 1 });
  return { definitionId: value.definitionId, revision: value.revision + 1 };
}
export async function reviewViewDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  authority = await current(authority, CAP.edit);
  const value = identity.parse(input), draft = await scopedDraft(authority, value.definitionId, value.revision);
  if (!draft) conflict();
  const compiled = await compileRegisteredView(authority, draft.payload);
  const changed = await authority.transaction.studioDraft.updateMany({ where: { id: draft.id, organisationId: authority.session.organisationId, revision: value.revision },
    data: { validation: { checksum: compiled.checksum, warnings: compiled.warnings, validatedRevision: value.revision } } });
  if (changed.count !== 1) conflict();
  return { payload: compiled.payload, checksum: compiled.checksum, warnings: compiled.warnings };
}
export async function publishViewDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  authority = await current(authority, CAP.publish);
  const value = identity.extend({ acknowledgeWarnings: z.boolean() }).parse(input), draft = await scopedDraft(authority, value.definitionId, value.revision);
  if (!draft) conflict();
  const compiled = await compileRegisteredView(authority, draft.payload);
  if (compiled.warnings.length && !value.acknowledgeWarnings) throw new Error("Review and acknowledge the dashboard warnings before publishing.");
  const published = await publishCompiledDefinitionInTransaction(authority.transaction, authority.session, draft, value.revision, compiled);
  const activated = await activateCompiledVersionInTransaction(authority.transaction, authority.session, value.definitionId, draft.definition.revision + 1, published.version, compiled);
  return { revision: published.draftRevision, definitionRevision: activated.revision, versionId: published.version.id, version: published.versionNumber };
}
export async function restoreViewVersionInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  authority = await current(authority, CAP.publish);
  const value = z.strictObject({ definitionId: z.uuid(), versionId: z.uuid(), definitionRevision: z.number().int().nonnegative() }).parse(input);
  const row = await authority.transaction.studioDefinitionVersion.findFirst({ where: { id: value.versionId, definitionId: value.definitionId,
    organisationId: authority.session.organisationId, definition: { kind: "view", retiredAt: null } }, select: { checksum: true, schemaVersion: true, version: true } });
  if (!row) throw new Error("This previous business dashboard is unavailable.");
  const version = await loadSealedViewVersion(authority.session, authority.transaction, { kind: "view", definitionId: value.definitionId,
    versionId: value.versionId, schemaVersion: row.schemaVersion, checksum: row.checksum });
  const compiled = await compileRegisteredView(authority, version.payload);
  return activateCompiledVersionInTransaction(authority.transaction, authority.session, value.definitionId, value.definitionRevision, { ...version, version: row.version }, compiled);
}
