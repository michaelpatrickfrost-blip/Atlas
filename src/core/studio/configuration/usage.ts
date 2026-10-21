import { z } from "zod";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { checksum } from "../registry/contracts";
import { configurationReferenceSchema, type ConfigurationReference } from "../record-types";
import { inspectRetainedConfigurationPin } from "./pins";

const uuid = z.uuid().transform(value => value.toLowerCase());
const targetSchema = z.strictObject({ definitionId: uuid, versionId: uuid.optional() });
const requestSchema = targetSchema.extend({ limit: z.number().int().min(1).max(50).default(25),
  cursor: z.strictObject({ after: z.string().regex(/^[a-f0-9-]{36}@[a-f0-9-]{36}$/), checksum: z.string().regex(/^[a-f0-9]{64}$/) }).optional() });
const definitionSelect = { id: true, organisationId: true, kind: true, name: true, activeVersionId: true, retiredAt: true,
  activeVersion: { select: { id: true, definitionId: true, organisationId: true } } } as const;
const versionSelect = { id: true, organisationId: true, definitionId: true, schemaVersion: true, payload: true, compiledPlan: true, checksum: true,
  definition: { select: definitionSelect }, configurationDependencies: { select: { organisationId: true, definitionId: true, versionId: true,
    targetDefinitionId: true, targetVersionId: true, targetKind: true, targetSchemaVersion: true, targetChecksum: true }, take: 203 } } as const;
const edgeSelect = { organisationId: true, definitionId: true, versionId: true, targetDefinitionId: true, targetVersionId: true,
  targetKind: true, targetSchemaVersion: true, targetChecksum: true } as const;
type Definition = Prisma.StudioDefinitionGetPayload<{ select: typeof definitionSelect }>;
type Version = Prisma.StudioDefinitionVersionGetPayload<{ select: typeof versionSelect }>;
type Edge = Prisma.StudioConfigurationDependencyGetPayload<{ select: typeof edgeSelect }>;
export type ConfigurationUsageTarget = z.input<typeof targetSchema>;
export type ConfigurationUsageRequest = z.input<typeof requestSchema>;
export type ConfigurationUsage = ConfigurationReference & {
  name: string; activeVersionId: string | null; retiredAt: string | null; active: boolean;
  depth: number; activeAncestorVersionIds: string[];
};
export type ConfigurationUsagePage = { usages: ConfigurationUsage[];
  next: { after: string; checksum: string } | null };

function broken(): never { throw new Error("DEPENDENCY_BROKEN: configuration impact metadata is unavailable or exceeds its bounded graph."); }
function conflict(): never { throw new Error("CONFLICT: configuration usage changed. Refresh this impact review."); }
function definitionIdentity(organisationId: string, id: string, definition: Definition) {
  if (definition.id !== id || definition.organisationId !== organisationId
    || (definition.activeVersionId === null) !== (definition.activeVersion === null)) broken();
  if (definition.activeVersion && (definition.activeVersion.id !== definition.activeVersionId
    || definition.activeVersion.definitionId !== id || definition.activeVersion.organisationId !== organisationId)) broken();
}
function key(reference: Pick<ConfigurationReference, "definitionId" | "versionId">) {
  return `${reference.definitionId}@${reference.versionId}`;
}
function reference(version: Version): ConfigurationReference {
  const parsed = configurationReferenceSchema.safeParse({ kind: version.definition.kind, definitionId: version.definitionId,
    versionId: version.id, schemaVersion: version.schemaVersion, checksum: version.checksum });
  if (!parsed.success) broken();
  return parsed.data;
}

/** Internal metadata snapshot only, never a permission/data grant. The caller
 * authorises access and owns one consistent transaction. Mutating callers must
 * coordinate this read with the original publication/activation/binding locks
 * and CAS/Serializable transaction; this helper supplies no lock or retry engine.
 * Native record-type assignments are a separate required impact check. */
