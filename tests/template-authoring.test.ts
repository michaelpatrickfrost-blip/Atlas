import { beforeEach, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
const m = vi.hoisted(() => ({ stamps: new WeakMap<object, object>(), refresh: vi.fn(), transaction: vi.fn(), module: vi.fn(), create: vi.fn(), update: vi.fn(),
  audit: vi.fn(), session: vi.fn(), revalidate: vi.fn(), redirect: vi.fn(), nativeSave: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ sessionAuthorityStamp: (session: object) => m.stamps.get(session), requireSession: m.session }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction } }));
vi.mock("@/core/audit/log", () => ({ writeAudit: m.audit }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ nativeFieldMutationSessionInTransaction: m.refresh }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidate }));
vi.mock("next/navigation", () => ({ redirect: m.redirect }));
vi.mock("@/core/contracts/actions", () => ({ createContract: vi.fn() }));
vi.mock("@/core/templates/service", () => ({ requireTemplateWorkspace: vi.fn() }));
import { saveTemplateForSession, saveTemplateInTransaction } from "@/core/templates/authoring";
import { saveTemplate } from "@/app/(app)/templates/actions";

// Real template domain parser/merge-field policy and actual shared save/delegate.
// Current identity/locks and DB transactions are explicit collaborators: in-memory
// rollback proves callback placement, not PostgreSQL atomicity or live membership.
const original: Session = { userId: "actor", organisationId: "company", membershipId: "member", userName: "Actor", userEmail: "actor@example.test",
  organisationName: "Company", capabilities: new Set(["core.contract.manage"]) };
