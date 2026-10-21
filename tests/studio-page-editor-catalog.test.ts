import { beforeEach, expect, it, vi } from "vitest";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ membership: vi.fn(), definition: vi.fn(), values: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.membership } } }));
import { sessionForUser, sessionAuthorityStamp } from "@/core/auth/session";
import { declarative, entity, query } from "@/core/studio/registry/contracts";
import { pageSource } from "@/core/studio/registry/page-contracts";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { pageProjectionSchema, pageQueryOutputSchema, type PageSourcePolicy } from "@/core/studio/pages/owner-contract";
import { pagePayloadSchema } from "@/core/studio/pages/schema";
import { pageEditorCatalogInTransaction } from "@/core/studio/authoring/catalog";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";

// Genuine Session issuance, registry, owner declarations and approval/compiler
// are real. Membership SQL/module availability are explicit fixture collaborators;
// these cases do not prove native visibility, tenant SQL or live publication.
const forms = ["desktop", "tablet", "phone"] as const;
const base = { version: 1, label: "Orders", capability: "example.order.read", lifecycle: "active" as const, classification: "confidential" as const };
const get = { id: "example.order.header", version: 1 }, list = { id: "example.order.list", version: 1 };
const reference = ({ id, version, schemaHash, contractHash }: { id: string; version: number; schemaHash: string; contractHash: string }) => ({ id, version, schemaHash, contractHash });
beforeEach(() => { vi.resetAllMocks(); });
async function fixture(mode: "record" | "list" = "record", denied = "", columnCapability?: string, bound = 7, deniedFactContract = false) {
  m.membership.mockResolvedValue({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 1, active: true,
    grantedCapabilities: [base.capability, "studio.definition.read"].filter(value => value !== denied), deniedCapabilities: [], roles: [],
    user: { name: "Actor", email: "actor@example.invalid", authVersion: 1, platformAdmin: null },
    organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
  const session = await sessionForUser("company", "actor"); if (!session) throw new Error("No actor");
  const columns = [{ id: "subject", label: "Order subject", valueType: "string" as const, nullable: false, classification: "confidential" as const },
    { id: "urgent", label: "Urgent", valueType: "boolean" as const, nullable: false, classification: "confidential" as const,
      ...(columnCapability ? { capability: columnCapability } : {}) },
    { id: "score", label: "Score", valueType: "number" as const, nullable: true, classification: "confidential" as const }];
  const policy: PageSourcePolicy = { schemaVersion: 1, entity: { id: "example.order", version: 1 }, accessMode: "ordinary_read", variants: false, fieldSourceVersions: [],
    nativeFields: [{ id: "subject", query: get, columnId: "subject" }], queries: [{ query: get, scope: "record", purpose: "fact", columns },
      { query: list, scope: "list", purpose: "list", columns }], facts: [
      { id: "urgent", contract: { id: deniedFactContract ? "example.order.fact" : "example.order", version: 1 }, query: get, columnId: "urgent", valueType: "boolean", nullable: false, classification: "confidential", provenance: "owner_native", ...(columnCapability ? { capability: columnCapability } : {}) },
      { id: "score", contract: { id: "example.order", version: 1 }, query: get, columnId: "score", valueType: "number", nullable: true, classification: "confidential", provenance: "owner_native" }],
    commands: [], metrics: [], surfaces: [], maxQueryCost: 12 };
  const registry = new CapabilityRegistry(async () => true);
  registry.register("example", { contributions: [entity({ ...base, id: "example.order", kind: "entity", key: "string", fields: [{ id: "subject", label: "Order subject", type: "string", nullable: false,
    classification: "confidential", filterable: false, sortable: false, decision: false, template: false }], extensionPolicy: { customFields: false, recordTypes: false, pageVariants: false } }),
    ...[get, list].map(ref => query({ ...base, ...ref, kind: "query", capability: denied === ref.id ? "example.order.restricted" : base.capability,
      transaction: "required", pagination: ref === get ? "none" : "cursor", costClass: "low", maxCardinality: ref === get ? 1 : bound,
      input: z.strictObject({ pageSize: z.number().int(), cursor: z.unknown() }), output: pageProjectionSchema(columns, ref === get ? 1 : bound), execute: m.values })),
    ...(deniedFactContract ? [declarative({ ...base, id: "example.order.fact", kind: "decisionFact", capability: "example.order.fact_read", references: ["example.order"], schema: z.strictObject({ urgent: z.boolean() }) })] : []),
    pageSource({ ...base, id: "example.order.page", policy, callbacks: {
      async authoriseRead(context, request) { return request.kind === "list" ? { kind: "list", organisationId: context.session.organisationId }
        : { kind: "record", organisationId: context.session.organisationId, recordId: request.recordId, revision: "1" }; },
      async bindQueryInput(_context, _anchor, input) { return input; }, async projectQueryOutput(_context, _anchor, _request, output) { return pageQueryOutputSchema.parse(output); },
    } })] });
  const authority: FieldRuntimeAuthority = { session, stamp: sessionAuthorityStamp(session)!, registry,
    transaction: { studioDefinition: { findMany: m.definition } } as unknown as Prisma.TransactionClient };
  const page = pagePayloadSchema.parse({ schemaVersion: 1, entity: reference(registry.describe("example.order", 1)), formFactors: forms, sections: [{ id: "main", label: "Orders", formFactors: forms,
    columns: { desktop: 1, tablet: 1, phone: 1 }, components: mode === "record" ? [{ id: "guide", type: "instructions", text: "Help", formFactors: forms }]
      : [{ id: "records", type: "queryList", query: reference(registry.describe(list.id, 1)), pageSize: 1, columns: ["subject"], formFactors: forms }] }] });
  return { authority, page };
}
it("offers all approved scalar facts as labelled read-only panels without querying values", async () => {
  const { authority, page } = await fixture(), result = await pageEditorCatalogInTransaction(authority, page);
  expect(result.palette.filter(item => item.component.type === "facts").map(item => ({ label: item.label, ids: item.component.type === "facts" ? item.component.factIds : [] })))
    .toEqual([{ label: "Urgent at a glance", ids: ["urgent"] }, { label: "Score at a glance", ids: ["score"] }]);
  expect(result.catalog.facts).toEqual([{ id: "urgent", label: "Urgent" }, { id: "score", label: "Score" }]);
  expect(result.conditions.facts).toEqual([{ id: "urgent", label: "Urgent", choices: [{ value: true, label: "Yes" }, { value: false, label: "No" }] }]);
  expect(result.scope).toBe("record"); expect(m.values).not.toHaveBeenCalled(); expect(m.definition).not.toHaveBeenCalled();
});
it("offers only list-scoped approved columns and exact owner row bound, never record facts", async () => {
  const { authority, page } = await fixture("list"), result = await pageEditorCatalogInTransaction(authority, page);
  const item = result.palette.find(item => item.component.type === "queryList");
  expect(item?.table).toEqual({ columns: [{ id: "subject", label: "Order subject" }, { id: "urgent", label: "Urgent" }, { id: "score", label: "Score" }], maxPageSize: 7 });
  expect(result.palette.some(item => item.component.type === "facts")).toBe(false); expect(result.catalog.facts).toEqual([]);
  expect(page.sections[0].components[0]).toMatchObject({ columns: ["subject"], pageSize: 1 }); expect(m.values).not.toHaveBeenCalled();
});
it.each(["example.order.header", "example.order.secret"])("omits forbidden query/column %s before fact names or table choices leave", async denied => {
  const { authority, page } = await fixture("record", denied, denied === "example.order.secret" ? denied : undefined);
  const result = await pageEditorCatalogInTransaction(authority, page);
  expect(result.palette.some(item => item.component.type === "facts")).toBe(false); expect(result.catalog.facts).toEqual([]); expect(result.conditions.facts).toEqual([]);
  expect(m.values).not.toHaveBeenCalled();
});
it("does not grant Studio access through an owner palette", async () => {
  const { authority, page } = await fixture("record", "studio.definition.read");
  await expect(pageEditorCatalogInTransaction(authority, page)).rejects.toThrow("FORBIDDEN"); expect(m.definition).not.toHaveBeenCalled(); expect(m.values).not.toHaveBeenCalled();
});

it("checks an independently approved fact contract before its label leaves even when its native query is permitted", async () => {
  const { authority, page } = await fixture("record", "", undefined, 7, true), result = await pageEditorCatalogInTransaction(authority, page);
  expect(result.palette.filter(item => item.component.type === "facts").map(item => item.label)).toEqual(["Score at a glance"]);
  expect(result.catalog.facts).toEqual([{ id: "score", label: "Score" }]); expect(result.conditions.facts).toEqual([]);
  expect(m.values).not.toHaveBeenCalled();
});
it.each(["example.order.list", "example.order.secret"])("omits a forbidden table source/column %s before projection labels or selectable columns leave", async denied => {
  const { authority, page } = await fixture("list", denied, denied === "example.order.secret" ? denied : undefined);
  const result = await pageEditorCatalogInTransaction(authority, page);
  expect(result.palette.some(item => item.component.type === "queryList")).toBe(false); expect(result.catalog.queries).toEqual([]);
  expect(page.sections[0].components[0]).toMatchObject({ columns: ["subject"], pageSize: 1 }); expect(m.values).not.toHaveBeenCalled();
});
