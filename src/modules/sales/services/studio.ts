import { z } from "zod";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { command, entity, query } from "@/core/studio/registry/contracts";
import type { Context, FieldDescriptor, StudioModuleContract } from "@/core/studio/registry/types";
import type { Prisma } from "@/generated/prisma/client";
import { orderWhere } from "./list-filters";
import { ORDER_TYPES } from "./view-definition";

const recordId = z.string().min(1).max(200);
const status = z.enum(["DRAFT", "PENDING_APPROVAL", "CONFIRMED", "ON_HOLD", "CANCELLED", "CLOSED"]);
const orderType = z.enum(ORDER_TYPES);
const timestamp = z.iso.datetime();
const money = z.number().int();
const identity = { version: 1, capability: "sales.order.read", lifecycle: "active" as const, classification: "confidential" as const };

/** Native Sales projections, not a Studio copy of an order or a write authority.
 * Commercial revision and timestamp are distinct: not every native change
 * advances the commercial revision. Neither grants extension editing here. */
export const salesOrderProjectionSchema = z.strictObject({
  id: recordId, reference: z.string(), status, order_type: orderType, commercial_revision: z.number().int().positive(),
  updated_at: timestamp, customer_id: recordId, customer_name: z.string(),
  customer_po_reference: z.string().nullable(), external_reference: z.string().nullable(), tags: z.array(z.string()),
  currency: z.string(), net_amount: money, tax_amount: money, gross_amount: money,
  order_date: timestamp, requested_delivery_date: timestamp.nullable(), promised_delivery_date: timestamp.nullable(),
});
export const salesOrderListInputSchema = z.strictObject({
  pageSize: z.number().int().min(1).max(50).default(50),
  cursor: z.strictObject({ id: recordId, updatedAt: timestamp }).optional(),
  filters: z.strictObject({ q: z.string().max(150).optional(), status: status.optional(),
    orderType: orderType.optional(), customerId: recordId.optional(), ownerUserId: recordId.optional(),
    currency: z.string().regex(/^[A-Z]{3}$/).optional() }).default({}),
});
export const salesOrderListOutputSchema = z.strictObject({
  rows: z.array(salesOrderProjectionSchema).max(50),
  nextCursor: z.strictObject({ id: recordId, updatedAt: timestamp }).nullable(),
});
export const salesOrderLineSchema = z.strictObject({
  id: recordId, line_number: z.number().int(), type: z.string(), description: z.string(),
  product_id: recordId.nullable(), unit_of_measure: z.string(), ordered_quantity: z.number(), cancelled_quantity: z.number(),
  unit_price_amount: money, discount_percent: z.number().nullable(), net_amount: money, tax_amount: money,
  invoice_when_in_stock: z.boolean(),
});
export const salesOrderLinesInputSchema = z.strictObject({
  orderId: recordId, pageSize: z.number().int().min(1).max(50).default(50),
  cursor: z.strictObject({ id: recordId, lineNumber: z.number().int() }).optional(),
});
export const salesOrderLinesOutputSchema = z.strictObject({
  rows: z.array(salesOrderLineSchema).max(50),
  nextCursor: z.strictObject({ id: recordId, lineNumber: z.number().int() }).nullable(),
});
export const salesOrderAcknowledgementInputSchema = z.strictObject({ orderId: recordId });
export const salesOrderAcknowledgementResultSchema = z.strictObject({
  kind: z.literal("navigation"),
  href: z.string().regex(/^\/api\/orders\/(?:[a-zA-Z0-9_.~-]|%[A-Fa-f0-9]{2})+\/pdf\?preview=1$/),
});

