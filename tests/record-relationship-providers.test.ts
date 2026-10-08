import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const state = vi.hoisted(() => ({ db: Object.fromEntries(["salesOrder", "quote", "manufacturingOrder", "financeDocument", "fulfilmentRequirement", "shipment", "product", "party"].map(name => [name, { findFirst: vi.fn(), findMany: vi.fn() }])) }));
vi.mock("@/core/db/client", () => ({ db: state.db }));
import { salesRecordContext, salesRecordRelationships } from "@/modules/sales/services/relationships";
import { manufacturingRecordContext, manufacturingRecordRelationships } from "@/modules/manufacturing/services/relationships";
import { financeRecordContext, financeRecordRelationships } from "@/modules/finance/services/relationships";
import { logisticsRecordContext, logisticsRecordRelationships } from "@/modules/logistics/services/relationships";
import { productRecordRelationships } from "@/modules/products/services/relationships";
import { customerRecordRelationships } from "@/core/customers/relationships";
const session = (caps: string[] = []) => ({ userId: "viewer", organisationId: "tenant", capabilities: new Set(caps) }) as Session;
const context = { record: { moduleId: "sales", type: "order", id: "order" }, anchors: [] };
beforeEach(() => { vi.clearAllMocks(); for (const model of Object.values(state.db)) { model.findFirst.mockResolvedValue(null); model.findMany.mockResolvedValue([]); } });
it("source order context checks capability and tenant before returning canonical IDs", async () => {
  expect(await salesRecordContext(session(), context.record)).toBeNull(); expect(state.db.salesOrder.findFirst).not.toHaveBeenCalled();
  state.db.salesOrder.findFirst.mockResolvedValue({ partyId: "customer", quoteId: "quote", lines: [{ productId: "product" }] });
  const result = await salesRecordContext(session(["sales.order.read"]), context.record);
  expect(state.db.salesOrder.findFirst.mock.calls[0][0].where).toEqual({ organisationId: "tenant", id: "order" });
  expect(result?.anchors).toEqual([{ moduleId: "core", type: "customer", id: "customer" }, { moduleId: "sales", type: "quote", id: "quote" }, { moduleId: "products", type: "product", id: "product" }]);
});
it("all target owners omit records without their own read capabilities", async () => {
  const source = { ...context, anchors: [{ moduleId: "sales", type: "quote", id: "q" }, { moduleId: "sales", type: "order", id: "o" }, { moduleId: "core", type: "customer", id: "c" }, { moduleId: "products", type: "product", id: "p" }] };
  for (const provider of [salesRecordRelationships, manufacturingRecordRelationships, logisticsRecordRelationships, financeRecordRelationships, productRecordRelationships, customerRecordRelationships]) expect((await provider(session(), source)).links).toEqual([]);
  for (const model of Object.values(state.db)) expect(model.findMany).not.toHaveBeenCalled();
});
it("Finance retains document/project restrictions on both source and linked invoices", async () => {
  await financeRecordRelationships(session(["finance.receivables.read"]), context);
  expect(state.db.financeDocument.findMany.mock.calls[0][0].where.AND[0]).toMatchObject({ organisationId: "tenant", AND: [{ OR: [{ projectId: null }, { projectId: null }] }, expect.anything()] });
  await financeRecordContext(session(["finance.receivables.read"]), { moduleId: "finance", type: "document", id: "invoice" });
  expect(state.db.financeDocument.findFirst.mock.calls[0][0].where.AND[1]).toEqual({ id: "invoice" });
});
it("Manufacturing links only actual source-line relationships, not matching product guesses", async () => {
  state.db.manufacturingOrder.findMany.mockResolvedValue([{ id: "m", orderNumber: "MO-1", quantity: 5, unitOfMeasure: "each", status: "PLANNED" }]);
  const result = await manufacturingRecordRelationships(session(["manufacturing.order.read"]), context);
  expect(state.db.manufacturingOrder.findMany.mock.calls[0][0].where).toEqual({ organisationId: "tenant", sourceSalesOrderLine: { orderId: "order", order: { organisationId: "tenant" } } });
  expect(result.links[0]).toMatchObject({ href: "/manufacturing/produce/m", title: "MO-1", direction: "downstream" });
  expect(await manufacturingRecordContext(session(), { moduleId: "manufacturing", type: "order", id: "m" })).toBeNull();
});
it("Logistics gives direct fulfilment/shipment records and separates their capabilities", async () => {
  state.db.fulfilmentRequirement.findMany.mockResolvedValue([{ id: "f", reference: "FF-1", status: "OPEN" }]);
  expect((await logisticsRecordRelationships(session(["logistics.fulfilment.read"]), context)).links[0].href).toBe("/logistics/fulfil/f");
  expect(state.db.shipment.findMany).not.toHaveBeenCalled();
  expect(await logisticsRecordContext(session(), { moduleId: "logistics", type: "shipment", id: "s" })).toBeNull();
});
it("Customer Master hides scrubbed identities and never queries another tenant", async () => {
  await customerRecordRelationships(session(["customers.read"]), { ...context, anchors: [{ moduleId: "core", type: "customer", id: "c" }] });
  expect(state.db.party.findMany.mock.calls[0][0].where).toEqual({ organisationId: "tenant", identityScrubbed: false, id: { in: ["c"] } });
});
it("bounds relationship display with an explicit more-records marker", async () => {
  state.db.manufacturingOrder.findMany.mockResolvedValue(Array.from({ length: 51 }, (_, id) => ({ id: String(id), orderNumber: `MO-${id}`, quantity: 1, unitOfMeasure: "each", status: "PLANNED" })));
  const result = await manufacturingRecordRelationships(session(["manufacturing.order.read"]), context);
  expect(result.links).toHaveLength(50); expect(result.hasMore).toBe(true);
});
