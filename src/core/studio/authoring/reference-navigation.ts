import { z } from "zod";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES } from "../permissions";
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from "../fields/runtime-authority";
import { sealedConfigurationVersionSelection, inspectRetainedConfigurationPin, type SealedConfigurationVersion } from "../configuration/pins";
import { configurationDependencyReferenceSchema, type ConfigurationDependencyReference } from "../configuration/dependency-reference";
import { whereUsedConfigurationInTransaction } from "../configuration/usage";
import { checksum } from "../registry/contracts";
import { entityDetailsSchema } from "../registry/entities";
import { inspectSealedFieldVersion } from "../fields/sealed-field";
import { compileCustomFieldForRead } from "../compiler/fields";
import { assertFieldBinding, fieldDefinitionKey } from "../fields/binding";
import { pageApprovalsSchema, pageDependencySchema } from "../pages/approvals";
import { compilePage } from "../pages/compiler";
import { materialiseCompiledView } from "../views/definition-compiler";
import { viewPayloadSchema } from "../views/schema";
import { entityProfilePayloadSchema, recordTypePayloadSchema } from "../record-types/schema";
import { resolveEntityProfile, resolveRecordTypeProfile, normaliseConfigurationReferences, type ResolvedEntityProfile } from "../record-types/resolver";
import { designReferenceSchema, designReferenceLinks, type ReferenceNavigationContext } from "./reference-links";

const cursorSchema = z.strictObject({ after: z.string().regex(/^[a-f0-9-]{36}@[a-f0-9-]{36}$/), checksum: z.string().regex(/^[a-f0-9]{64}$/) });
export const designReferenceRequestSchema = z.strictObject({ reference: designReferenceSchema, cursor: cursorSchema.optional() });
const frameSchema = z.object({ dependencies: z.array(pageDependencySchema).max(100) });
function broken(): never { throw new Error("DEPENDENCY_BROKEN: saved design reference metadata changed or is unavailable."); }
const forbidden = (error: unknown) => error instanceof Error && error.message.startsWith("FORBIDDEN:");
export type ReferenceUsageModel = {
  name: string; sourceHref: string | null; retired: boolean;
  usages: { name: string; kind: "Screen" | "Business type" | "Business setup" | "Dashboard" | "Additional field";
    status: "Live" | "Saved version" | "Retired"; direct: boolean; href: string | null }[];
  nextHref: string | null;
};

/** Metadata navigation only. Original seals/edges/usage engine remain authoritative.
 * Current native and pinned/current field policies authorise names, not runtime
 * values or old conditions. Retired versions are never fabricated as active. */