const headerSelect = {
  id: true, reference: true, commercialStatus: true, orderType: true, revision: true, updatedAt: true,
  partyId: true, party: { select: { name: true } }, customerPoReference: true, externalReference: true,
  tags: true, currency: true, netAmount: true, taxAmount: true, grossAmount: true, orderDate: true,
  requestedDeliveryDate: true, promisedDeliveryDate: true,
} satisfies Prisma.SalesOrderSelect;
type Header = Prisma.SalesOrderGetPayload<{ select: typeof headerSelect }>;
function projectHeader(row: Header): z.infer<typeof salesOrderProjectionSchema> {
  return { id: row.id, reference: row.reference, status: row.commercialStatus, order_type: row.orderType,
    commercial_revision: row.revision, updated_at: row.updatedAt.toISOString(), customer_id: row.partyId,
    customer_name: row.party.name, customer_po_reference: row.customerPoReference, external_reference: row.externalReference,
    tags: row.tags, currency: row.currency, net_amount: row.netAmount, tax_amount: row.taxAmount, gross_amount: row.grossAmount,
    order_date: row.orderDate.toISOString(), requested_delivery_date: row.requestedDeliveryDate?.toISOString() ?? null,
    promised_delivery_date: row.promisedDeliveryDate?.toISOString() ?? null };
}
async function ownerClient(ctx: Context) {
  assertCapability(ctx.session, "sales.order.read");
  await assertModuleEnabled(ctx.session, "sales");
  return ctx.transaction ?? db;
}
const fieldDefinitions = [
  ["reference", "string", false], ["status", "enum", false], ["order_type", "enum", false],
  ["commercial_revision", "integer", false], ["updated_at", "datetime", false], ["customer_id", "reference", false],
  ["customer_name", "string", false], ["customer_po_reference", "string", true], ["external_reference", "string", true],
  ["currency", "string", false], ["net_amount", "money", false], ["tax_amount", "money", false], ["gross_amount", "money", false],
  ["order_date", "datetime", false], ["requested_delivery_date", "datetime", true], ["promised_delivery_date", "datetime", true],
] as const satisfies readonly (readonly [string, FieldDescriptor["type"], boolean])[];
const labels: Record<typeof fieldDefinitions[number][0], string> = {
  reference: "Order number", status: "Status", order_type: "Order type", commercial_revision: "Commercial revision",
  updated_at: "Last updated", customer_id: "Customer", customer_name: "Invoice account", customer_po_reference: "Customer PO",
  external_reference: "Customer reference", currency: "Currency", net_amount: "Net amount", tax_amount: "Tax amount",
  gross_amount: "Order total", order_date: "Order date", requested_delivery_date: "Requested delivery", promised_delivery_date: "Promised delivery",
};
const fields: FieldDescriptor[] = fieldDefinitions.map(([id, type, nullable]) => ({ id, type, nullable,
  label: labels[id],
  classification: "confidential", filterable: ["reference", "status", "order_type", "customer_id", "currency"].includes(id),
  sortable: id === "updated_at", decision: false, template: false }));

/** Read-only owner approvals for ordinary Sales list/detail layouts. The native
 * composer, mutations, Finance surfaces and extension fields need separate
 * explicit approval; their authority cannot be inferred from these reads. */
