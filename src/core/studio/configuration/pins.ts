import { viewVersionReferenceSchema, type ViewVersionReference } from "../views/schema";
import { z } from "zod";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { checksum } from "../registry/contracts";
import { configurationDependencyReferenceSchema, normaliseConfigurationDependencyReferences, type ConfigurationDependencyReference } from "./dependency-reference";

const planFrame = z.object({ kind: z.string(), schemaVersion: z.number().int().positive(), payload: z.unknown(),
  configurationDependencies: z.array(configurationDependencyReferenceSchema).max(202).optional() });
export const sealedConfigurationVersionSelection = { id: true, organisationId: true, definitionId: true, schemaVersion: true, payload: true, compiledPlan: true, checksum: true,
  definition: { select: { kind: true, retiredAt: true } },
  configurationDependencies: { select: { organisationId: true, definitionId: true, versionId: true,
    targetDefinitionId: true, targetVersionId: true, targetKind: true, targetSchemaVersion: true, targetChecksum: true }, take: 203 } } as const;
export type SealedConfigurationVersion = Prisma.StudioDefinitionVersionGetPayload<{ select: typeof sealedConfigurationVersionSelection }>;

function broken(): never { throw new Error("DEPENDENCY_BROKEN: a published design reference is unavailable or has changed."); }

/** Internal metadata primitive, not a data/security grant. The owning compiler or
 * runtime must independently enforce current module/capabilities/record access.
 * Always scope the exact immutable pin to the authenticated server tenant. */
export async function loadSealedConfigurationVersion(session: Session, tx: Prisma.TransactionClient, input: unknown) {
  const ref = configurationDependencyReferenceSchema.parse(input);
  const version = await tx.studioDefinitionVersion.findFirst({ where: { id: ref.versionId, definitionId: ref.definitionId,
    organisationId: session.organisationId }, select: sealedConfigurationVersionSelection });
  if (!version) broken();
  inspectConfigurationPin(session.organisationId, ref, version);
  return version;
}

/** Shape, seal and persisted-edge mirror only; no permission impersonation or
 * value read. Artefact-specific compilers must additionally reconstruct the plan. */
export function inspectConfigurationPin(organisationId: string, input: unknown, version: SealedConfigurationVersion) {
  return inspectSealedDefinitionPin(organisationId, configurationDependencyReferenceSchema.parse(input), version, false);
}

/** Retained history metadata only. Retirement cannot erase a sealed reference
 * from impact analysis; this does not approve runtime use or grant any access. */
export function inspectRetainedConfigurationPin(organisationId: string, input: unknown, version: SealedConfigurationVersion) {
  return inspectSealedDefinitionPin(organisationId, configurationDependencyReferenceSchema.parse(input), version, true);
}

/** Explicit standalone-view wrappers share the seal body without expanding
 * the profile eligibility reference enum or accepting unparsed typed input. */
export function inspectViewVersionPin(organisationId: string, input: unknown, version: SealedConfigurationVersion) {
  return inspectSealedDefinitionPin(organisationId, viewVersionReferenceSchema.parse(input), version, false);
}
export function inspectRetainedViewVersionPin(organisationId: string, input: unknown, version: SealedConfigurationVersion) {
  return inspectSealedDefinitionPin(organisationId, viewVersionReferenceSchema.parse(input), version, true);
}

/** Shared exact seal body. Wrappers parse their explicit artefact family before
 * entering; the graph-only reference grammar does not widen profile eligibility. */
function inspectSealedDefinitionPin<Pin extends ConfigurationDependencyReference | ViewVersionReference>(
  organisationId: string, ref: Pin, version: SealedConfigurationVersion, allowRetired = false) {
  const parsed = planFrame.safeParse(version.compiledPlan);
  if (!parsed.success || version.id !== ref.versionId || version.definitionId !== ref.definitionId || version.organisationId !== organisationId
    || version.definition.kind !== ref.kind || (!allowRetired && version.definition.retiredAt !== null) || version.schemaVersion !== ref.schemaVersion
    || version.checksum !== ref.checksum || parsed.data.kind !== ref.kind || parsed.data.schemaVersion !== ref.schemaVersion
    || checksum(version.compiledPlan) !== ref.checksum || checksum(version.payload) !== checksum(parsed.data.payload)) broken();
  const declared = normaliseConfigurationDependencyReferences(parsed.data.configurationDependencies ?? [], version.definitionId);
  if ((parsed.data.configurationDependencies?.length ?? 0) !== declared.length || version.configurationDependencies.length !== declared.length) broken();
  const stored: ConfigurationDependencyReference[] = [];
  for (const edge of version.configurationDependencies) {
    if (edge.organisationId !== organisationId || edge.definitionId !== version.definitionId || edge.versionId !== version.id) broken();
    const pin = configurationDependencyReferenceSchema.safeParse({ kind: edge.targetKind, definitionId: edge.targetDefinitionId,
      versionId: edge.targetVersionId, schemaVersion: edge.targetSchemaVersion, checksum: edge.targetChecksum });
    if (!pin.success) broken();
    stored.push(pin.data);
  }
  if (checksum(normaliseConfigurationDependencyReferences(stored, version.definitionId)) !== checksum(declared)) broken();
  return { reference: ref, payload: version.payload, configurationDependencies: declared };
}

/** Metadata graph for publication/activation. Exact immutable version pins,
 * <=4 edges deep and <=500 traversed paths; no inherited runtime walk. All
 * targets are loaded tenant-scoped even if the caller supplied a plausible seal. */
export async function inspectConfigurationGraph(session: Session, tx: Prisma.TransactionClient,
  references: readonly ConfigurationDependencyReference[], ownDefinitionId: string) {
  const roots = normaliseConfigurationDependencyReferences(references, ownDefinitionId);
  const cache = new Map<string, Awaited<ReturnType<typeof loadSealedConfigurationVersion>>>();
  let paths = 0;
  async function visit(ref: ConfigurationDependencyReference, ancestors: readonly string[], depth: number) {
    if (++paths > 500 || depth > 4 || ancestors.includes(ref.definitionId)) broken();
    const key = `${ref.definitionId}@${ref.versionId}`;
    let version = cache.get(key);
    if (!version) { version = await loadSealedConfigurationVersion(session, tx, ref); cache.set(key, version); }
    const sealed = inspectConfigurationPin(session.organisationId, ref, version);
    for (const child of sealed.configurationDependencies) await visit(child, [...ancestors, ref.definitionId], depth + 1);
  }
  for (const ref of roots) await visit(ref, [ownDefinitionId.toLowerCase()], 1);
  return cache;
}
