import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import type { Prisma } from "@/generated/prisma/client";
const mock = vi.hoisted(() => ({ membership: vi.fn(), sealed: vi.fn(), transaction: vi.fn(), currentField: vi.fn(), writtenPlan: vi.fn(), writtenValue: vi.fn(), generation: vi.fn(), definition: vi.fn(), slot: vi.fn(), typed: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: mock.membership } } }));
vi.mock("@/core/studio/configuration/pins", () => ({ loadSealedConfigurationVersion: mock.sealed }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ withFieldRuntimeAuthority: mock.transaction }));
vi.mock("@/core/studio/fields/runtime-read", () => ({ readVersionedFieldContextInTransaction: mock.currentField, readVersionedFieldPlanInTransaction: mock.writtenPlan, readVersionedFieldValueInTransaction: mock.writtenValue }));
import { compileCustomField } from "@/core/studio/compiler/fields";
import { sessionForUser, sessionAuthorityStamp } from "@/core/auth/session";
import { entity, query, checksum } from "@/core/studio/registry/contracts";
import { pageSource } from "@/core/studio/registry/page-contracts";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { pageProjectionSchema, pageQueryOutputSchema, type PageSourcePolicy, type PageSourceCallbacks } from "@/core/studio/pages/owner-contract";
import { reconstructPageApprovalsInTransaction } from "@/core/studio/pages/server-approvals";
import { compilePage } from "@/core/studio/pages/compiler";
import { readPublishedPage, readPublishedPageInTransaction } from "@/core/studio/pages/runtime";
import { createDesignPageDisplayModel } from "@/core/studio/pages/design-model";
import { readDraftPageInTransaction } from "@/core/studio/pages/runtime";
import { PageRenderer } from "@/components/studio/page-renderer";
import type { ContractReference } from "@/core/studio/registry/types";

// Real Session, registry/page factories, compiler, approval builder and renderer.
// Explicit sealed-loader/owning SQL collaborators: not PostgreSQL/SSI/live proof.
const uuid = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ref = ({ id, version, schemaHash, contractHash }: ContractReference): ContractReference => ({ id, version, schemaHash, contractHash });
const base = { version: 1, label: "Sales orders", capability: "example.order.read", lifecycle: "active" as const, classification: "confidential" as const };
const forms = ["desktop", "tablet", "phone"] as const;
const tx = { studioDefinition: { findFirst: mock.definition }, studioFieldGeneration: { findFirst: mock.generation }, studioFieldSlot: { findFirst: mock.slot }, studioFieldValue: { findFirst: mock.typed } } as unknown as Prisma.TransactionClient;
const columns = [{ id: "subject", label: "Order", valueType: "string" as const, nullable: false, classification: "confidential" as const },
  { id: "amount", label: "Total", valueType: "number" as const, nullable: false, classification: "confidential" as const, format: { kind: "money_minor" as const, currencyColumnId: "currency" } },
  { id: "currency", valueType: "string" as const, nullable: false, classification: "confidential" as const },
  { id: "urgent", valueType: "boolean" as const, nullable: false, classification: "confidential" as const }];
