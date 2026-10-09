import { z } from "zod";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import type { Prisma } from "@/generated/prisma/client";
import { STUDIO_CAPABILITIES as CAP } from "../permissions";
import { kernelPayloadSchema } from "../compiler/kernel";
import { compileDefinition, parseDefinitionPayload } from "../compiler";
import { customFieldPayloadSchema } from "../fields/schema";
import { assertFieldBinding, bindPublishedField, fieldDefinitionKey } from "../fields/binding";
import { studioRegistry } from "../registry/runtime";
import { checksum } from "../registry/contracts";
const uuid = z.uuid();
const revision = z.number().int().nonnegative();
const identity = { key: z.string().regex(/^[a-z][a-z0-9_.-]{0,99}$/), name: z.string().min(1).max(150) };
const createSchema = z.discriminatedUnion("kind", [
  z.strictObject({ ...identity, kind: z.literal("capabilitySet"), payload: kernelPayloadSchema }),
  z.strictObject({ ...identity, kind: z.literal("customField"), payload: customFieldPayloadSchema }),
]);
const updateSchema = z.strictObject({ definitionId: uuid, revision, payload: z.union([kernelPayloadSchema, customFieldPayloadSchema]) });
const publishSchema = z.strictObject({ definitionId: uuid, revision, acknowledgeWarnings: z.boolean() });
const activateSchema = z.strictObject({ definitionId: uuid, versionId: uuid, revision });
function conflict(): never { throw new Error("CONFLICT: another editor changed this definition. Reload and compare your draft before saving."); }
const audit = (session: Session, action: string, id: string, after: unknown, tx: Prisma.TransactionClient) => writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action, entityType: "StudioDefinition", entityId: id, after }, tx);

export async function listDefinitions(session: Session) {
  assertCapability(session, CAP.read);
  await assertModuleEnabled(session, "studio");
  return db.studioDefinition.findMany({ where: { organisationId: session.organisationId }, orderBy: { updatedAt: "desc" }, take: 100,
    select: { id: true, key: true, kind: true, name: true, revision: true, latestVersion: true, activeVersionId: true, retiredAt: true } });
}
export async function getDefinition(session: Session, id: string) {
  assertCapability(session, CAP.read);
  await assertModuleEnabled(session, "studio");
  return db.studioDefinition.findFirst({ where: { id: uuid.parse(id), organisationId: session.organisationId },
    include: { draft: true, versions: { orderBy: { version: "desc" }, take: 100, select: { id: true, version: true, semanticVersion: true, checksum: true, publishedAt: true, createdBy: true } } } });
}
export async function createDraft(session: Session, input: unknown) {
  assertCapability(session, CAP.edit);
  await assertModuleEnabled(session, "studio");
  const value = createSchema.parse(input);
  if (value.kind === "customField" && value.key !== fieldDefinitionKey(value.payload)) throw new Error("Field definition key must match its permanent entity and field key.");
  return db.$transaction(async tx => {
    const definition = await tx.studioDefinition.create({ data: { organisationId: session.organisationId, key: value.key, kind: value.kind, name: value.name, createdBy: session.userId,
      draft: { create: { editorUserId: session.userId, payload: value.payload } } }, select: { id: true } });
    await audit(session, "studio.draft.created", definition.id, { key: value.key, kind: value.kind }, tx);
    return definition;
  });
}
export async function updateDraft(session: Session, input: unknown) {
  assertCapability(session, CAP.edit);
  await assertModuleEnabled(session, "studio");
  const value = updateSchema.parse(input);
  return db.$transaction(async tx => {
    const definition = await tx.studioDefinition.findFirst({ where: { id: value.definitionId, organisationId: session.organisationId, retiredAt: null }, select: { kind: true, key: true } });
    if (!definition) conflict();
    const payload = parseDefinitionPayload(definition.kind, value.payload);
    if (definition.kind === "customField" && definition.key !== fieldDefinitionKey(customFieldPayloadSchema.parse(payload))) throw new Error("Field definition key must match its permanent entity and field key.");
    const result = await tx.studioDraft.updateMany({ where: { definitionId: value.definitionId, organisationId: session.organisationId, revision: value.revision, definition: { retiredAt: null } },
      data: { payload, revision: { increment: 1 }, editorUserId: session.userId, validation: PrismaJsonNull } });
    if (result.count !== 1) conflict();
    await audit(session, "studio.draft.updated", value.definitionId, { revision: value.revision + 1 }, tx);
    return { revision: value.revision + 1 };
  });
}
// Prisma's JSON null sentinel is obtained from the generated runtime, not persisted
// as a client-supplied arbitrary value.
import { Prisma as PrismaRuntime } from "@/generated/prisma/client";
const PrismaJsonNull = PrismaRuntime.DbNull;

