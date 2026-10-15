import { beforeEach, expect, it, vi } from "vitest";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
const m = vi.hoisted(() => ({ refresh: vi.fn(), module: vi.fn(), template: vi.fn(), provider: vi.fn() }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { declarative, query } from "@/core/studio/registry/contracts";
import { inspectTemplateDraftInTransaction } from "@/core/templates/inspection";
import { parseTemplateSave } from "@/core/templates/authoring-input";

// Real original template validation, registry discovery and inspection. Genuine
// session refresh/locks are an explicit collaborator; these tests do not claim SQL.
const original: Session = { userId: "actor", organisationId: "company", membershipId: "member", userName: "Actor", userEmail: "actor@example.test",
  organisationName: "Company", capabilities: new Set(["core.contract.manage", "sales.order.read"]) };
const current: Session = { ...original, capabilities: new Set(original.capabilities) };
const tx = { moduleState: { findFirst: m.module }, documentTemplate: { findFirst: m.template } } as unknown as Prisma.TransactionClient;
let authority: FieldRuntimeAuthority, currentAuthority: FieldRuntimeAuthority, ownerEnabled: boolean;
const content = { name: "Order agreement", titleTemplate: "Order for {{customer.name}}", description: "Our standard agreement", category: "Agreement", status: "DRAFT",
  blocks: [{ id: "intro", type: "text", text: "Prepared by {{company.name}} for {{customer.name}}: {{custom.scope}}" },
    { id: "table", type: "table", text: "Reference | {{record.reference}}\n{{custom.scope}} | {{contact.email}}" }], targetModules: ["sales"] };
let rows: Array<typeof content & { id: string; organisationId: string; version: number }>;
function form(overrides: Record<string, string | undefined> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ id: "template", version: "2", ...content, blocks: JSON.stringify(content.blocks), targetModules: undefined, ...overrides }))
    if (value !== undefined) data.set(key, String(value));
  data.append("targetModules", "sales"); return data;
}
beforeEach(() => {
  vi.clearAllMocks(); current.capabilities = new Set(original.capabilities); ownerEnabled = true;
  const registry = new CapabilityRegistry(async session => session.organisationId === "company" && ownerEnabled);
  const shared = { version: 1, capability: "sales.order.read", lifecycle: "active" as const, classification: "confidential" as const };
  registry.register("sales", { contributions: [
    declarative({ ...shared, kind: "template", id: "sales.template.order", label: "Sales order", schema: z.object({}), references: ["sales.template.order.list", "sales.template.order.get"] }),
    ...["list", "get"].map(suffix => query({ ...shared, kind: "query", id: `sales.template.order.${suffix}`, label: `Order ${suffix}`, input: z.object({}), output: z.object({}),
      maxCardinality: 1, pagination: "none", costClass: "low", execute: m.provider })),
  ] });
  currentAuthority = { session: current, transaction: tx, stamp: {} as FieldRuntimeAuthority["stamp"], registry };
  authority = { ...currentAuthority, session: original, registry: new CapabilityRegistry(async () => { throw new Error("Untrusted old registry used"); }) };
  m.refresh.mockImplementation(async (session, transaction) => { expect(session).toBe(original); expect(transaction).toBe(tx); return currentAuthority; });
  m.module.mockResolvedValue({ id: "module" });
  rows = [{ ...structuredClone(content), id: "template", version: 3, organisationId: "company" },
    { ...structuredClone(content), id: "foreign", version: 3, organisationId: "other" },
    { ...structuredClone(content), id: "archived", version: 3, organisationId: "company", status: "ARCHIVED" }];
  m.template.mockImplementation(async ({ where }) => rows.find(row => row.id === where.id && row.organisationId === where.organisationId && row.status !== "ARCHIVED") ?? null);
});