async function inspectIncoming(session: Session, tx: Prisma.TransactionClient, supplied: ConfigurationUsageTarget) {
  const target = targetSchema.parse(supplied), organisationId = session.organisationId;
  const definition = await tx.studioDefinition.findFirst({ where: { id: target.definitionId, organisationId }, select: definitionSelect });
  if (!definition) broken();
  definitionIdentity(organisationId, target.definitionId, definition);
  const cache = new Map<string, Version>(), usages = new Map<string, ConfigurationUsage>();
  const incoming = new Map<string, Edge[]>();
  const edgesSeen = new Set<string>(); let paths = 0;
  async function load(definitionId: string, versionId: string) {
    const identity = `${definitionId}@${versionId}`;
    let version = cache.get(identity);
    if (!version) {
      if (cache.size >= 500) broken();
      const row = await tx.studioDefinitionVersion.findFirst({ where: { id: versionId, definitionId, organisationId }, select: versionSelect });
      if (!row || row.id !== versionId || row.definitionId !== definitionId || row.organisationId !== organisationId) broken();
      definitionIdentity(organisationId, definitionId, row.definition);
      inspectRetainedConfigurationPin(organisationId, reference(row), row);
      version = row; cache.set(identity, version);
    }
    return version;
  }
  if (target.versionId) await load(target.definitionId, target.versionId);
  async function walk(definitionId: string, versionId: string | undefined,
    ancestors: readonly string[], descendants: readonly string[], depth: number) {
    const incomingKey = `${definitionId}@${versionId ?? "*"}`, remaining = 500 - paths;
    let edges = incoming.get(incomingKey);
    if (!edges) {
      edges = await tx.studioConfigurationDependency.findMany({ where: { organisationId, targetDefinitionId: definitionId,
        ...(versionId ? { targetVersionId: versionId } : {}) }, select: edgeSelect,
        orderBy: [{ definitionId: "asc" }, { versionId: "asc" }], take: remaining + 1 });
      incoming.set(incomingKey, edges);
    }
    if (edges.length > remaining) broken();
    for (const edge of edges) {
      if (++paths > 500 || depth > 4 || edge.organisationId !== organisationId || edge.targetDefinitionId !== definitionId
        || (versionId !== undefined && edge.targetVersionId !== versionId) || ancestors.includes(edge.definitionId)) broken();
      const edgeKey = `${edge.versionId}@${edge.targetDefinitionId}`;
      if (!edgesSeen.has(edgeKey)) { edgesSeen.add(edgeKey); if (edgesSeen.size > 500) broken(); }
      const child = await load(edge.targetDefinitionId, edge.targetVersionId), childPin = reference(child);
      if (childPin.kind !== edge.targetKind || childPin.schemaVersion !== edge.targetSchemaVersion || childPin.checksum !== edge.targetChecksum) broken();
      const parent = await load(edge.definitionId, edge.versionId), parentPin = reference(parent);
      const declared = inspectRetainedConfigurationPin(organisationId, parentPin, parent).configurationDependencies;
      if (!declared.some(pin => key(pin) === key(childPin) && checksum(pin) === checksum(childPin))) broken();
      const parentKey = key(parentPin);
      let usage = usages.get(parentKey);
      if (!usage) {
        if (usages.size >= 500) broken();
        usage = { ...parentPin, name: parent.definition.name, activeVersionId: parent.definition.activeVersionId,
          retiredAt: parent.definition.retiredAt?.toISOString() ?? null,
          active: parent.definition.retiredAt === null && parent.definition.activeVersionId === parent.id,
          depth, activeAncestorVersionIds: [] };
        usages.set(parentKey, usage);
      } else usage.depth = Math.min(usage.depth, depth);
      if (usage.active) {
        // Retired intermediate metadata must not hide a still-active ancestor.
        // Even a damaged historical pointer blocks safely before mutation.
        for (const descendantKey of [...descendants, parentKey]) {
          const descendant = usages.get(descendantKey);
          if (descendant && !descendant.activeAncestorVersionIds.includes(parent.id)) descendant.activeAncestorVersionIds.push(parent.id);
        }
      }
      await walk(parent.definitionId, parent.id, [...ancestors, parent.definitionId], [...descendants, parentKey], depth + 1);
    }
  }
  await walk(target.definitionId, target.versionId, [target.definitionId], [], 1);
  const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
  const result = [...usages.values()].sort((a, b) => compare(key(a), key(b)));
  for (const usage of result) usage.activeAncestorVersionIds.sort();
  const seal = checksum({ organisationId, target, definition, usages: result,
    versions: [...cache.values()].map(version => ({ reference: reference(version), definition: version.definition }))
      .sort((a, b) => compare(key(a.reference), key(b.reference))) });
  return { usages: result, checksum: seal };
}

/** Published where-used metadata only. Draft JSON is intentionally not queried
 * or trusted as a sealed runtime dependency. Pagination binds the full bounded
 * graph's pins, current pointers and retirement state, not a mutable display key. */
export async function whereUsedConfigurationInTransaction(session: Session, tx: Prisma.TransactionClient,
  supplied: ConfigurationUsageRequest): Promise<ConfigurationUsagePage> {
  const request = requestSchema.parse(supplied), snapshot = await inspectIncoming(session, tx,
    { definitionId: request.definitionId, ...(request.versionId ? { versionId: request.versionId } : {}) });
  let start = 0;
  if (request.cursor) {
    if (request.cursor.checksum !== snapshot.checksum) conflict();
    const previous = snapshot.usages.findIndex(usage => key(usage) === request.cursor!.after);
    if (previous < 0) conflict();
    start = previous + 1;
  }
  const usages = snapshot.usages.slice(start, start + request.limit), last = usages.at(-1);
  return { usages, next: start + request.limit < snapshot.usages.length && last
    ? { after: key(last), checksum: snapshot.checksum } : null };
}

/** Caller-owned safe mutation prerequisite; it is deliberately conservative
 * about any active ancestor through retained (including retired) versions.
 * This checks configuration edges only, not canonical native assignments. */
export async function assertNoActiveConfigurationDependantsInTransaction(session: Session, tx: Prisma.TransactionClient,
  supplied: ConfigurationUsageTarget): Promise<void> {
  const snapshot = await inspectIncoming(session, tx, supplied);
  if (snapshot.usages.some(usage => usage.active)) throw new Error("CONFIGURATION_IN_USE: an active business design still references this configuration.");
}