export const salesStudioContract: StudioModuleContract = { contributions: [
  entity({ ...identity, kind: "entity", id: "sales.order", label: "Sales order", key: "string", fields,
    extensionPolicy: { customFields: false, recordTypes: false, pageVariants: false } }),
  // Invoked only by an explicit permitted user action. Studio's design preview
  // uses approved read projections/synthetic data and must never invoke commands.
  // The existing PDF endpoint independently repeats native access checks and
  // remains the sole acknowledgement renderer; this command creates no document.
  command({ ...identity, kind: "command", id: "sales.order.preview_acknowledgement", label: "Preview acknowledgement",
    execution: "transactional", idempotency: "not_applicable", sideEffect: "none",
    input: salesOrderAcknowledgementInputSchema, output: salesOrderAcknowledgementResultSchema,
    async invoke(ctx, input) {
      const client = await ownerClient(ctx);
      const order = await client.salesOrder.findFirst({ where: { id: input.orderId, organisationId: ctx.session.organisationId }, select: { id: true } });
      if (!order) throw new Error("NOT_FOUND: Sales order is unavailable.");
      return { kind: "navigation" as const, href: `/api/orders/${encodeURIComponent(order.id)}/pdf?preview=1` };
    } }),
  query({ ...identity, kind: "query", id: "sales.order.list", label: "Sales orders", pagination: "cursor",
    costClass: "medium", maxCardinality: 50, input: salesOrderListInputSchema, output: salesOrderListOutputSchema,
    async execute(ctx, input) {
      const client = await ownerClient(ctx), organisationId = ctx.session.organisationId;
      const base = orderWhere(organisationId, { q: input.filters.q, status: input.filters.status,
        orderType: input.filters.orderType, customer: input.filters.customerId, owner: input.filters.ownerUserId, currency: input.filters.currency });
      let continuation: Prisma.SalesOrderWhereInput = {};
      if (input.cursor) {
        // A cursor must still identify a native record in this tenant and filter.
        // A foreign or moved cursor never skips rows in a customer's result set.
        const anchor = await client.salesOrder.findFirst({ where: { AND: [base, { id: input.cursor.id, updatedAt: new Date(input.cursor.updatedAt) }] }, select: { id: true, updatedAt: true } });
        if (!anchor) throw new Error("CONFLICT: Sales order cursor changed. Reload this list.");
        continuation = { OR: [{ updatedAt: { lt: anchor.updatedAt } }, { updatedAt: anchor.updatedAt, id: { lt: anchor.id } }] };
      }
      const rows = await client.salesOrder.findMany({ where: { AND: [base, continuation] }, select: headerSelect,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: input.pageSize + 1 });
      const page = rows.slice(0, input.pageSize), last = page.at(-1);
      return { rows: page.map(projectHeader), nextCursor: rows.length > input.pageSize && last ? { id: last.id, updatedAt: last.updatedAt.toISOString() } : null };
    } }),
  query({ ...identity, kind: "query", id: "sales.order.get", label: "Sales order", pagination: "none",
    costClass: "low", maxCardinality: 1, input: z.strictObject({ id: recordId }), output: salesOrderProjectionSchema.nullable(),
    async execute(ctx, input) {
      const client = await ownerClient(ctx);
      const row = await client.salesOrder.findFirst({ where: { id: input.id, organisationId: ctx.session.organisationId }, select: headerSelect });
      return row ? projectHeader(row) : null;
    } }),
  query({ ...identity, kind: "query", id: "sales.order.lines", label: "Sales order lines", pagination: "cursor",
    costClass: "medium", maxCardinality: 50, input: salesOrderLinesInputSchema, output: salesOrderLinesOutputSchema,
    async execute(ctx, input) {
      const client = await ownerClient(ctx), organisationId = ctx.session.organisationId;
      const parent = await client.salesOrder.findFirst({ where: { id: input.orderId, organisationId }, select: { id: true } });
      if (!parent) throw new Error("NOT_FOUND: Sales order is unavailable.");
      let continuation: Prisma.SalesOrderLineWhereInput = {};
      if (input.cursor) {
        const anchor = await client.salesOrderLine.findFirst({ where: { id: input.cursor.id, orderId: parent.id,
          lineNumber: input.cursor.lineNumber, order: { organisationId } }, select: { id: true, lineNumber: true } });
        if (!anchor) throw new Error("CONFLICT: Sales order line cursor changed. Reload these lines.");
        continuation = { OR: [{ lineNumber: { gt: anchor.lineNumber } }, { lineNumber: anchor.lineNumber, id: { gt: anchor.id } }] };
      }
      const rows = await client.salesOrderLine.findMany({ where: { AND: [{ orderId: parent.id, order: { organisationId } }, continuation] },
        select: { id: true, lineNumber: true, type: true, descriptionSnapshot: true, productId: true, unitOfMeasure: true,
          orderedQuantity: true, cancelledQuantity: true, unitPriceAmount: true, discountPercent: true, netAmount: true, taxAmount: true, invoiceWhenInStock: true },
        orderBy: [{ lineNumber: "asc" }, { id: "asc" }], take: input.pageSize + 1 });
      const page = rows.slice(0, input.pageSize), last = page.at(-1);
      return { rows: page.map(row => ({ id: row.id, line_number: row.lineNumber, type: row.type, description: row.descriptionSnapshot,
        product_id: row.productId, unit_of_measure: row.unitOfMeasure, ordered_quantity: Number(row.orderedQuantity), cancelled_quantity: Number(row.cancelledQuantity),
        unit_price_amount: row.unitPriceAmount, discount_percent: row.discountPercent, net_amount: row.netAmount, tax_amount: row.taxAmount, invoice_when_in_stock: row.invoiceWhenInStock })),
        nextCursor: rows.length > input.pageSize && last ? { id: last.id, lineNumber: last.lineNumber } : null };
    } }),
] };
