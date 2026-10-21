import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import type { PageDisplayModel } from "@/core/studio/pages/render-model";
const mocks = vi.hoisted(() => ({ membership: vi.fn(), refresh: vi.fn(), transaction: vi.fn(), definition: vi.fn(), lock: vi.fn(), read: vi.fn(), owner: vi.fn(), resolve: vi.fn(), invoke: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: mocks.membership } } }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ withFieldRuntimeAuthority: mocks.transaction, fieldRuntimeAuthorityInTransaction: mocks.refresh }));
vi.mock("@/core/studio/pages/runtime", () => ({ readPublishedPageInTransaction: mocks.read }));
import { sessionForUser, sessionAuthorityStamp } from "@/core/auth/session";
import { checksum } from "@/core/studio/registry/contracts";
import { readActiveCustomerPage, readActiveCustomerPageInTransaction, prepareVisiblePageActionInTransaction } from "@/core/studio/pages/customer-gateway";

// Genuine Session issuance; explicitly mocked refresh, pointer SQL, registry and
// shared reader collaborators. These tests prove gateway ordering/binding, not
// actual PostgreSQL/SSI, Page compilation or owning domain execution.
const uuid = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ref = (id: string) => ({ id, version: 1, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) });
const source = ref("example.order.page"), command = ref("example.order.acknowledgement");
const request = { definitionId: uuid(1), request: { kind: "record" as const, recordId: "order" }, formFactor: "phone" as const };
const action = { ...request, componentId: "acknowledgement", expectedVersionId: uuid(2), expectedDefinitionRevision: 4 };
const tx = { $queryRaw: mocks.lock, studioDefinition: { findFirst: mocks.definition } } as unknown as Prisma.TransactionClient;
const model: PageDisplayModel = { variantId: null, formFactor: "phone", sections: [{ id: "main", label: "Order", help: "", columns: 1,
  components: [{ id: "acknowledgement", label: "Preview acknowledgement", help: "", type: "action", command, confirm: true, preview: false }] }] };
