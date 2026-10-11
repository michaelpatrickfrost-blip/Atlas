import type { FieldRuntimeAuthority } from "../fields/runtime-authority";
import type { ContractMetadata } from "../registry/types";
import { reconstructPageApprovalsInTransaction } from "../pages/server-approvals";
import { authoredPageFieldPins, pageReadScope } from "../pages/definition-compiler";
import { compilePage } from "../pages/compiler";
import type { PagePayload } from "../pages/schema";
import type { PagePresentationCatalog } from "../pages/design-model";
import type { PageEditorFieldChoice, PageEditorPaletteItem } from "@/components/studio/page-editor";
import { checksum } from "../registry/contracts";
import { STUDIO_CAPABILITIES } from "../permissions";
import { assertCapability } from "@/core/permissions/check";
import { entityDetailsSchema } from "../registry/entities";
import { inspectSealedFieldVersion } from "../fields/sealed-field";

const ref = ({ id, version, schemaHash, contractHash }: Pick<ContractMetadata, "id" | "version" | "schemaHash" | "contractHash">) => ({ id, version, schemaHash, contractHash });
const friendly = (id: string) => id.replace(/_/g, " ").replace(/^./, value => value.toUpperCase());
const forms = ["desktop", "tablet", "phone"] as const;

export async function discoverPageScreensInTransaction(authority: FieldRuntimeAuthority) {
  assertCapability(authority.session, STUDIO_CAPABILITIES.read);
  const contracts = await authority.registry.discover(authority.session);
  const sources = contracts.filter(contract => contract.details.pageSource !== undefined);
  const latest = new Map<string, ContractMetadata>();
  for (const source of sources) if ((latest.get(source.id)?.version ?? 0) < source.version) latest.set(source.id, source);
  const result = [];
  for (const source of latest.values()) {
    const resolved = await authority.registry.resolvePageSourcePolicy({ session: authority.session, transaction: authority.transaction }, ref(source));
    result.push({ sourcePage: ref(source), entity: ref(resolved.source), name: resolved.source.label,
      owner: resolved.source.ownerModuleId, variants: resolved.policy.variants });
  }
  return result.sort((left, right) => left.name.localeCompare(right.name));
}

/** A presentation-only catalogue. Only currently authorised choices leave the
 * server; it contains no stored grants, private facts or business record data.
 */
