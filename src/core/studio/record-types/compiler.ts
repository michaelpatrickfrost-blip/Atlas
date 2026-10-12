import { z } from "zod";
import { sessionAuthorityStamp } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { checksum } from "../registry/contracts";
import { entityDetailsSchema } from "../registry/entities";
import type { CapabilityRegistry } from "../registry/registry";
import type { ContractMetadata, ContractReference } from "../registry/types";
import { inspectConfigurationGraph, loadSealedConfigurationVersion } from "../configuration/pins";
import { inspectSealedFieldVersion } from "../fields/sealed-field";
import { assertFieldAccess } from "../fields/validation";
import { assertFieldBinding } from "../fields/binding";
import { entityProfilePayloadSchema, recordTypePayloadSchema, type ConfigurationReference, type EntityProfilePayload, type RecordTypePayload, type EntityProfile } from "./schema";
import { normaliseConfigurationReferences, resolveEntityProfile, resolveRecordTypeProfile, type ResolvedEntityProfile } from "./resolver";
import { compileRetainedStructuredPage } from "../pages/definition-compiler";

type Dependency = Pick<ContractMetadata, "id" | "version" | "schemaHash" | "contractHash" | "ownerModuleId" | "kind" | "classification">;
type CompileContext = { session: Session; transaction: Prisma.TransactionClient; registry: CapabilityRegistry; definitionId: string };
export type CompiledRecordProfile = { payload: EntityProfilePayload | RecordTypePayload;
  plan: { kind: "entityProfile" | "recordType"; schemaVersion: 1; payload: EntityProfilePayload | RecordTypePayload;
    resolvedProfile: EntityProfile; dependencies: Dependency[]; configurationDependencies: ConfigurationReference[] };
  checksum: string; warnings: string[] };
const structural = (payload: unknown) => {
  const parsed = z.object({ field: z.object({ label: z.string(), help: z.string().optional() }).passthrough() }).passthrough().parse(payload);
  return checksum({ ...parsed, field: { ...parsed.field, label: "", help: "" } });
};
function unavailable(): never { throw new Error("DEPENDENCY_BROKEN: a record design reference is unavailable or incompatible."); }

/** Authoring compiler only. Runtime must independently refresh the authenticated
 * owner/record/field policy; a materialised plan is never an access grant. The
 * public publisher is deliberately not wired until binding and affected-record
 * requirement enforcement are implemented together. */
export async function compileRecordProfile(context: CompileContext, kind: "entityProfile" | "recordType", input: unknown): Promise<CompiledRecordProfile> {
  const { session, transaction, registry } = context, definitionId = z.uuid().parse(context.definitionId).toLowerCase();
  const payload = kind === "entityProfile" ? entityProfilePayloadSchema.parse(input) : recordTypePayloadSchema.parse(input);
  const owner = await registry.resolve(session, payload.entity);
  if (owner.kind !== "entity" || (kind === "recordType" && !entityDetailsSchema.parse(owner.details).extensionPolicy.recordTypes)) unavailable();
  let resolved: ResolvedEntityProfile;
  if (kind === "entityProfile") {
    resolved = resolveEntityProfile(payload)!;
  } else {
    const type = recordTypePayloadSchema.parse(payload);
    const base = await loadSealedConfigurationVersion(session, transaction, type.baseProfile);
    const basePayload = entityProfilePayloadSchema.parse(base.payload);
    // Reconstruct the base plan as well as its generic seal. A forged but
    // self-consistent arbitrary compiledPlan cannot supply inheritance metadata.
    const compiledBase = await compileRecordProfile({ ...context, definitionId: type.baseProfile.definitionId }, "entityProfile", basePayload);
    if (compiledBase.checksum !== base.checksum) unavailable();
    resolved = resolveRecordTypeProfile({ reference: type.baseProfile, payload: basePayload }, type, definitionId);
  }
  if (resolved.profile.allowedProcesses.length || resolved.profile.defaultDecisions.length)
    throw new Error("This record design requires a later Process or Decision compiler.");
  const references = normaliseConfigurationReferences(resolved.configurationDependencies, definitionId);
  await inspectConfigurationGraph(session, transaction, references, definitionId);
  const dependencies = new Map<string, Dependency>();
  const warnings = new Set<string>();
  async function add(reference: ContractReference) {
    const metadata = await registry.resolve(session, reference);
    const key = `${metadata.id}@${metadata.version}`;
    const dependency: Dependency = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash,
      ownerModuleId: metadata.ownerModuleId, kind: metadata.kind, classification: metadata.classification };
    const previous = dependencies.get(key);
    if (previous && checksum(previous) !== checksum(dependency)) unavailable();
    dependencies.set(key, dependency);
    if (dependencies.size > 100) throw new Error("This record design has too many module dependencies.");
    if (metadata.lifecycle === "deprecated") warnings.add(`Deprecated: ${metadata.id}@${metadata.version} supported until ${metadata.supportedUntil}`);
  }
  await add(resolved.entity);
  if (resolved.profile.page) {
    const page = await loadSealedConfigurationVersion(session, transaction, resolved.profile.page);
    const stamp = sessionAuthorityStamp(session);
    if (!stamp) throw new Error("FORBIDDEN: Page references require genuine current authoring authority.");
    const compiledPage = await compileRetainedStructuredPage({ session, transaction, registry, stamp }, page);
    if (compiledPage.checksum !== page.checksum || compiledPage.payload.entity.id !== resolved.entity.id) unavailable();
    for (const dependency of compiledPage.plan.dependencies) await add(dependency);
    compiledPage.warnings.forEach(warning => warnings.add(warning));
  }
  for (const reference of resolved.profile.requiredFields) {
    const version = await loadSealedConfigurationVersion(session, transaction, reference);
    const field = inspectSealedFieldVersion(registry, version, session.organisationId, reference.definitionId);
    if (field.payload.entity.id !== resolved.entity.id) unavailable();
    assertFieldAccess(session, field.payload.field, "write");
    await assertFieldBinding(transaction, session, reference.definitionId, field.payload);
    const current = await transaction.studioDefinition.findFirst({ where: { id: reference.definitionId, organisationId: session.organisationId,
      kind: "customField", retiredAt: null }, select: { activeVersion: true } });
    if (!current?.activeVersion) unavailable();
    const active = inspectSealedFieldVersion(registry, current.activeVersion, session.organisationId, reference.definitionId);
    // A cosmetic label/help publication may coexist with a retained exact pin.
    // Storage generation, constraint, required-if and security changes require
    // an explicit replacement of this profile's field pin before activation.
    if (active.schemaVersion !== field.schemaVersion || structural(active.payload) !== structural(field.payload)) unavailable();
    assertFieldAccess(session, active.payload.field, "write");
    for (const dependency of field.dependencies) await add(dependency);
  }
  const sorted = [...dependencies.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : a.version - b.version);
  const plan = { kind, schemaVersion: 1 as const, payload, resolvedProfile: resolved.profile,
    dependencies: sorted, configurationDependencies: references as ConfigurationReference[] };
  return { payload, plan, checksum: checksum(plan), warnings: [...warnings].sort() };
}