function definition() {
  const identity = { ownerModuleId: "example", capability: "example.order.read", classification: "confidential" };
  const compiledPlan = { kind: "page", schemaVersion: 1, approvals: { entity: { ...ref("example.order"), ...identity, kind: "entity" },
    sourcePage: { ...source, ...identity, kind: "surface" }, variants: false, fieldSourceVersions: [], nativeFields: [], customFields: [], facts: [], contracts: [],
    queries: [], commands: [{ ...command, ...identity, kind: "command", sourceEntityId: "example.order", confirmation: "required", previewQuery: null, formFactors: ["phone"] }],
    metrics: [], surfaces: [], maxQueryCost: 4 } };
  return { id: uuid(1), organisationId: "company", kind: "page", name: "Sales order", revision: 4, retiredAt: null, activeVersionId: uuid(2),
    activeVersion: { id: uuid(2), organisationId: "company", definitionId: uuid(1), schemaVersion: 1, checksum: checksum(compiledPlan), compiledPlan } };
}
async function fixture() {
  const session = await sessionForUser("company", "actor"); if (!session) throw new Error("No session.");
  const registry = { authorisePageRead: mocks.owner, resolve: mocks.resolve, invoke: mocks.invoke } as unknown as FieldRuntimeAuthority["registry"];
  const authority: FieldRuntimeAuthority = { session, stamp: sessionAuthorityStamp(session)!, transaction: tx, registry };
  mocks.refresh.mockResolvedValue(authority); mocks.transaction.mockImplementation(async (_session, callback) => callback(authority));
  mocks.definition.mockResolvedValue(definition()); mocks.read.mockResolvedValue(structuredClone(model));
  mocks.owner.mockResolvedValue({ source: { ownerModuleId: "example" }, anchor: { kind: "record", organisationId: "company", recordId: "order", revision: "4:timestamp" },
    policy: { commands: [{ command: { id: command.id, version: 1 }, confirmation: "required", formFactors: ["phone"] }] } });
  mocks.resolve.mockResolvedValue({ ...command, ownerModuleId: "example", kind: "command", details: { sideEffect: "none" } });
  return authority;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.membership.mockResolvedValue({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 2, active: true,
    grantedCapabilities: ["example.order.read"], deniedCapabilities: [], roles: [], user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
    organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
});
describe("current business Page route gateway", () => {
  it("uses the current server tenant pointer and shared renderer without Studio authoring or exposing approvals", async () => {
    const authority = await fixture(), result = await readActiveCustomerPage(authority.session, request);
    expect(mocks.transaction).toHaveBeenCalledWith(authority.session, expect.any(Function));
    expect(result).toEqual({ definitionId: uuid(1), definitionRevision: 4, versionId: uuid(2), name: "Sales order", model });
    expect(result).not.toHaveProperty("authority"); expect(result).not.toHaveProperty("sourcePage"); expect(result).not.toHaveProperty("approvals");
    expect(mocks.definition).toHaveBeenCalledWith(expect.objectContaining({ where: { id: uuid(1), organisationId: "company", kind: "page", retiredAt: null } }));
    expect(mocks.read).toHaveBeenCalledWith(authority, { page: { kind: "page", definitionId: uuid(1), versionId: uuid(2), schemaVersion: 1,
      checksum: definition().activeVersion.checksum }, request: request.request, formFactor: "phone", cursors: {} });
    expect(mocks.lock.mock.invocationCallOrder[0]).toBeLessThan(mocks.definition.mock.invocationCallOrder[0]);
  });
  it("refreshes owning authority before pointer locks and forwards list continuation by bounded component", async () => {
    const authority = await fixture(), cursors = { orders: { id: "next" } };
    await readActiveCustomerPageInTransaction(authority, { ...request, request: { kind: "list" }, cursors });
    expect(mocks.refresh).toHaveBeenCalledWith(authority.session, tx);
    expect(mocks.refresh.mock.invocationCallOrder[0]).toBeLessThan(mocks.lock.mock.invocationCallOrder[0]);
    expect(mocks.read).toHaveBeenCalledWith(authority, expect.objectContaining({ request: { kind: "list" }, cursors }));
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it("rejects copied or mismatched authority before refresh or definition access", async () => {
    const authority = await fixture();
    await expect(readActiveCustomerPageInTransaction({ ...authority, session: { ...authority.session } }, request)).rejects.toThrow("FORBIDDEN");
    await expect(readActiveCustomerPageInTransaction({ ...authority, stamp: { ...authority.stamp } }, request)).rejects.toThrow("FORBIDDEN");
    expect(mocks.refresh).not.toHaveBeenCalled(); expect(mocks.lock).not.toHaveBeenCalled(); expect(mocks.definition).not.toHaveBeenCalled();
  });
  it("propagates actual refreshed access or owning private-record denial without falling back", async () => {
    const authority = await fixture(); mocks.refresh.mockRejectedValueOnce(new Error("Membership revoked"));
    await expect(readActiveCustomerPageInTransaction(authority, request)).rejects.toThrow("Membership revoked"); expect(mocks.lock).not.toHaveBeenCalled();
    mocks.read.mockRejectedValueOnce(new Error("Private order denied"));
    await expect(readActiveCustomerPageInTransaction(authority, request)).rejects.toThrow("Private order denied"); expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it.each(["foreignDefinition", "foreignVersion", "wrongDefinition", "wrongActive", "retired", "wrongKind", "unknownSchema", "badChecksum", "noActive"])("denies %s pointer metadata before protected reads", async mode => {
    const authority = await fixture(), row = definition();
    if (mode === "foreignDefinition") row.organisationId = "other";
    if (mode === "foreignVersion") row.activeVersion.organisationId = "other";
    if (mode === "wrongDefinition") row.activeVersion.definitionId = uuid(3);
    if (mode === "wrongActive") row.activeVersionId = uuid(3);
    if (mode === "retired") Object.assign(row, { retiredAt: new Date() });
    if (mode === "wrongKind") row.kind = "recordType";
    if (mode === "unknownSchema") row.activeVersion.schemaVersion = 99;
    if (mode === "badChecksum") row.activeVersion.checksum = "f".repeat(64);
    if (mode === "noActive") Object.assign(row, { activeVersionId: null, activeVersion: null });
    mocks.definition.mockResolvedValue(row);
    await expect(readActiveCustomerPageInTransaction(authority, request)).rejects.toThrow("unavailable"); expect(mocks.read).not.toHaveBeenCalled();
  });
  it("rejects client tenant, pin, approvals, command input and oversized cursors before any refresh", async () => {
    const authority = await fixture();
    for (const extra of [{ organisationId: "other" }, { page: { versionId: uuid(3) } }, { approvals: {} }, { command }, { input: { orderId: "other" } },
      { cursors: Object.fromEntries(Array.from({ length: 101 }, (_, index) => [`p${index}`, null])) }]) {
      await expect(readActiveCustomerPageInTransaction(authority, { ...request, ...extra })).rejects.toThrow();
    }
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
describe("internal currently visible read-only Page action preparation", () => {
  it("reconstructs visible command and exact owning record in the same current transaction, without invoking it", async () => {
    const authority = await fixture(), prepared = await prepareVisiblePageActionInTransaction(authority, action);
    expect(prepared).toEqual({ authority, definitionId: uuid(1), definitionRevision: 4, versionId: uuid(2), sourcePage: source,
      ownerModuleId: "example", anchor: { kind: "record", organisationId: "company", recordId: "order", revision: "4:timestamp" },
      component: { id: "acknowledgement", confirm: true, preview: false }, command });
    expect(mocks.owner).toHaveBeenCalledWith({ session: authority.session, transaction: tx }, source, request.request);
    expect(mocks.resolve).toHaveBeenCalledWith(authority.session, command); expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it.each([{ expectedVersionId: uuid(3) }, { expectedDefinitionRevision: 5 }])("rejects stale saved screen address before native reads", async extra => {
    const authority = await fixture();
    await expect(prepareVisiblePageActionInTransaction(authority, { ...action, ...extra })).rejects.toThrow("screen changed");
    expect(mocks.read).not.toHaveBeenCalled(); expect(mocks.owner).not.toHaveBeenCalled();
  });
  it("rejects hidden or non-action components rather than executing a client-selected command", async () => {
    const authority = await fixture(); mocks.read.mockResolvedValueOnce({ ...model, sections: [] });
    await expect(prepareVisiblePageActionInTransaction(authority, action)).rejects.toThrow("unavailable");
    mocks.read.mockResolvedValueOnce({ ...model, sections: [{ ...model.sections[0], components: [{ id: action.componentId, type: "instructions", text: "Guide" }] }] });
    await expect(prepareVisiblePageActionInTransaction(authority, action)).rejects.toThrow("unavailable"); expect(mocks.owner).not.toHaveBeenCalled();
  });
  it.each(["foreignAnchor", "otherRecord", "otherOwner", "notApproved", "wrongDevice", "noConfirm", "mutating"])("denies %s despite a visually present button", async mode => {
    const authority = await fixture(), owner = await mocks.owner(), metadata = await mocks.resolve(); mocks.owner.mockClear(); mocks.resolve.mockClear();
    if (mode === "foreignAnchor") owner.anchor.organisationId = "other";
    if (mode === "otherRecord") owner.anchor.recordId = "other";
    if (mode === "otherOwner") metadata.ownerModuleId = "other";
    if (mode === "notApproved") owner.policy.commands = [];
    if (mode === "wrongDevice") owner.policy.commands[0].formFactors = ["desktop"];
    if (mode === "noConfirm") mocks.read.mockResolvedValue({ ...model, sections: [{ ...model.sections[0], components: [{ ...model.sections[0].components[0], confirm: false }] }] });
    if (mode === "mutating") metadata.details.sideEffect = "business_mutation";
    mocks.owner.mockResolvedValue(owner); mocks.resolve.mockResolvedValue(metadata);
    await expect(prepareVisiblePageActionInTransaction(authority, action)).rejects.toThrow("unavailable"); expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it("propagates current command grants/module/private denials and refuses raw client overrides", async () => {
    const authority = await fixture(); mocks.resolve.mockRejectedValueOnce(new Error("Command permission revoked"));
    await expect(prepareVisiblePageActionInTransaction(authority, action)).rejects.toThrow("Command permission revoked");
    await expect(prepareVisiblePageActionInTransaction(authority, { ...action, command })).rejects.toThrow();
    await expect(prepareVisiblePageActionInTransaction(authority, { ...action, input: { orderId: "other" } })).rejects.toThrow();
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
});