const current = { ...original, capabilities: new Set(original.capabilities) };
const tx = { moduleState: { findFirst: m.module }, documentTemplate: { create: m.create, updateMany: m.update } } as unknown as Prisma.TransactionClient;
type Row = { id: string; organisationId: string; name: string; version: number; status: string };
let rows: Row[], audits: unknown[];
function form(overrides: Record<string, string | undefined> = {}) {
  const input = new FormData();
  for (const [key, value] of Object.entries({ id: "", version: "1", name: "Our agreement", description: "Our wording", category: "Agreement",
    titleTemplate: "Agreement for {{customer.name}}", status: "DRAFT", blocks: JSON.stringify([{ id: "heading", type: "heading", text: "Agreement" },
      { id: "terms", type: "text", text: "Prepared by {{company.name}}. {{custom.scope}}" }]), ...overrides })) if (value !== undefined) input.set(key, value);
  input.append("targetModules", "sales"); return input;
}
beforeEach(() => {
  vi.clearAllMocks(); current.capabilities = new Set(original.capabilities); m.stamps.set(original, {}); m.stamps.set(current, {});
  rows = [{ id: "existing", organisationId: "company", name: "Before", version: 3, status: "DRAFT" },
    { id: "foreign", organisationId: "other", name: "Private", version: 3, status: "DRAFT" },
    { id: "archived", organisationId: "company", name: "Retained", version: 3, status: "ARCHIVED" }]; audits = [];
  m.refresh.mockImplementation(async (authenticated, transaction) => {
    if (!m.stamps.has(authenticated)) throw new Error("FORBIDDEN: genuine session required");
    expect(transaction).toBe(tx); return { session: current, stamp: m.stamps.get(current) };
  });
  m.module.mockResolvedValue({ id: "templates" });
  m.create.mockImplementation(async ({ data }) => { const result = { ...data, id: "created", version: 1 }; rows.push(result); return { id: result.id, version: result.version }; });
  m.update.mockImplementation(async ({ where, data }) => {
    const found = rows.find(row => row.id === where.id && row.organisationId === where.organisationId && row.version === where.version && row.status !== "ARCHIVED");
    if (!found) return { count: 0 }; Object.assign(found, data, { version: found.version + 1 }); return { count: 1 };
  });
  m.audit.mockImplementation(async input => { audits.push(input); });
  m.transaction.mockImplementation(async operation => {
    const before = structuredClone(rows), previousAudits = [...audits];
    try { return await operation(tx); } catch (error) { rows = before; audits = previousAudits; throw error; }
  });
  m.session.mockResolvedValue(original); m.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
});
it("creates using freshly loaded server tenant/actor and native defaults with Audit in the same Serializable transaction", async () => {
  const input = form(); input.set("organisationId", "foreign"); input.set("createdBy", "someone"); input.set("capabilities", "atlas.staff.manage");
  expect(await saveTemplateForSession(original, input)).toEqual({ id: "created", version: 1 });
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  expect(m.refresh).toHaveBeenCalledWith(original, tx);
  expect(m.module).toHaveBeenCalledWith({ where: { organisationId: "company", moduleId: "templates", enabled: true, entitled: true }, select: { id: true } });
  expect(m.create.mock.calls[0][0]).toMatchObject({ data: { organisationId: "company", createdBy: "actor", targetModules: ["sales"], status: "DRAFT" }, select: { id: true, version: true } });
  expect(m.audit).toHaveBeenCalledWith({ organisationId: "company", actorUserId: "actor", action: "template.saved", entityType: "DocumentTemplate", entityId: "created",
    after: { name: "Our agreement", status: "DRAFT" } }, tx);
  expect(m.refresh.mock.invocationCallOrder[0]).toBeLessThan(m.module.mock.invocationCallOrder[0]);
  expect(m.create.mock.invocationCallOrder[0]).toBeLessThan(m.audit.mock.invocationCallOrder[0]);
});
it("updates with exact tenant/current version/nonarchived CAS and original published semantics", async () => {
  expect(await saveTemplateInTransaction(original, tx, form({ id: "existing", version: "3", status: "PUBLISHED" }))).toEqual({ id: "existing", version: 4 });
  expect(m.update.mock.calls[0][0]).toMatchObject({ where: { id: "existing", organisationId: "company", version: 3, status: { not: "ARCHIVED" } },
    data: { status: "PUBLISHED", version: { increment: 1 } } });
  expect(m.transaction).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
});
it.each(["stale", "foreign", "archived", "missing"])("denies %s update without native create or successful Audit", async mode => {
  await expect(saveTemplateForSession(original, form({ id: mode === "stale" ? "existing" : mode, version: mode === "stale" ? "2" : "3" }))).rejects.toThrow("CONFLICT");
  expect(m.audit).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled(); expect(rows[0].version).toBe(3);
});
it.each(["forged", "revoked_stamp", "current_capability", "module"])("checks %s access before metadata mutation", async mode => {
  let authenticated = original;
  if (mode === "forged") authenticated = { ...original };
  if (mode === "revoked_stamp") m.refresh.mockRejectedValueOnce(new Error("FORBIDDEN: stale identity"));
  if (mode === "current_capability") current.capabilities.clear();
  if (mode === "module") m.module.mockResolvedValueOnce(null);
  await expect(saveTemplateForSession(authenticated, form())).rejects.toThrow();
  expect(m.create).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  if (mode === "forged") expect(m.transaction).not.toHaveBeenCalled();
});
it("retains actual native Atlas staff module exception only from freshly authenticated capabilities", async () => {
  current.capabilities.add("atlas.staff.manage"); m.module.mockResolvedValue(null);
  await saveTemplateInTransaction(original, tx, form()); expect(m.module).not.toHaveBeenCalled();
  current.capabilities.delete("atlas.staff.manage");
  await expect(saveTemplateInTransaction(original, tx, form())).rejects.toThrow("not enabled");
});
it.each([
  { name: "" }, { titleTemplate: "" }, { status: "ARCHIVED" }, { status: "DELETE" }, { blocks: "{" },
  { blocks: JSON.stringify([{ id: "same", type: "text", text: "A" }, { id: "same", type: "heading", text: "B" }]) },
  { blocks: JSON.stringify([{ id: "empty", type: "divider", text: "" }]) },
  { titleTemplate: "{{customer.bank_account}}" }, { titleTemplate: "{{customer.name}" },
  { id: "existing", version: "" }, { id: "existing", version: "-1" }, { id: "existing", version: "2147483647" },
])("preserves actual template/merge/status/version validation before effects %#", async overrides => {
  await expect(saveTemplateForSession(original, form(overrides))).rejects.toThrow();
  expect(m.create).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("rejects missing/unsupported target apps and transport files without exposing an alternate engine", async () => {
  const empty = form(); empty.delete("targetModules"); await expect(saveTemplateForSession(original, empty)).rejects.toThrow("target app");
  const unknown = form(); unknown.append("targetModules", "finance"); await expect(saveTemplateForSession(original, unknown)).rejects.toThrow("target app");
  const file = form(); file.set("name", new Blob(["wrong"]), "wrong.txt"); await expect(saveTemplateForSession(original, file)).rejects.toThrow("must be text");
  expect(m.audit).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
});
it.each(["create", "update"])("Audit failure propagates through the same original transaction and rolls back simulated %s", async mode => {
  const before = structuredClone(rows); m.audit.mockRejectedValueOnce(new Error("Audit unavailable"));
  await expect(saveTemplateForSession(original, mode === "create" ? form() : form({ id: "existing", version: "3" }))).rejects.toThrow("Audit unavailable");
  expect(rows).toEqual(before); expect(audits).toEqual([]); expect(m.transaction).toHaveBeenCalledTimes(1);
});
it("maps serialization conflicts without retrying writes or converting unrelated failures", async () => {
  m.transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("SSI", { code: "P2034", clientVersion: "test" }));
  await expect(saveTemplateForSession(original, form())).rejects.toThrow("CONFLICT"); expect(m.transaction).toHaveBeenCalledTimes(1);
  m.transaction.mockRejectedValueOnce(new Error("Storage offline")); await expect(saveTemplateForSession(original, form())).rejects.toThrow("Storage offline");
});
it("original native action uses the shared save and preserves existing redirects/revalidation after commit", async () => {
  await expect(saveTemplate(form())).rejects.toThrow("NEXT_REDIRECT");
  expect(m.transaction).toHaveBeenCalledTimes(1); expect(m.audit).toHaveBeenCalledTimes(1);
  expect(m.revalidate.mock.calls).toEqual([["/templates"], ["/crm/contracts"]]); expect(m.redirect).toHaveBeenCalledWith("/templates/created");
  expect(m.audit.mock.invocationCallOrder[0]).toBeLessThan(m.revalidate.mock.invocationCallOrder[0]);
  m.audit.mockRejectedValueOnce(new Error("Audit failed")); m.revalidate.mockClear(); m.redirect.mockClear();
  await expect(saveTemplate(form())).rejects.toThrow("Audit failed"); expect(m.revalidate).not.toHaveBeenCalled(); expect(m.redirect).not.toHaveBeenCalled();
});