const get = { id: "example.order.page_get", version: 1 }, list = { id: "example.order.page_list", version: 1 };
const membership = () => ({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 2, active: true,
  grantedCapabilities: [base.capability], deniedCapabilities: [] as string[], roles: [],
  user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
  organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
beforeEach(() => { vi.resetAllMocks(); mock.membership.mockImplementation(async () => membership()); });
async function fixture(mode: "record" | "list" = "record", queryCapability = base.capability, extension = false) {
  const session = await sessionForUser("company", "actor"); if (!session) throw new Error("No actor.");
  const run = vi.fn(async (_ctx: unknown, input: unknown) => {
    const cursor = (input as { cursor?: { id: string } }).cursor;
    return { rows: [{ id: mode === "record" ? "order" : cursor?.id ?? "first", values: { subject: "Business order", amount: 12345, currency: "GBP", urgent: false } }], nextCursor: mode === "list" ? { id: "next" } : null };
  });
  const authorise = vi.fn<PageSourceCallbacks["authoriseRead"]>(async (context, request) => request.kind === "list" ? { kind: "list", organisationId: context.session.organisationId }
    : { kind: "record", organisationId: context.session.organisationId, recordId: request.recordId, revision: "actual:4:timestamp", ...(extension ? { nativeRevision: 4 } : {}) });
  const policy: PageSourcePolicy = { schemaVersion: 1, entity: { id: "example.order", version: 1 }, accessMode: "ordinary_read", variants: false, fieldSourceVersions: extension ? [1] : [],
    nativeFields: [{ id: "subject", query: get, columnId: "subject" }, { id: "amount", query: get, columnId: "amount" }],
    queries: [{ query: get, scope: "record", purpose: "fact", columns }, { query: list, scope: "list", purpose: "list", columns }],
    facts: [{ id: "urgent", contract: { id: "example.order", version: 1 }, query: get, columnId: "urgent", valueType: "boolean", nullable: false, classification: "confidential", provenance: "owner_native" }],
    commands: [], metrics: [], surfaces: [], maxQueryCost: 24 };
  const registry = new CapabilityRegistry(async () => true);
  registry.register("example", { contributions: [entity({ ...base, kind: "entity", id: "example.order", key: "string",
    fields: [{ id: "subject", label: "Order", type: "string", nullable: false, classification: "confidential", filterable: true, sortable: false, decision: false, template: false },
      { id: "amount", label: "Total", type: "money", nullable: false, classification: "confidential", filterable: true, sortable: false, decision: false, template: false }], extensionPolicy: { customFields: extension, recordTypes: false, pageVariants: false }, ...(extension ? { record: { writeCapability: "example.order.manage", detailRoute: "/orders/{recordId}", labelField: "subject", listQuery: list, getQuery: get, fieldPolicy: { types: ["string" as const], reservedKeys: ["subject", "amount"], referenceEntities: [], maxFields: 10 }, async authorise(context: { session: { organisationId: string } }, request: { recordId: string }) { return { organisationId: context.session.organisationId, recordId: request.recordId, revision: 4 }; } } } : {}) }),
    ...[get, list].map(source => query({ ...base, ...source, kind: "query", capability: queryCapability, transaction: "required", pagination: source === get ? "none" : "cursor",
      maxCardinality: source === get ? 1 : 20, costClass: "low", input: z.strictObject({ pageSize: z.number().int(), cursor: z.unknown() }),
      output: pageProjectionSchema(columns, source === get ? 1 : 20), execute: run })),
    pageSource({ ...base, id: "example.order.page", policy, callbacks: { authoriseRead: authorise,
      async bindQueryInput(_ctx, _anchor, request) { return { pageSize: request.pageSize, cursor: request.cursor }; }, async projectQueryOutput(_ctx, _anchor, _request, output) { return pageQueryOutputSchema.parse(output); } } })] });
  const authority: FieldRuntimeAuthority = { session, stamp: sessionAuthorityStamp(session)!, registry, transaction: tx };
  const field = extension ? await compileCustomField(session, { schemaVersion: 1, entity: ref(registry.describe("example.order", 1)), storageGeneration: uuid(3), field: { key: "extra", label: "Business detail", classification: "confidential", storage: { type: "string" } } }, registry) : null;
  const fieldPin = field ? { kind: "customField" as const, definitionId: uuid(4), versionId: uuid(5), schemaVersion: 1 as const, checksum: field.checksum } : null;
  const fieldVersion = field ? { id: uuid(5), organisationId: "company", definitionId: uuid(4), schemaVersion: 1, payload: field.payload, compiledPlan: field.plan, checksum: field.checksum } : null;
  const definition = field ? { id: uuid(4), organisationId: "company", key: "example.order.extra", activeVersionId: uuid(5), activeVersion: fieldVersion } : null;
  mock.generation.mockResolvedValue({ id: uuid(3) }); mock.definition.mockResolvedValue(definition);
  mock.sealed.mockResolvedValue(fieldVersion);
  const approvals = await reconstructPageApprovalsInTransaction(authority, { sourcePage: ref(registry.describe("example.order.page", 1)), customFields: fieldPin ? [fieldPin] : [] });
  const plan = compilePage({ schemaVersion: 1, entity: ref(approvals.entity), formFactors: forms, variants: [], sections: [{ id: "main", label: "Your sales orders", help: "", formFactors: forms,
    columns: { desktop: 2, tablet: 2, phone: 1 }, components: [{ id: "guide", type: "instructions", text: "Business workspace", formFactors: forms }, ...(mode === "record" ? [{ id: "header", type: "fields", formFactors: forms,
      fields: [{ source: "native", fieldId: "subject" }, { source: "native", fieldId: "amount" }, ...(fieldPin ? [{ source: "extension", reference: fieldPin }] : [])] }, { id: "urgent_note", type: "callout", text: "Urgent", tone: "warning", formFactors: forms,
      visibleWhen: { kind: "fact", factId: "urgent", operator: "equals", values: [true] } }] : [{ id: "orders", type: "queryList", label: "Orders", query: ref(registry.describe(list.id, 1)), pageSize: 10, columns: ["subject", "amount"], formFactors: forms }])] }] }, approvals);
  const pin = { kind: "page", definitionId: uuid(1), versionId: uuid(2), schemaVersion: 1, checksum: checksum(plan) };
  mock.sealed.mockImplementation(async (_session, _tx, selected) => selected.kind === "customField" ? fieldVersion : { id: pin.versionId, definitionId: pin.definitionId, organisationId: "company", payload: plan.payload, compiledPlan: plan, checksum: pin.checksum });
  mock.transaction.mockImplementation(async (_session, operation) => operation(authority));
  const request = { page: pin, request: mode === "list" ? { kind: "list" } : { kind: "record", recordId: "order" }, formFactor: "phone", cursors: {} };
  if (field) {
    mock.currentField.mockResolvedValue({ definition, payload: field.payload, anchor: { organisationId: "company", recordId: "order", revision: 4 }, extension: { id: uuid(6) } });
    mock.writtenPlan.mockResolvedValue(field.payload);
    const written = { id: uuid(8), organisationId: "company", definitionId: uuid(4), generationId: uuid(3), slotId: uuid(7), versionId: uuid(5), revision: 1, valueType: "string", schemaVersion: fieldVersion };
    mock.slot.mockResolvedValue({ id: uuid(7), organisationId: "company", extensionId: uuid(6), definitionId: uuid(4), generationId: uuid(3), activeValueId: uuid(8), activeValue: written });
    mock.typed.mockResolvedValue(written); mock.writtenValue.mockResolvedValue({ type: "string", value: "Bespoke value" });
  }
  return { authority, session, registry, plan, pin, request, run, authorise };
}
describe("fresh owning Page runtime and shared renderer", () => {
  it("builds immediate labelled samples through the same renderer, while actual draft Preview uses owning reads", async () => {
    const f = await fixture(), catalog = { nativeFields: [{ id: "subject", label: "Order" }, { id: "amount", label: "Total" }], customFields: [], facts: [], queries: [], actions: [], metrics: [], surfaces: [] };
    const model = createDesignPageDisplayModel(f.plan.payload, catalog, "phone");
    const html = renderToStaticMarkup(createElement(PageRenderer, { model, interaction: "design_only" }));
    expect(html).toContain("Sample"); expect(html).not.toContain("Business order"); expect(f.run).not.toHaveBeenCalled();
    const preview = await readDraftPageInTransaction(f.authority, { payload: f.plan.payload, request: f.request.request, formFactor: "phone", cursors: {} });
    expect(JSON.stringify(preview)).toContain("Business order"); expect(f.run).toHaveBeenCalledTimes(1);
    await expect(readDraftPageInTransaction(f.authority, { payload: f.plan.payload, request: f.request.request, formFactor: "phone", approvals: f.plan.approvals })).rejects.toThrow();
  });
  it("preflights current and written field policy before any typed value columns, then delegates reference/codec checks", async () => {
    const f = await fixture("record", base.capability, true);
    mock.writtenPlan.mockRejectedValueOnce(new Error("Written field Read revoked"));
    await expect(readPublishedPageInTransaction(f.authority, f.request)).rejects.toThrow("Written field Read revoked");
    expect(mock.typed).not.toHaveBeenCalled(); expect(mock.writtenValue).not.toHaveBeenCalled();
    const model = await readPublishedPageInTransaction(f.authority, f.request);
    expect(JSON.stringify(model)).toContain("Bespoke value");
    expect(mock.writtenPlan.mock.invocationCallOrder.at(-1)!).toBeLessThan(mock.typed.mock.invocationCallOrder[0]);
    expect(mock.slot).toHaveBeenLastCalledWith(expect.objectContaining({ select: expect.objectContaining({ activeValue: { select: expect.not.objectContaining({ textValue: expect.anything() }) } }) }));
    expect(mock.typed).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organisationId: "company", definitionId: uuid(4), generationId: uuid(3), slotId: uuid(7), versionId: uuid(5) }) }));
  });

  it("reconstructs sealed metadata then reads one exact private owner projection, preserves false and formats real minor units", async () => {
    const f = await fixture(), model = await readPublishedPage(f.session, f.request);
    expect(mock.transaction).toHaveBeenCalledWith(f.session, expect.any(Function));
    expect(mock.sealed).toHaveBeenCalledWith(f.session, tx, f.pin);
    expect(f.run).toHaveBeenCalledTimes(1); expect(f.authorise).toHaveBeenCalledTimes(2);
    expect(model.sections[0].components.map(component => component.id)).toEqual(["guide", "header"]);
    const html = renderToStaticMarkup(createElement(PageRenderer, { model, interaction: "design_only" }));
    expect(html).toContain("Business order"); expect(html).toContain("£123.45"); expect(html).not.toContain("Urgent");
    expect(JSON.stringify(model)).not.toContain("capability"); expect(JSON.stringify(model)).not.toContain("visibleWhen"); expect(JSON.stringify(model)).not.toContain("urgent");
    expect(model.sections[0].columns).toBe(1);
  });
  it("rejects changed saved plans, client tenant/type claims and copied authority before canonical data", async () => {
    const f = await fixture(); mock.sealed.mockResolvedValueOnce({ payload: f.plan.payload, compiledPlan: f.plan, checksum: "f".repeat(64) });
    await expect(readPublishedPageInTransaction(f.authority, f.request)).rejects.toThrow("incompatible");
    await expect(readPublishedPageInTransaction(f.authority, { ...f.request, organisationId: "foreign" })).rejects.toThrow();
    await expect(readPublishedPageInTransaction(f.authority, { ...f.request, recordTypeDefinitionId: uuid(3) })).rejects.toThrow();
    await expect(readPublishedPageInTransaction({ ...f.authority, session: { ...f.session } }, f.request)).rejects.toThrow("incompatible");
    expect(f.authorise).not.toHaveBeenCalled(); expect(f.run).not.toHaveBeenCalled();
  });
  it("omits denied query components without protected reads, while preserving useful guidance", async () => {
    const f = await fixture("record", "example.secret.read"), model = await readPublishedPageInTransaction(f.authority, f.request);
    expect(model.sections[0].components.map(component => component.id)).toEqual(["guide"]); expect(f.run).not.toHaveBeenCalled();
  });
  it("fails a revoked canonical/private owner scope before data and catches changed owner anchors", async () => {
    const f = await fixture(); f.authorise.mockRejectedValueOnce(new Error("Private access revoked"));
    await expect(readPublishedPageInTransaction(f.authority, f.request)).rejects.toThrow("revoked"); expect(f.run).not.toHaveBeenCalled();
    f.authorise.mockResolvedValueOnce({ kind: "record", organisationId: "company", recordId: "order", revision: "4" }).mockResolvedValueOnce({ kind: "record", organisationId: "company", recordId: "order", revision: "5" });
    await expect(readPublishedPageInTransaction(f.authority, f.request)).rejects.toThrow("native page record changed");
  });
  it("keeps bounded list pagination on the approved list scope, without implying a complete corpus", async () => {
    const f = await fixture("list"), model = await readPublishedPageInTransaction(f.authority, { ...f.request, cursors: { orders: { id: "second" } } });
    const component = model.sections[0].components.find(component => component.type === "queryList");
    expect(component?.type === "queryList" && component.rows[0].id).toBe("second");
    expect(component?.type === "queryList" && component.nextCursor).toEqual({ id: "next" });
    expect(f.run).toHaveBeenCalledWith(expect.anything(), { pageSize: 10, cursor: { id: "second" } });
    await expect(readPublishedPageInTransaction(f.authority, { ...f.request, cursors: { guide: null } })).rejects.toThrow("cursor target");
  });
  it("keeps distinct cursors for two components using the same approved query", async () => {
    const f = await fixture("list"), payload = structuredClone(f.plan.payload), selected = payload.sections[0].components.find(component => component.type === "queryList")!;
    payload.sections[0].components.push({ ...selected, id: "other_orders" });
    const plan = compilePage(payload, f.plan.approvals), pin = { ...f.pin, checksum: checksum(plan) };
    mock.sealed.mockResolvedValue({ payload: plan.payload, compiledPlan: plan, checksum: pin.checksum });
    const model = await readPublishedPageInTransaction(f.authority, { ...f.request, page: pin, cursors: { orders: { id: "first_page" }, other_orders: { id: "other_page" } } });
    const lists = model.sections[0].components.filter(component => component.type === "queryList");
    expect(lists.map(component => component.rows[0].id)).toEqual(["first_page", "other_page"]);
    expect(f.run).toHaveBeenCalledTimes(2);
  });
  it("does not query a wholly hidden component and formats supported currency exponents explicitly", async () => {
    const f = await fixture(), payload = structuredClone(f.plan.payload);
    payload.sections[0].components = payload.sections[0].components.filter(component => component.id !== "urgent_note");
    const header = payload.sections[0].components.find(component => component.id === "header")!;
    header.visibleWhen = { kind: "capabilities", mode: "all", capabilities: ["example.secret.read"] };
    const plan = compilePage(payload, f.plan.approvals), pin = { ...f.pin, checksum: checksum(plan) };
    mock.sealed.mockResolvedValueOnce({ payload: plan.payload, compiledPlan: plan, checksum: pin.checksum });
    const hidden = await readPublishedPageInTransaction(f.authority, { ...f.request, page: pin });
    expect(hidden.sections[0].components.map(component => component.id)).toEqual(["guide"]); expect(f.run).not.toHaveBeenCalled();
    for (const [currency, expected] of [["JPY", "12,345"], ["KWD", "12.345"], ["XYZ", "Unavailable"]]) {
      f.run.mockResolvedValueOnce({ rows: [{ id: "order", values: { subject: "Order", amount: 12345, currency, urgent: false } }], nextCursor: null });
      const model = await readPublishedPageInTransaction(f.authority, f.request), html = renderToStaticMarkup(createElement(PageRenderer, { model, interaction: "design_only" }));
      expect(html).toContain(expected);
    }
  });
  it("keeps commands, navigation, pagination and native surfaces inert in design preview", () => {
    const action = vi.fn(), next = vi.fn(), navigate = vi.fn(), surface = vi.fn(() => "Active native form");
    const model = { variantId: null, formFactor: "phone" as const, sections: [{ id: "main", label: "Order", help: "", columns: 1, components: [
      { id: "button", type: "action" as const, label: "Preview acknowledgement", help: "", command: { id: "example.order.preview", version: 1, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) }, confirm: false, preview: false },
      { id: "list", type: "queryList" as const, label: "Orders", help: "", columns: ["Order"], rows: [{ id: "private", cells: [{ label: "Order", text: "Business order", unavailable: false }] }], nextCursor: { id: "next" } },
      { id: "native", type: "surface" as const, label: "Native form", help: "", family: "module", outputs: [] },
    ] }] };
    const html = renderToStaticMarkup(createElement(PageRenderer, { model, interaction: "design_only", onAction: action, onNext: next, onRecordSelect: navigate, renderSurface: surface }));
    expect(html).toContain("disabled"); expect(html).not.toContain("Active native form");
    expect(surface).not.toHaveBeenCalled(); expect(action).not.toHaveBeenCalled(); expect(next).not.toHaveBeenCalled(); expect(navigate).not.toHaveBeenCalled();
  });
});