export async function validateDraft(session: Session, definitionId: string, expectedRevision: number) {
  assertCapability(session, CAP.edit);
  await assertModuleEnabled(session, "studio");
  const id = uuid.parse(definitionId), expected = revision.parse(expectedRevision);
  const draft = await db.studioDraft.findFirst({ where: { definitionId: id, organisationId: session.organisationId, revision: expected, definition: { retiredAt: null } }, include: { definition: { select: { kind: true } } } });
  if (!draft) conflict();
  const compiled = await compileDefinition(session, draft.definition.kind, draft.payload, studioRegistry());
  const result = await db.studioDraft.updateMany({ where: { id: draft.id, organisationId: session.organisationId, revision: expected }, data: { validation: { checksum: compiled.checksum, warnings: compiled.warnings, validatedRevision: expected } } });
  if (result.count !== 1) conflict();
  return { checksum: compiled.checksum, warnings: compiled.warnings };
}
export async function publishDraft(session: Session, input: unknown) {
  assertCapability(session, CAP.publish);
  await assertModuleEnabled(session, "studio");
  const value = publishSchema.parse(input);
  const draft = await db.studioDraft.findFirst({ where: { definitionId: value.definitionId, organisationId: session.organisationId, revision: value.revision, definition: { retiredAt: null } }, include: { definition: true, baseVersion: { select: { version: true } } } });
  if (!draft) conflict();
  // Always compile on the server; previous validation and client plans are untrusted.
  const compiled = await compileDefinition(session, draft.definition.kind, draft.payload, studioRegistry());
  if (compiled.warnings.length && !value.acknowledgeWarnings) throw new Error("Acknowledge publication warnings first.");
  if (draft.definition.latestVersion !== (draft.baseVersion?.version ?? 0)) conflict();
  return db.$transaction(async tx => {
    const modules = [...new Set(compiled.plan.dependencies.map(d => d.ownerModuleId))];
    const available = await tx.moduleState.count({ where: { organisationId: session.organisationId, moduleId: { in: modules }, enabled: true, entitled: true } });
    if (available !== modules.length) throw new Error("DEPENDENCY_BROKEN: source module unavailable");
    const changed = await tx.studioDefinition.updateMany({ where: { id: value.definitionId, organisationId: session.organisationId, revision: draft.definition.revision, latestVersion: draft.definition.latestVersion, retiredAt: null }, data: { latestVersion: { increment: 1 }, revision: { increment: 1 } } });
    if (changed.count !== 1) conflict();
    const number = draft.definition.latestVersion + 1;
    const version = await tx.studioDefinitionVersion.create({ data: { organisationId: session.organisationId, definitionId: value.definitionId, version: number, semanticVersion: `1.0.${number - 1}`, schemaVersion: 1,
      payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum, createdBy: session.userId,
      dependencies: { create: compiled.plan.dependencies.map(ref => ({ ownerModuleId: ref.ownerModuleId, contractId: ref.id, contractVersion: ref.version, schemaHash: ref.schemaHash, contractHash: ref.contractHash } satisfies Prisma.StudioDependencyCreateWithoutVersionInput)) } } });
    if (compiled.plan.kind === "customField") await bindPublishedField(tx, session, value.definitionId, draft.definition.key, version.id, compiled.plan.payload);
    const updated = await tx.studioDraft.updateMany({ where: { id: draft.id, organisationId: session.organisationId, revision: value.revision }, data: { revision: { increment: 1 }, baseVersionId: version.id, validation: { checksum: compiled.checksum, warnings: compiled.warnings, validatedRevision: value.revision } } });
    if (updated.count !== 1) conflict();
    await audit(session, "studio.definition.published", value.definitionId, { versionId: version.id, version: number, checksum: compiled.checksum, warnings: compiled.warnings }, tx);
    return { versionId: version.id, version: number, revision: value.revision + 1 };
  }, { isolationLevel: "Serializable" });
}
export async function activateVersion(session: Session, input: unknown) {
  assertCapability(session, CAP.publish);
  await assertModuleEnabled(session, "studio");
  const value = activateSchema.parse(input);
  const version = await db.studioDefinitionVersion.findFirst({ where: { id: value.versionId, definitionId: value.definitionId, organisationId: session.organisationId }, include: { definition: { select: { kind: true } } } });
  if (!version) throw new Error("This Studio version is unavailable.");
  const compiled = await compileDefinition(session, version.definition.kind, version.payload, studioRegistry());
  if (version.checksum !== checksum(version.compiledPlan) || version.checksum !== compiled.checksum) throw new Error("DEPENDENCY_BROKEN: published Studio plan changed or is incompatible");
  return db.$transaction(async tx => {
    if (compiled.plan.kind === "customField") await assertFieldBinding(tx, session, value.definitionId, compiled.plan.payload);
    const modules = [...new Set(compiled.plan.dependencies.map(d => d.ownerModuleId))];
    if (await tx.moduleState.count({ where: { organisationId: session.organisationId, moduleId: { in: modules }, enabled: true, entitled: true } }) !== modules.length) throw new Error("DEPENDENCY_BROKEN: source module unavailable");
    const changed = await tx.studioDefinition.updateMany({ where: { id: value.definitionId, organisationId: session.organisationId, revision: value.revision, retiredAt: null }, data: { activeVersionId: version.id, revision: { increment: 1 } } });
    if (changed.count !== 1) conflict();
    await audit(session, "studio.definition.activated", value.definitionId, { versionId: version.id, version: version.version }, tx);
    return { revision: value.revision + 1 };
  }, { isolationLevel: "Serializable" });
}
/** Read an active metadata plan; recheck owner availability and contracts every time. */
export async function activeDefinition(session: Session, definitionId: string) {
  assertCapability(session, CAP.read);
  await assertModuleEnabled(session, "studio");
  const definition = await db.studioDefinition.findFirst({ where: { id: uuid.parse(definitionId), organisationId: session.organisationId, retiredAt: null }, include: { activeVersion: true } });
  if (!definition?.activeVersion) return null;
  const version = definition.activeVersion;
  const compiled = await compileDefinition(session, definition.kind, version.payload, studioRegistry());
  if (version.checksum !== checksum(version.compiledPlan) || version.checksum !== compiled.checksum) throw new Error("DEPENDENCY_BROKEN: published plan incompatible");
  if (compiled.plan.kind === "customField") await assertFieldBinding(db, session, definition.id, compiled.plan.payload);
  return { versionId: version.id, version: version.version, plan: compiled.plan };
}
export async function compareVersions(session: Session, definitionId: string, leftId: string, rightId: string) {
  assertCapability(session, CAP.read);
  await assertModuleEnabled(session, "studio");
  const versions = await db.studioDefinitionVersion.findMany({ where: { definitionId: uuid.parse(definitionId), organisationId: session.organisationId, id: { in: [uuid.parse(leftId), uuid.parse(rightId)] } }, select: { id: true, version: true, payload: true, checksum: true } });
  const left = versions.find(v => v.id === leftId), right = versions.find(v => v.id === rightId);
  if (!left || !right) throw new Error("This Studio version is unavailable.");
  return { left, right };
}