export async function pageEditorCatalogInTransaction(authority: FieldRuntimeAuthority, page: PagePayload) {
  assertCapability(authority.session, STUDIO_CAPABILITIES.read);
  const source = authority.registry.describePageSourceForEntity(page.entity), metadata = source.metadata;
  const selected = authoredPageFieldPins(page);
  const activeFields = source.policy.fieldSourceVersions.length ? await authority.transaction.studioDefinition.findMany({
    where: { organisationId: authority.session.organisationId, kind: "customField", retiredAt: null,
      fieldBinding: { entityId: page.entity.id }, activeVersionId: { not: null } },
    include: { activeVersion: true }, orderBy: { id: "asc" }, take: 101,
  }) : [];
  if (activeFields.length > 100) throw new Error("This app exceeds its approved additional-field limit.");
  const available = [...selected];
  for (const definition of activeFields) {
    if (selected.some(pin => pin.definitionId === definition.id)) continue;
    const version = definition.activeVersion;
    if (!version || definition.activeVersionId !== version.id) throw new Error("DEPENDENCY_BROKEN: an additional field is unavailable.");
    const sealed = inspectSealedFieldVersion(authority.registry, version, authority.session.organisationId, definition.id);
    if (sealed.payload.entity.id !== page.entity.id || !source.policy.fieldSourceVersions.includes(sealed.payload.entity.version)) continue;
    const field = sealed.payload.field;
    if (field.readCapability && !authority.session.capabilities.has(field.readCapability)) continue;
    available.push({ kind: "customField", definitionId: definition.id, versionId: version.id, schemaVersion: sealed.schemaVersion, checksum: version.checksum });
  }
  const approvals = await reconstructPageApprovalsInTransaction(authority, { sourcePage: ref(metadata), customFields: available });
  const scope = pageReadScope(compilePage(page, approvals), source.policy);
  const allowed = (capability?: string) => !capability || authority.session.capabilities.has(capability);
  const authorized = async (reference: { id: string; version: number; schemaHash: string; contractHash: string }) => {
    try { await authority.registry.resolve(authority.session, reference); return true; }
    catch (error) { if (error instanceof Error && /^(FORBIDDEN|DEPENDENCY_BROKEN):/.test(error.message)) return false; throw error; }
  };
  const readableQueries = new Set<string>();
  for (const query of approvals.queries) if (await authorized(query) && query.columns.every(column => allowed(column.capability)))
    if (source.policy.queries.some(owned => owned.query.id === query.id && owned.query.version === query.version && owned.scope === scope))
      readableQueries.add(`${query.id}@${query.version}`);
  const fields: PageEditorFieldChoice[] = approvals.nativeFields.filter(field => allowed(field.capability)
    && readableQueries.has(`${field.query.id}@${field.query.version}`)).map(field => ({
    key: `native:${field.id}`, label: field.label ?? friendly(field.id), field: { source: "native", fieldId: field.id, mode: "read" }, editable: false, required: false,
  }));
  const customLabels: PagePresentationCatalog["customFields"] = [];
  for (const field of approvals.customFields.filter(field => scope === "record" && allowed(field.readCapability))) {
    const version = await authority.transaction.studioDefinitionVersion.findFirst({ where: { id: field.reference.versionId,
      definitionId: field.reference.definitionId, organisationId: authority.session.organisationId }, select: { payload: true, definition: { select: { name: true } } } });
    if (!version) throw new Error("DEPENDENCY_BROKEN: an additional field is unavailable.");
    const label = version.definition.name;
    customLabels.push({ definitionId: field.reference.definitionId, label });
    fields.push({ key: `field:${field.reference.definitionId}`, label, field: { source: "extension", reference: field.reference, mode: "read" },
      editable: false, required: field.required });
  }
  const palette: PageEditorPaletteItem[] = [
    { key: "instructions", label: "Instructions", description: "Add clear guidance for your team.", component: { type: "instructions", text: "Add helpful instructions here.", formFactors: [...forms] } },
    { key: "note", label: "Helpful note", description: "Highlight an important message.", component: { type: "callout", text: "Add a helpful note here.", tone: "info", formFactors: [...forms] } },
  ];
  const catalog: PagePresentationCatalog = { nativeFields: fields.filter(field => field.field.source === "native").map(field => ({
    id: field.field.source === "native" ? field.field.fieldId : "", label: field.label })), customFields: customLabels,
    facts: [], queries: [], actions: [], metrics: [], surfaces: [] };
  for (const query of approvals.queries) if (readableQueries.has(`${query.id}@${query.version}`)) {
    const label = authority.registry.describe(query.id, query.version).label;
    catalog.queries.push({ id: query.id, version: query.version, label,
      columns: query.columns.map(column => ({ id: column.id, label: column.label ?? friendly(column.id), ...(column.format ? { format: column.format } : {}) })) });
    if (query.purpose === "list" && query.columns.length) palette.push({ key: `query:${query.id}`, label, description: "Show the app's approved records in a table.",
      component: { type: "queryList", label, query: ref(query), pageSize: Math.min(20, query.maxCardinality), columns: query.columns.slice(0, 6).map(column => column.id), formFactors: [...forms] } });
  }
  for (const field of fields) palette.push({ key: field.key, label: field.label, description: "Show this business detail.", component: {
    type: "fields", label: field.label, fields: [field.field], formFactors: [...forms] } });
  for (const command of approvals.commands) if (scope === "record" && await authorized(command)) {
    const label = authority.registry.describe(command.id, command.version).label;
    catalog.actions.push({ id: command.id, version: command.version, label });
    palette.push({ key: `command:${command.id}`, label, description: "A button for an approved app operation.", component: { type: "action", label,
      command: ref(command), collectInput: "owner_schema", confirm: true, preview: false, formFactors: [...command.formFactors] } });
  }
  const declaredFacts = entityDetailsSchema.parse(source.source.details).record?.requiredFacts?.facts ?? [];
  for (const surface of approvals.surfaces) if (scope === "record" && await authorized(surface)) {
    const label = authority.registry.describe(surface.id, surface.version).label;
    catalog.surfaces.push({ id: surface.id, version: surface.version, label });
    palette.push({ key: `surface:${surface.id}`, label, description: "The app's complete authorised form, including additional fields.", component: {
      type: "surface", label, family: surface.family, surface: ref(surface), formFactors: [...surface.formFactors] } });
  }
  const conditionFacts = approvals.facts.filter(fact => allowed(fact.capability) && readableQueries.has(`${fact.query.id}@${fact.query.version}`))
    .flatMap(fact => {
      const declaration = declaredFacts.find(value => value.fieldId === fact.id);
      const label = catalog.nativeFields.find(field => field.id === fact.id)?.label ?? friendly(fact.id);
      const choices = declaration?.type === "enum" ? declaration.codes?.map(code => ({ value: code, label: friendly(code.toLowerCase()) }))
        : fact.valueType === "boolean" ? [{ value: true, label: "Yes" }, { value: false, label: "No" }] : undefined;
      if (!choices?.length) return [];
      catalog.facts.push({ id: fact.id, label });
      return [{ id: fact.id, label, choices }];
    });
  return { fields, palette, catalog, conditions: { variantsAllowed: approvals.variants, facts: conditionFacts }, approvalsChecksum: checksum(approvals) };
}
