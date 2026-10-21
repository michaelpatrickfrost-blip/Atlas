import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import type { PageDisplayModel } from "@/core/studio/pages/render-model";
import type { PageApprovals } from "@/core/studio/pages/approvals";
const m = vi.hoisted(() => ({ membership: vi.fn(), refresh: vi.fn(), definition: vi.fn(), lock: vi.fn(), read: vi.fn(), owner: vi.fn(), resolve: vi.fn(), invoke: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.membership } } }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh, withFieldRuntimeAuthority: vi.fn() }));
vi.mock("@/core/studio/pages/runtime", () => ({ readPublishedPageInTransaction: m.read }));
import { sessionForUser, sessionAuthorityStamp } from "@/core/auth/session";
import { checksum } from "@/core/studio/registry/contracts";
import { compilePage } from "@/core/studio/pages/compiler";
import { prepareVisiblePageRecordInTransaction } from "@/core/studio/pages/customer-gateway";

// Real issued Session and pure closed Page compiler; SQL/current-principal
// refresh/owner/reader are explicit collaborators. No database/private-record,
// transaction atomicity, browser navigation or live runtime evidence is inferred.
const uuid = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ref = (id: string) => ({ id, version: 1, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) });
const entity = ref("example.order"), source = ref("example.order.page"), query = ref("example.order.list"), otherQuery = ref("example.order.alternate_list");
const identity = { ownerModuleId: "example", capability: "example.order.read", classification: "confidential" as const };
const input = { definitionId: uuid(1), request: { kind: "list" as const }, formFactor: "phone" as const,
  componentId: "orders", selectedRecordId: "selected", expectedVersionId: uuid(2), expectedDefinitionRevision: 4 };