it("compares current saved content under fresh tenant authority without reading business data or invoking a provider", async () => {
  const before = structuredClone(rows), input = form({ name: "My local name" }); input.set("organisationId", "other");
  const result = await inspectTemplateDraftInTransaction(authority, input);
  expect(result).toMatchObject({ valid: true, errors: [], currentVersion: 3, changedSinceOpened: true,
    saved: { id: "template", version: 3, data: { name: "Order agreement" } }, local: { id: "template", version: 2, data: { name: "My local name" } },
    changes: [{ kind: "setting", label: "Template name changed" }] });
  expect(result.contexts).toEqual([expect.objectContaining({ id: "sales.template.order", label: "Sales order", ownerModuleId: "sales", version: 1,
    listQuery: { id: "sales.template.order.list", version: 1 }, getQuery: { id: "sales.template.order.get", version: 1 } })]);
  expect(m.template).toHaveBeenCalledExactlyOnceWith({ where: { id: "template", organisationId: "company", status: { not: "ARCHIVED" } }, select: {
    id: true, version: true, name: true, titleTemplate: true, description: true, category: true, blocks: true, targetModules: true, status: true } });
  expect(m.refresh.mock.invocationCallOrder[0]).toBeLessThan(m.module.mock.invocationCallOrder[0]);
  expect(m.module.mock.invocationCallOrder[0]).toBeLessThan(m.template.mock.invocationCallOrder[0]);
  expect(m.provider).not.toHaveBeenCalled(); expect(rows).toEqual(before);
});
it("reports exact title, section and table-cell use of protected details with original ownership", async () => {
  const result = await inspectTemplateDraftInTransaction(authority, form());
  expect(result.details.find(detail => detail.key === "customer.name")).toMatchObject({ label: "Customer name", source: { kind: "customer", label: "Customer Master" },
    uses: [{ location: "title", label: "Document title" }, { location: "section", label: "Section 1 · Paragraph", sectionId: "intro" }] });
  expect(result.details.find(detail => detail.key === "custom.scope")).toMatchObject({ source: { kind: "custom", label: "Detail entered for each document" },
    uses: [{ location: "section", sectionId: "intro" }, { location: "table_cell", sectionId: "table", row: 2, column: 1 }] });
  expect(result.details.find(detail => detail.key === "record.reference")?.uses).toEqual([
    { location: "table_cell", label: "Section 2 · Table · Row 1, column 2", sectionId: "table", row: 1, column: 2 }]);
});
it("keeps a validated current saved snapshot available when local edits are incomplete, without raw token diagnostics", async () => {
  const result = await inspectTemplateDraftInTransaction(authority, form({ titleTemplate: "{{customer.bank_account}}" }));
  expect(result).toMatchObject({ valid: false, local: null, currentVersion: 3, changedSinceOpened: true, saved: { version: 3 }, details: [], contexts: [], changes: [] });
  expect(result.errors).toEqual(["A document detail is incomplete or unavailable. Add it again using the detail picker."]);
  expect(m.provider).not.toHaveBeenCalled();
});
it.each(["fresh_capability", "module", "revoked_identity"])("rejects %s before any template metadata is disclosed", async mode => {
  if (mode === "fresh_capability") current.capabilities.delete("core.contract.manage");
  if (mode === "module") m.module.mockResolvedValue(null);
  if (mode === "revoked_identity") m.refresh.mockRejectedValueOnce(new Error("FORBIDDEN: current identity"));
  await expect(inspectTemplateDraftInTransaction(authority, form())).rejects.toThrow();
  expect(m.template).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
});
it.each(["foreign", "archived", "missing"])("does not expose %s saved content", async id => {
  await expect(inspectTemplateDraftInTransaction(authority, form({ id }))).rejects.toThrow("unavailable or outside your access");
  expect(m.provider).not.toHaveBeenCalled();
});
it("preserves native staff workspace exception but does not infer available record sources", async () => {
  current.capabilities.add("atlas.staff.manage"); m.module.mockResolvedValue(null); ownerEnabled = false;
  const result = await inspectTemplateDraftInTransaction(authority, form());
  expect(result.valid).toBe(true); expect(m.module).not.toHaveBeenCalled(); expect(result.contexts).toEqual([]);
});
it.each(["native_read", "module", "target"])("only lists actually available original source metadata for %s", async mode => {
  const input = form();
  if (mode === "native_read") current.capabilities.delete("sales.order.read");
  if (mode === "module") ownerEnabled = false;
  if (mode === "target") input.set("targetModules", "crm");
  expect((await inspectTemplateDraftInTransaction(authority, input)).contexts).toEqual([]);
  expect(m.provider).not.toHaveBeenCalled();
});
it("reports section additions, changes, removals and reordering without treating insertion as movement", async () => {
  const added = { id: "new", type: "heading", text: "New introduction" };
  const result = await inspectTemplateDraftInTransaction(authority, form({ blocks: JSON.stringify([added, ...content.blocks]) }));
  expect(result.changes).toEqual([{ kind: "section_added", sectionId: "new", label: "Section 1 · Heading added" }]);
  const moved = await inspectTemplateDraftInTransaction(authority, form({ blocks: JSON.stringify([content.blocks[1], { ...content.blocks[0], text: "Changed" }]) }));
  expect(moved.changes.map(change => change.kind)).toEqual(["section_moved", "section_changed", "section_moved"]);
  const removed = await inspectTemplateDraftInTransaction(authority, form({ blocks: JSON.stringify([content.blocks[1]]) }));
  expect(removed.changes).toEqual([{ kind: "section_removed", sectionId: "intro", label: "Section 1 · Paragraph removed" }]);
});
it("validates a new draft without a stored row and preserves the exact native save parser", async () => {
  const input = form({ id: "", version: "" });
  const result = await inspectTemplateDraftInTransaction(authority, input);
  expect(result).toMatchObject({ valid: true, saved: null, currentVersion: null, changedSinceOpened: false, local: parseTemplateSave(input) });
  expect(m.template).not.toHaveBeenCalled();
});
it("fails closed on invalid persisted content, malformed identity and unsupported local sections", async () => {
  rows[0].titleTemplate = "{{private.unknown}}";
  await expect(inspectTemplateDraftInTransaction(authority, form())).rejects.toThrow();
  rows[0].titleTemplate = content.titleTemplate;
  const malformed = form(); malformed.set("id", new Blob(["id"]), "id.txt"); m.template.mockClear();
  await expect(inspectTemplateDraftInTransaction(authority, malformed)).rejects.toThrow("valid template"); expect(m.template).not.toHaveBeenCalled();
  const result = await inspectTemplateDraftInTransaction(authority, form({ blocks: JSON.stringify([{ id: "script", type: "script", text: "unsafe" }]) }));
  expect(result).toMatchObject({ valid: false, saved: { version: 3 }, local: null });
  expect(result.errors[0]).not.toContain("script");
});
