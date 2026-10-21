import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { reconstructPageApprovalsInTransaction } from "@/core/studio/pages/server-approvals";
import { pagePayloadSchema, type PagePayload } from "@/core/studio/pages/schema";
import { compilePage } from "@/core/studio/pages/compiler";
import { createSalesOrderPagePresets } from "@/modules/sales/services/studio-page-presets";
import type { ContractReference } from "@/core/studio/registry/types";

export async function screenLayouts(authority: FieldRuntimeAuthority, entity: ContractReference) {
  const source = authority.registry.describePageSourceForEntity(entity).metadata;
  const approvals = await reconstructPageApprovalsInTransaction(authority, { sourcePage: {
    id: source.id, version: source.version, schemaHash: source.schemaHash, contractHash: source.contractHash }, customFields: [] });
  if (entity.id === "sales.order") return createSalesOrderPagePresets(approvals);
  if (entity.id !== "tickets.ticket") throw new Error("This app has not approved a visual screen layout yet.");
  const forms: PagePayload["formFactors"] = ["desktop", "tablet", "phone"];
  const list = approvals.queries.find(query => query.purpose === "list");
  if (!list) throw new Error("The ticket list is unavailable.");
  const reference = { id: list.id, version: list.version, schemaHash: list.schemaHash, contractHash: list.contractHash };
  const recordPage = pagePayloadSchema.parse({ schemaVersion: 1, entity, formFactors: forms, sections: [{ id: "ticket", label: "Ticket details",
    formFactors: forms, columns: { desktop: 2, tablet: 2, phone: 1 }, components: [{ id: "summary", type: "fields", label: "Request",
      formFactors: forms, fields: ["number", "subject", "status", "priority", "type"].map(fieldId => ({ source: "native", fieldId, mode: "read" })) }] }] });
  const listPage = pagePayloadSchema.parse({ schemaVersion: 1, entity, formFactors: forms, sections: [{ id: "tickets", label: "Tickets",
    formFactors: forms, columns: { desktop: 1, tablet: 1, phone: 1 }, components: [{ id: "ticket_list", type: "queryList", label: "Tickets",
      formFactors: forms, query: reference, pageSize: 25, columns: ["number", "subject", "status", "priority"] }] }] });
  compilePage(recordPage, approvals); compilePage(listPage, approvals);
  return [{ id: "ticket_record", name: "Ticket", description: "A clear summary of each request.", scope: "record" as const, page: recordPage },
    { id: "tickets_list", name: "Tickets", description: "A list of requests, priorities and status.", scope: "list" as const, page: listPage }];
}