const tx = { $queryRaw: m.lock, studioDefinition: { findFirst: m.definition } } as unknown as Prisma.TransactionClient;
const recordAnchor = { kind: "record", organisationId: "company", recordId: "selected", revision: "7:timestamp", nativeRevision: 7 };
function approvals(): PageApprovals {
  return { entity: { ...entity, ...identity, kind: "entity" }, sourcePage: { ...source, ...identity, kind: "surface" },
    variants: true, fieldSourceVersions: [], nativeFields: [], customFields: [], facts: [], contracts: [], commands: [], metrics: [], surfaces: [], maxQueryCost: 4,
    queries: [query, otherQuery].map(value => ({ ...value, ...identity, kind: "query" as const, sourceEntityId: entity.id, purpose: "list" as const,
      pagination: "cursor" as const, maxCardinality: 25, costClass: "low" as const, columns: [{ id: "reference", classification: "confidential" as const }] })) };
}
function definition(withVariant = false) {
  const component = (id: string, selectedQuery = query) => ({ id, type: "queryList", label: "Orders", formFactors: ["phone"], query: selectedQuery, pageSize: 25, columns: ["reference"] });
  const compiledPlan = compilePage({ schemaVersion: 1, entity, formFactors: ["phone"], sections: [{ id: "main", label: "Orders",
    columns: { desktop: 1, tablet: 1, phone: 1 }, formFactors: ["phone"], components: [component("orders")] }],
    variants: withVariant ? [{ id: "alternate", label: "Alternate", priority: 10, when: { kind: "capabilities", mode: "all", capabilities: ["example.order.read"] },
      patches: [{ operation: "removeComponent", componentId: "orders" }, { operation: "addComponent", sectionId: "main", afterComponentId: null,
        component: component("alternate_orders", otherQuery) }] }] : [] }, approvals());
  return { id: uuid(1), organisationId: "company", kind: "page", name: "Orders", revision: 4, retiredAt: null, activeVersionId: uuid(2),
    activeVersion: { id: uuid(2), organisationId: "company", definitionId: uuid(1), schemaVersion: 1, checksum: checksum(compiledPlan), compiledPlan } };
}
function model(componentId = "orders", variantId: string | null = null): PageDisplayModel {
  return { variantId, formFactor: "phone", sections: [{ id: "main", label: "Orders", help: "", columns: 1, components: [{ id: componentId,
    type: "queryList", label: "Orders", help: "", columns: ["Order number"], rows: [{ id: "selected", cells: [{ label: "Order number", text: "SO-1", unavailable: false }] }], nextCursor: null }] }] };
}
function owner() {
  return { source: { ...entity, ...identity, kind: "entity" }, anchor: { kind: "list", organisationId: "company" },
    policy: { queries: [query, otherQuery].map(value => ({ query: { id: value.id, version: value.version }, scope: "list", purpose: "list" })) } };
}
async function fixture() {
  const session = await sessionForUser("company", "actor"); if (!session) throw new Error("Session missing.");
  const registry = { authorisePageRead: m.owner, resolve: m.resolve, invoke: m.invoke } as unknown as FieldRuntimeAuthority["registry"];
  const authority: FieldRuntimeAuthority = { session, stamp: sessionAuthorityStamp(session)!, transaction: tx, registry };
  m.refresh.mockResolvedValue(authority); m.definition.mockResolvedValue(definition()); m.read.mockResolvedValue(model());
  m.owner.mockResolvedValueOnce(owner()).mockResolvedValueOnce({ ...owner(), anchor: recordAnchor });
  m.resolve.mockResolvedValue({ ...query, ...identity, kind: "query" });
  return authority;
}
beforeEach(() => {
  vi.resetAllMocks(); m.membership.mockResolvedValue({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 2, active: true,
    grantedCapabilities: ["example.order.read"], deniedCapabilities: [], roles: [], user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
    organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
});
describe("current visible canonical Page row preparation", () => {
  it("binds an actually visible list row to its current query and genuinely authorised owning record in the same transaction", async () => {
    const authority = await fixture(), result = await prepareVisiblePageRecordInTransaction(authority, input);
    expect(result).toEqual({ authority, definitionId: uuid(1), definitionRevision: 4, versionId: uuid(2), sourcePage: source,
      ownerModuleId: "example", entity, anchor: recordAnchor, component: { id: "orders", query } });
    expect(result).not.toHaveProperty("href"); expect(result).not.toHaveProperty("layout");
    expect(m.refresh.mock.invocationCallOrder[0]).toBeLessThan(m.lock.mock.invocationCallOrder[0]);
    expect(m.read.mock.invocationCallOrder[0]).toBeLessThan(m.owner.mock.invocationCallOrder[0]);
    expect(m.owner).toHaveBeenNthCalledWith(1, { session: authority.session, transaction: tx }, source, { kind: "list" });
    expect(m.resolve).toHaveBeenCalledWith(authority.session, query);
    expect(m.resolve.mock.invocationCallOrder[0]).toBeLessThan(m.owner.mock.invocationCallOrder[1]);
    expect(m.owner).toHaveBeenNthCalledWith(2, { session: authority.session, transaction: tx }, source, { kind: "record", recordId: "selected" });
    expect(m.invoke).not.toHaveBeenCalled();
  });
  it("uses the actually selected variant and forwards the component continuation, without evaluating condition facts again", async () => {
    const authority = await fixture(); m.definition.mockResolvedValue(definition(true)); m.read.mockResolvedValue(model("alternate_orders", "alternate"));
    m.resolve.mockResolvedValue({ ...otherQuery, ...identity, kind: "query" });
    const cursors = { alternate_orders: { id: "continued" } };
    const result = await prepareVisiblePageRecordInTransaction(authority, { ...input, componentId: "alternate_orders", cursors });
    expect(result.component.query).toEqual(otherQuery);
    expect(m.read).toHaveBeenCalledWith(authority, expect.objectContaining({ cursors, formFactor: "phone" }));
    expect(m.invoke).not.toHaveBeenCalled();
  });
  it.each(["hidden", "notList", "missingRow", "duplicateRow"])("rejects %s before query or target record access", async mode => {
    const authority = await fixture(), visible = model();
    if (mode === "hidden") visible.sections = [];
    if (mode === "notList") visible.sections[0].components = [{ id: "orders", type: "instructions", label: "Guide", help: "", text: "Guide", tone: "info" }];
    const rows = visible.sections[0]?.components[0];
    if (rows?.type === "queryList") { if (mode === "missingRow") rows.rows = []; if (mode === "duplicateRow") rows.rows.push(rows.rows[0]); }
    m.read.mockResolvedValue(visible);
    await expect(prepareVisiblePageRecordInTransaction(authority, input)).rejects.toThrow("unavailable");
    expect(m.owner).not.toHaveBeenCalled(); expect(m.resolve).not.toHaveBeenCalled();
  });
  it.each([{ expectedVersionId: uuid(3) }, { expectedDefinitionRevision: 5 }])("rejects stale Page identity before shared/native reads", async extra => {
    const authority = await fixture();
    await expect(prepareVisiblePageRecordInTransaction(authority, { ...input, ...extra })).rejects.toThrow("screen changed");
    expect(m.read).not.toHaveBeenCalled(); expect(m.owner).not.toHaveBeenCalled();
  });
  it.each(["recordScope", "notApproved", "notListPurpose", "wrongQueryKind", "wrongQueryOwner"])("denies %s child/raw query selection before selected native record authorization", async mode => {
    const authority = await fixture(), approved = owner(); m.owner.mockReset();
    if (mode === "recordScope") approved.policy.queries[0].scope = "record";
    if (mode === "notApproved") approved.policy.queries = [];
    if (mode === "notListPurpose") approved.policy.queries[0].purpose = "fact";
    m.owner.mockResolvedValue(approved);
    if (mode === "wrongQueryKind") m.resolve.mockResolvedValue({ ...query, ...identity, kind: "command" });
    if (mode === "wrongQueryOwner") m.resolve.mockResolvedValue({ ...query, ...identity, ownerModuleId: "other", kind: "query" });
    await expect(prepareVisiblePageRecordInTransaction(authority, input)).rejects.toThrow("unavailable");
    expect(m.owner).toHaveBeenCalledTimes(1); expect(m.invoke).not.toHaveBeenCalled();
  });
  it.each(["foreignList", "wrongListKind", "wrongEntity", "foreignRecord", "otherRecord", "listTarget", "otherOwner", "otherRecordEntity"])("denies %s actual owner boundary", async mode => {
    const authority = await fixture(), listOwner = owner(), target = { ...owner(), anchor: { ...recordAnchor } };
    if (mode === "foreignList") listOwner.anchor.organisationId = "other";
    if (mode === "wrongListKind") listOwner.anchor.kind = "record";
    if (mode === "wrongEntity") listOwner.source.id = "other.order";
    if (mode === "foreignRecord") target.anchor.organisationId = "other";
    if (mode === "otherRecord") target.anchor.recordId = "other";
    if (mode === "listTarget") target.anchor.kind = "list";
    if (mode === "otherOwner") target.source.ownerModuleId = "other";
    if (mode === "otherRecordEntity") target.source.contractHash = "c".repeat(64);
    m.owner.mockReset().mockResolvedValueOnce(listOwner).mockResolvedValueOnce(target);
    await expect(prepareVisiblePageRecordInTransaction(authority, input)).rejects.toThrow("unavailable"); expect(m.invoke).not.toHaveBeenCalled();
  });
  it("propagates actual current native/module/query/private-record denials without a fallback destination", async () => {
    const authority = await fixture(); m.resolve.mockRejectedValueOnce(new Error("Current query permission revoked"));
    await expect(prepareVisiblePageRecordInTransaction(authority, input)).rejects.toThrow("permission revoked"); expect(m.owner).toHaveBeenCalledTimes(1);
    m.owner.mockReset().mockResolvedValueOnce(owner()).mockRejectedValueOnce(new Error("Private selected record denied"));
    await expect(prepareVisiblePageRecordInTransaction(authority, input)).rejects.toThrow("Private selected record denied"); expect(m.invoke).not.toHaveBeenCalled();
  });
  it.each(["unknownVariant", "wrongComponent", "alteredPlan"])("refuses inconsistent selected sealed layout %s", async mode => {
    const authority = await fixture();
    if (mode === "unknownVariant") m.read.mockResolvedValue(model("orders", "unknown"));
    if (mode === "wrongComponent") m.read.mockResolvedValue(model("other"));
    if (mode === "alteredPlan") { const row = definition(); row.activeVersion.compiledPlan.base.queryCost += 1;
      row.activeVersion.checksum = checksum(row.activeVersion.compiledPlan); m.definition.mockResolvedValue(row); }
    await expect(prepareVisiblePageRecordInTransaction(authority, { ...input, ...(mode === "wrongComponent" ? { componentId: "other" } : {}) })).rejects.toThrow("unavailable");
    expect(m.owner).not.toHaveBeenCalled();
  });
  it("rejects forged/copied principals and client tenant/query/URL/layout/variant overrides before refresh", async () => {
    const authority = await fixture();
    await expect(prepareVisiblePageRecordInTransaction({ ...authority, session: { ...authority.session } }, input)).rejects.toThrow("FORBIDDEN");
    for (const extra of [{ organisationId: "other" }, { query }, { href: "/sales/orders/other" }, { targetDefinitionId: uuid(3) }, { variantId: "alternate" },
      { selectedRecordId: "" }, { selectedRecordId: "x".repeat(201) }]) await expect(prepareVisiblePageRecordInTransaction(authority, { ...input, ...extra })).rejects.toThrow();
    expect(m.refresh).not.toHaveBeenCalled(); expect(m.lock).not.toHaveBeenCalled();
  });
});