async function readDesignReferenceInTransaction(supplied: FieldRuntimeAuthority, input: unknown,
  navigation: ReferenceNavigationContext = {}, metadataOnly = false): Promise<ReferenceUsageModel & { whereUsedHref: string }> {
  const authority = await fieldRuntimeAuthorityInTransaction(supplied.session, supplied.transaction);
  assertCapability(authority.session, STUDIO_CAPABILITIES.read);
  const request = designReferenceRequestSchema.parse(input), tx = authority.transaction, session = authority.session;
  const cache = new Map<string, SealedConfigurationVersion>(), checked = new Set<string>();
  let visits = 0;
  async function load(pin: ConfigurationDependencyReference) {
    const key = `${pin.definitionId}@${pin.versionId}`;
    let row = cache.get(key);
    if (!row) {
      row = await tx.studioDefinitionVersion.findFirst({ where: { organisationId: session.organisationId,
        definitionId: pin.definitionId, id: pin.versionId }, select: sealedConfigurationVersionSelection }) ?? undefined;
      if (!row) broken();
      cache.set(key, row);
    }
    inspectRetainedConfigurationPin(session.organisationId, pin, row);
    return row;
  }
  async function fieldRead(row: SealedConfigurationVersion, definitionId: string) {
    const field = inspectSealedFieldVersion(authority.registry, row, session.organisationId, definitionId);
    await compileCustomFieldForRead(session, { schemaVersion: 1, entity: field.payload.entity,
      storageGeneration: field.payload.storageGeneration, field: field.payload.field }, authority.registry);
    await assertFieldBinding(tx, session, definitionId, field.payload);
    return field;
  }
  async function authorise(pin: ConfigurationDependencyReference, ancestors: string[] = []) {
    const key = `${pin.definitionId}@${pin.versionId}`;
    if (++visits > 500 || ancestors.length > 4 || ancestors.includes(pin.definitionId)) broken();
    const row = await load(pin);
    if (checked.has(key)) return row;
    const sealed = inspectRetainedConfigurationPin(session.organisationId, pin, row);
    if (pin.kind === "customField") {
      const written = await fieldRead(row, pin.definitionId);
      const current = await tx.studioDefinition.findFirst({ where: { organisationId: session.organisationId,
        id: pin.definitionId, kind: "customField" }, select: { organisationId: true, id: true, key: true, activeVersionId: true, retiredAt: true, activeVersion: true } });
      if (!current || current.id !== pin.definitionId || current.organisationId !== session.organisationId
        || current.key !== fieldDefinitionKey(written.payload)
        || (current.activeVersionId === null) !== (current.activeVersion === null)) broken();
      if (current.activeVersion) {
        if (current.activeVersion.id !== current.activeVersionId) broken();
        // Historical source/current grants both apply; storage equality is a
        // runtime concern and must not erase valid retired impact metadata.
        const active = inspectSealedFieldVersion(authority.registry, current.activeVersion, session.organisationId, pin.definitionId);
        if (fieldDefinitionKey(active.payload) !== current.key) broken();
        await assertFieldBinding(tx, session, pin.definitionId, active.payload);
        await compileCustomFieldForRead(session, { schemaVersion: 1, entity: active.payload.entity,
          storageGeneration: active.payload.storageGeneration, field: active.payload.field }, authority.registry);
      } else if (!current.retiredAt) broken();
    } else if (pin.kind === "view") {
      const payload = viewPayloadSchema.parse(row.payload);
      const compiled = await authority.registry.authoriseViewReadInTransaction({ session, transaction: tx }, payload.sourceView, payload.content);
      if (materialiseCompiledView(payload, compiled).checksum !== row.checksum) broken();
    } else if (pin.kind === "page") {
      const frame = z.object({ approvals: pageApprovalsSchema }).parse(row.compiledPlan);
      const plan = compilePage(row.payload, frame.approvals);
      if (checksum(plan) !== row.checksum) broken();
      const source = await authority.registry.resolvePageSourcePolicy({ session, transaction: tx }, plan.approvals.sourcePage);
      for (const dependency of plan.dependencies) await authority.registry.resolve(session, dependency);
      const used = new Set([...plan.base.reads, ...plan.variants.flatMap(variant => variant.layout.reads)]
        .flatMap(read => read.queries.map(query => `${query.id}@${query.version}`)));
      for (const query of plan.approvals.queries) if (used.has(`${query.id}@${query.version}`)) {
        const actual = source.policy.queries.find(value => value.query.id === query.id && value.query.version === query.version);
        if (!actual || checksum(actual.columns.map(({ id, classification, capability, label, format }) => ({ id, classification,
          ...(capability ? { capability } : {}), ...(label ? { label } : {}), ...(format ? { format } : {}) }))) !== checksum(query.columns)) broken();
        for (const column of actual.columns) if (column.capability) assertCapability(session, column.capability);
      }
      const usedNative = new Set([plan.base, ...plan.variants.map(variant => variant.layout)].flatMap(layout =>
        layout.sections.flatMap(section => section.components.flatMap(component => component.type === "fields"
          ? component.fields.flatMap(field => field.source === "native" ? [field.fieldId] : []) : []))));
      for (const field of entityDetailsSchema.parse(source.source.details).fields) if (usedNative.has(field.id) && field.capability) assertCapability(session, field.capability);
      const usedFacts = new Set([plan.base, ...plan.variants.map(variant => variant.layout)].flatMap(layout => [
        ...layout.visibilityFacts, ...layout.sections.flatMap(section => section.components.flatMap(component => component.type === "facts" ? component.factIds : []))]));
      for (const fact of plan.approvals.facts) if (usedFacts.has(fact.id) && fact.capability) assertCapability(session, fact.capability);
    } else if (pin.kind === "entityProfile" || pin.kind === "recordType") {
      const payload = pin.kind === "entityProfile" ? entityProfilePayloadSchema.parse(row.payload) : recordTypePayloadSchema.parse(row.payload);
      const owner = await authority.registry.resolve(session, payload.entity);
      let resolved: ResolvedEntityProfile;
      if (pin.kind === "entityProfile") resolved = resolveEntityProfile(payload)!;
      else {
        const typed = recordTypePayloadSchema.parse(payload), base = await authorise(typed.baseProfile, [...ancestors, pin.definitionId]);
        resolved = resolveRecordTypeProfile({ reference: typed.baseProfile, payload: entityProfilePayloadSchema.parse(base.payload) }, typed, pin.definitionId);
      }
      const plan = z.object({ resolvedProfile: z.unknown() }).parse(row.compiledPlan);
      if (checksum(resolved.profile) !== checksum(plan.resolvedProfile)
        || checksum(normaliseConfigurationReferences(resolved.configurationDependencies, pin.definitionId)) !== checksum(sealed.configurationDependencies)) broken();
      if (resolved.profile.allowedProcesses.length || resolved.profile.defaultDecisions.length) broken();
      const dependencies = new Map<string, z.infer<typeof pageDependencySchema>>();
      const add = (reference: z.infer<typeof pageDependencySchema>) => {
        const current = authority.registry.describe(reference.id, reference.version);
        const expected = { id: current.id, version: current.version, schemaHash: current.schemaHash, contractHash: current.contractHash,
          ownerModuleId: current.ownerModuleId, kind: current.kind, classification: current.classification };
        if (checksum(reference) !== checksum(expected)) broken();
        dependencies.set(`${reference.id}@${reference.version}`, reference);
      };
      add(pageDependencySchema.parse({ id: owner.id, version: owner.version, schemaHash: owner.schemaHash, contractHash: owner.contractHash,
        ownerModuleId: owner.ownerModuleId, kind: owner.kind, classification: owner.classification }));
      for (const child of [...resolved.profile.requiredFields, ...(resolved.profile.page ? [resolved.profile.page] : [])]) {
        const version = await authorise(child, [...ancestors, pin.definitionId]);
        // Structural mirrors include historical conditional/create dependencies;
        // metadata navigation never executes or borrows those operations.
        for (const dependency of frameSchema.parse(version.compiledPlan).dependencies) add(dependency);
      }
      const sorted = [...dependencies.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : a.version - b.version);
      const reconstructed = { kind: pin.kind, schemaVersion: 1, payload, resolvedProfile: resolved.profile,
        dependencies: sorted, configurationDependencies: normaliseConfigurationReferences(resolved.configurationDependencies, pin.definitionId) };
      if (checksum(reconstructed) !== row.checksum) broken();
    } else broken(); // No speculative Process/Decision runtime/authority.
    for (const dependency of sealed.configurationDependencies) await authorise(dependency, [...ancestors, pin.definitionId]);
    checked.add(key);
    return row;
  }
  const target = await authorise(request.reference);
  const definition = await tx.studioDefinition.findFirst({ where: { organisationId: session.organisationId,
    id: request.reference.definitionId, kind: request.reference.kind }, select: { id: true, organisationId: true, name: true, retiredAt: true } });
  if (!definition || definition.id !== request.reference.definitionId || definition.organisationId !== session.organisationId
    || (definition.retiredAt === null) !== (target.definition.retiredAt === null)) broken();
  const links = designReferenceLinks(request.reference, navigation);
  const sourceHref = session.capabilities.has(STUDIO_CAPABILITIES.edit) && definition.retiredAt === null ? links.sourceHref : null;
  if (metadataOnly) return { name: definition.name, sourceHref, retired: definition.retiredAt !== null,
    usages: [], nextHref: null, whereUsedHref: links.whereUsedHref };
  const usage = await whereUsedConfigurationInTransaction(session, tx, { definitionId: request.reference.definitionId,
    versionId: request.reference.versionId, limit: 25, ...(request.cursor ? { cursor: request.cursor } : {}) });
  const labels = { page: "Screen", entityProfile: "Business setup", recordType: "Business type", view: "Dashboard", customField: "Additional field" } as const;
  const usages: ReferenceUsageModel["usages"] = [];
  const canOpenEditor = session.capabilities.has(STUDIO_CAPABILITIES.edit);
  const suffix = navigation.business === undefined ? "" : `?business=${encodeURIComponent(navigation.business)}`;
  for (const item of usage.usages) {
    try { await authorise(configurationDependencyReferenceSchema.parse({ kind: item.kind, definitionId: item.definitionId,
      versionId: item.versionId, schemaVersion: item.schemaVersion, checksum: item.checksum })); }
    catch (error) { if (forbidden(error)) continue; throw error; }
    if (!(item.kind in labels)) broken();
    const kind = item.kind as keyof typeof labels;
    const destination = kind === "page" ? "" : kind === "view" ? "dashboards/" : "setup/";
    usages.push({ name: item.name, kind: labels[kind], status: item.retiredAt ? "Retired" : item.active ? "Live" : "Saved version",
      direct: item.depth === 1, href: canOpenEditor && item.retiredAt === null ? `/design-studio/${destination}${item.definitionId}${suffix}` : null });
  }
  const next = usage.next ? new URL(links.whereUsedHref, "https://atlas.invalid") : null;
  if (next && usage.next) { next.searchParams.set("after", usage.next.after); next.searchParams.set("cursorChecksum", usage.next.checksum); }
  return { name: definition.name, sourceHref: canOpenEditor && definition.retiredAt === null ? links.sourceHref : null, retired: definition.retiredAt !== null,
    usages, nextHref: next ? `${next.pathname}${next.search}` : null, whereUsedHref: links.whereUsedHref };
}

/** Exact retained metadata and current rights, without reading usage counts or
 * business records. Links are navigation only; the destination refreshes rights. */
export async function readDesignReferenceMetadataInTransaction(authority: FieldRuntimeAuthority,
  reference: unknown, navigation: ReferenceNavigationContext = {}) {
  const result = await readDesignReferenceInTransaction(authority, { reference }, navigation, true);
  return { name: result.name, sourceHref: result.sourceHref, whereUsedHref: result.whereUsedHref, retired: result.retired };
}
export async function readDesignReferenceUsageInTransaction(authority: FieldRuntimeAuthority, input: unknown,
  navigation: ReferenceNavigationContext = {}): Promise<ReferenceUsageModel> {
  const result = await readDesignReferenceInTransaction(authority, input, navigation);
  return { name: result.name, sourceHref: result.sourceHref, retired: result.retired, usages: result.usages, nextHref: result.nextHref };
}
