import { viewSourcePolicySchema } from "../views/owner-contract";
import { checksum } from "../registry/contracts";
import { entityDetailsSchema } from "../registry/entities";
import type { ContractMetadata, Contribution } from "../registry/types";
import { z } from "zod";
import { pageProjectionSchema, pageSourcePolicySchema } from "./owner-contract";

type Lookup = (id: string, version: number) => ContractMetadata | undefined;
const classificationRank = { public_internal: 0, confidential: 1, restricted: 2 } as const;
const key = (ref: { id: string; version: number }) => `${ref.id}@${ref.version}`;
/** Registration only: no business facts or current-user authorization here. */
export function validatePageSourceRegistration(metadata: ContractMetadata, callbacks: Contribution["pageSource"], lookup: Lookup): void {
  if (metadata.details.pageSource === undefined) {
    if (callbacks !== undefined) throw new Error("Page adapters require an explicit page source policy.");
    return;
  }
  if (metadata.kind !== "surface" || !callbacks || [callbacks.authoriseRead, callbacks.bindQueryInput, callbacks.projectQueryOutput].some(value => typeof value !== "function"))
    throw new Error("Page source requires a descriptive surface and explicit owning adapters.");
  const policy = pageSourcePolicySchema.parse(metadata.details.pageSource);
  if (checksum(policy) !== metadata.schemaHash) throw new Error("Invalid page source schema hash.");
  const requireContract = (ref: { id: string; version: number }, kinds: readonly ContractMetadata["kind"][]) => {
    const contract = lookup(ref.id, ref.version);
    if (!contract || !kinds.includes(contract.kind) || contract.ownerModuleId !== metadata.ownerModuleId)
      throw new Error("Page source needs explicitly registered contracts from the same owner.");
    return contract;
  };
  const source = requireContract(policy.entity, ["entity"]);
  if (source.capability !== metadata.capability || classificationRank[metadata.classification] < classificationRank[source.classification])
    throw new Error("Page source must preserve its native read capability and classification.");
  for (const approved of policy.embeddedViewSources ?? []) {
    const view = lookup(approved.id, approved.version);
    if (!view || view.kind !== "surface" || !viewSourcePolicySchema.safeParse(view.details.viewSource).success)
      throw new Error("Page analytics views need an explicitly registered owning View source.");
  }
  const fields = entityDetailsSchema.parse(source.details).fields;
  for (const version of policy.fieldSourceVersions) {
    const retained = requireContract({ id: policy.entity.id, version }, ["entity"]), details = entityDetailsSchema.parse(retained.details);
    if (retained.capability !== source.capability || !details.extensionPolicy.customFields || !details.record?.fieldPolicy)
      throw new Error("Page fields require explicitly approved typed-field source versions with native Read.");
  }
  const queries = new Map(policy.queries.map(approval => {
    const query = requireContract(approval.query, ["query"]);
    if (query.details.transaction !== "required" || !Number.isInteger(query.details.maxCardinality)
      || Number(query.details.maxCardinality) < 1 || Number(query.details.maxCardinality) > 200
      || !["cursor", "page", "none"].includes(String(query.details.pagination)) || !["low", "medium", "high"].includes(String(query.details.costClass)))
      throw new Error("Page queries require explicit bounded shared-transaction contracts.");
    if (approval.purpose === "fact" && (query.details.pagination !== "none" || query.details.maxCardinality !== 1 || approval.scope !== "record"))
      throw new Error("Page facts require a single-record owning projection.");
    if (approval.purpose === "list" && (query.details.pagination === "none" || Number(query.details.maxCardinality) > 50))
      throw new Error("Page lists require bounded owner pagination.");
    if (approval.columns.some(column => classificationRank[column.classification] < classificationRank[query.classification]))
      throw new Error("Page columns cannot downgrade owning query classification.");
    for (const column of approval.columns) if (column.format) {
      const currency = approval.columns.find(value => value.id === column.format!.currencyColumnId);
      if (column.valueType !== "number" || !currency || currency.valueType !== "string" || currency.nullable)
        throw new Error("Page money needs an explicit same-projection currency scalar.");
    }
    if (checksum(query.outputSchema) !== checksum(z.toJSONSchema(pageProjectionSchema(approval.columns, Number(query.details.maxCardinality)))))
      throw new Error("Page query needs its complete closed approved projection schema.");
    return [key(approval.query), approval] as const;
  }));
  const requireQuery = (ref: { id: string; version: number }, purpose: string) => {
    const query = queries.get(key(ref));
    if (!query || query.purpose !== purpose) throw new Error("Page source query purpose is not explicitly approved.");
    return query;
  };
  for (const native of policy.nativeFields) {
    const field = fields.find(field => field.id === native.id), query = requireQuery(native.query, "fact"), column = query.columns.find(column => column.id === native.columnId);
    if (!field || !column || classificationRank[column.classification] < classificationRank[field.classification]
      || (field.capability && column.capability !== field.capability))
      throw new Error("Native page fields must preserve owning field classification and access.");
    const expectedType = ["integer", "decimal", "money"].includes(field.type) ? "number" : field.type === "boolean" ? "boolean" : "string";
    if (column.valueType !== expectedType || column.nullable !== field.nullable)
      throw new Error("Native page fields must preserve owning scalar type/nullability.");
    if (field.type === "money" && !column.format) throw new Error("Native money needs explicit owning minor-unit currency presentation.");
  }
  for (const fact of policy.facts) {
    const contract = requireContract(fact.contract, ["entity", "decisionFact"]), query = requireQuery(fact.query, "fact"), column = query.columns.find(column => column.id === fact.columnId);
    if ((contract.kind === "entity" && key(fact.contract) !== key(policy.entity)) || !column
      || column.valueType !== fact.valueType || column.nullable !== fact.nullable
      || column.classification !== fact.classification || column.capability !== fact.capability)
      throw new Error("Page facts require an exact approved source scalar projection.");
  }
  for (const command of policy.commands) {
    requireContract(command.command, ["command"]);
    if (command.previewQuery) requireQuery(command.previewQuery, "preview");
  }
  for (const metric of policy.metrics) { requireContract(metric.metric, ["metric"]); requireQuery(metric.query, "metric"); }
  for (const surface of policy.surfaces) { requireContract(surface.surface, ["surface"]); surface.queries.forEach(ref => requireQuery(ref, "surface")); }
}
