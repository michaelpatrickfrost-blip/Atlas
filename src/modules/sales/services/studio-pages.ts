import { z } from 'zod';
import type { Prisma } from '@/generated/prisma/client';
import { assertCapability } from '@/core/permissions/check';
import { query, declarative } from '@/core/studio/registry/contracts';
import { pageSource } from '@/core/studio/registry/page-contracts';
import type { Context, RecordContext, StudioModuleContract } from '@/core/studio/registry/types';
import { pageProjectionSchema, pageReadRequestSchema, pageReadAnchorSchema, pageQueryRequestSchema, type PageSourcePolicy, type PageReadAnchor, type PageSourceCallbacks } from '@/core/studio/pages/owner-contract';
import { orderWhere } from './list-filters';

const identity = { version: 1, capability: 'sales.order.read', lifecycle: 'active' as const, classification: 'confidential' as const };
const headerRef = { id: 'sales.order.page.header', version: 1 }, listRef = { id: 'sales.order.page.list', version: 1 }, linesRef = { id: 'sales.order.page.lines', version: 1 };
const totalRef = { id: 'sales.order.page.total', version: 1 }, totalMetricRef = { id: 'sales.order.page.total_metric', version: 1 };
const labels: Record<string, string> = {
  reference: 'Order number', status: 'Status', order_type: 'Order type', commercial_revision: 'Commercial revision',
  updated_at: 'Last updated', customer_id: 'Customer', customer_name: 'Invoice account', customer_po_reference: 'Customer PO',
  external_reference: 'Customer reference', currency: 'Currency', net_amount: 'Net amount', tax_amount: 'Tax amount', gross_amount: 'Order total',
  order_date: 'Order date', requested_delivery_date: 'Requested delivery', promised_delivery_date: 'Promised delivery',
  line_number: 'Item', type: 'Item type', description: 'Description', unit_of_measure: 'Unit', ordered_quantity: 'Ordered quantity',
  cancelled_quantity: 'Cancelled quantity', unit_price_amount: 'Unit price', discount_percent: 'Discount (%)', invoice_when_in_stock: 'Invoice when in stock',
};
const scalar = (id: string, valueType: 'string' | 'number' | 'boolean', nullable = false) => ({ id, label: labels[id], valueType, nullable, classification: 'confidential' as const,
  ...(['net_amount', 'tax_amount', 'gross_amount', 'unit_price_amount'].includes(id) ? { format: { kind: 'money_minor' as const, currencyColumnId: 'currency' } } : {}) });
const headerColumns = [scalar('reference', 'string'), scalar('status', 'string'), scalar('order_type', 'string'), scalar('commercial_revision', 'number'),
  scalar('updated_at', 'string'), scalar('customer_id', 'string'), scalar('customer_name', 'string'), scalar('customer_po_reference', 'string', true),
  scalar('external_reference', 'string', true), scalar('currency', 'string'), scalar('net_amount', 'number'), scalar('tax_amount', 'number'), scalar('gross_amount', 'number'),
  scalar('order_date', 'string'), scalar('requested_delivery_date', 'string', true), scalar('promised_delivery_date', 'string', true)];
const lineColumns = [scalar('line_number', 'number'), scalar('type', 'string'), scalar('description', 'string'), scalar('unit_of_measure', 'string'),
  scalar('ordered_quantity', 'string'), scalar('cancelled_quantity', 'string'), scalar('unit_price_amount', 'number'), scalar('discount_percent', 'number', true),
  scalar('net_amount', 'number'), scalar('tax_amount', 'number'), scalar('invoice_when_in_stock', 'boolean'), scalar('currency', 'string')];
const totalColumns = [scalar('gross_amount', 'number'), scalar('currency', 'string')];
const totalOutput = pageProjectionSchema(totalColumns, 1);
const headerOutput = pageProjectionSchema(headerColumns, 1), listOutput = pageProjectionSchema(headerColumns, 50), linesOutput = pageProjectionSchema(lineColumns, 50);
const id = z.string().min(1).max(200), timestamp = z.iso.datetime();
const listCursor = z.strictObject({ id, updatedAt: timestamp });
const lineCursor = z.strictObject({ id, lineNumber: z.number().int().nonnegative() });
const pageSize = z.number().int().min(1).max(50);
const recordInput = { orderId: id, expectedRevision: z.number().int().positive(), expectedUpdatedAt: timestamp };
const headerInput = z.strictObject(recordInput);
const listInput = z.strictObject({ pageSize, cursor: listCursor.nullable() });
const linesInput = z.strictObject({ ...recordInput, pageSize, cursor: lineCursor.nullable() });
const headerSelect = {
  id: true, reference: true, commercialStatus: true, orderType: true, revision: true, updatedAt: true,
  partyId: true, party: { select: { name: true } }, customerPoReference: true, externalReference: true,
  currency: true, netAmount: true, taxAmount: true, grossAmount: true, orderDate: true,
  requestedDeliveryDate: true, promisedDeliveryDate: true,
} satisfies Prisma.SalesOrderSelect;
type Header = Prisma.SalesOrderGetPayload<{ select: typeof headerSelect }>;
const scopeSelect = { id: true, revision: true, updatedAt: true, currency: true } satisfies Prisma.SalesOrderSelect;
type Scope = Prisma.SalesOrderGetPayload<{ select: typeof scopeSelect }>;
const revisionOf = (record: Scope) => `${record.revision}@${record.updatedAt.toISOString()}`;
const baseWhere = (organisationId: string): Prisma.SalesOrderWhereInput => ({ AND: [orderWhere(organisationId, {}), { party: { organisationId } }] });
function projectHeader(record: Header) {
  return { id: record.id, values: { reference: record.reference, status: record.commercialStatus, order_type: record.orderType,
    commercial_revision: record.revision, updated_at: record.updatedAt.toISOString(), customer_id: record.partyId, customer_name: record.party.name,
    customer_po_reference: record.customerPoReference, external_reference: record.externalReference, currency: record.currency,
    net_amount: record.netAmount, tax_amount: record.taxAmount, gross_amount: record.grossAmount, order_date: record.orderDate.toISOString(),
    requested_delivery_date: record.requestedDeliveryDate?.toISOString() ?? null, promised_delivery_date: record.promisedDeliveryDate?.toISOString() ?? null } };
}

/** Owning ordinary Read only. Refreshes genuine current principal under existing
 * shared Serializable authority locks; this helper performs no domain mutation,
 * grants no Studio/Write privilege and never falls back to the global DB client.
 * Sales has tenant-level Read, not a separate per-user private-order policy.
 */
async function owner(ctx: RecordContext | Context) {
  if (!ctx.transaction) throw new Error('Sales page reads require the owning transaction.');
  const { nativeFieldMutationSessionInTransaction } = await import("@/core/studio/fields/runtime-authority");
  const { session } = await nativeFieldMutationSessionInTransaction(ctx.session, ctx.transaction);
  assertCapability(session, identity.capability);
  const state = await ctx.transaction.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: 'sales', enabled: true, entitled: true }, select: { id: true } });
  if (!state) throw new Error('DEPENDENCY_BROKEN: Sales is unavailable for this page.');
  return { session, client: ctx.transaction };
}
async function recordScope(client: Prisma.TransactionClient, organisationId: string, orderId: string, expected?: { expectedRevision: number; expectedUpdatedAt: string }): Promise<Scope> {
  const record = await client.salesOrder.findFirst({ where: { AND: [baseWhere(organisationId), { id: orderId,
    ...(expected ? { revision: expected.expectedRevision, updatedAt: new Date(expected.expectedUpdatedAt) } : {}) }] }, select: scopeSelect });
  if (!record) throw new Error('NOT_FOUND: Sales order is unavailable or has changed.');
  return record;
}
async function checkedAnchor(ctx: RecordContext, supplied: PageReadAnchor) {
  const current = await owner(ctx), anchor = pageReadAnchorSchema.parse(supplied);
  if (anchor.organisationId !== current.session.organisationId) throw new Error('FORBIDDEN: Sales page scope changed.');
  if (anchor.kind === 'list') return { ...current, anchor, record: null };
  const record = await recordScope(current.client, current.session.organisationId, anchor.recordId);
  if (anchor.revision !== revisionOf(record) || anchor.nativeRevision !== record.revision) throw new Error('CONFLICT: Sales order changed. Refresh this page.');
  return { ...current, anchor, record };
}
function queryKind(request: { query: { id: string; version: number } }) {
  if (request.query.version !== 1) throw new Error('DEPENDENCY_BROKEN: Sales page query is unavailable.');
  if (request.query.id === headerRef.id) return 'header';
  if (request.query.id === listRef.id) return 'list';
  if (request.query.id === linesRef.id) return 'lines';
  if (request.query.id === totalRef.id) return 'total';
  throw new Error('DEPENDENCY_BROKEN: Sales page query is unavailable.');
}
export const salesOrderPagePolicy: PageSourcePolicy = {
  schemaVersion: 1, entity: { id: 'sales.order', version: 1 }, accessMode: 'ordinary_read', variants: false, fieldSourceVersions: [],
  nativeFields: headerColumns.map(column => ({ id: column.id, query: headerRef, columnId: column.id })),
  queries: [{ query: headerRef, scope: 'record', purpose: 'fact', columns: headerColumns },
    { query: listRef, scope: 'list', purpose: 'list', columns: headerColumns },
    { query: linesRef, scope: 'record', purpose: 'list', columns: lineColumns }],
  facts: [], commands: [{ command: { id: 'sales.order.preview_acknowledgement', version: 1 }, confirmation: 'optional', previewQuery: null, formFactors: ['desktop', 'tablet', 'phone'] }],
  metrics: [], surfaces: [], maxQueryCost: 12,
};
/** Version2 only appends an owner measure/projection. Version1 remains exact:
 * old sealed layouts do not acquire a metric, new grant or larger query budget. */
export const salesOrderMetricPagePolicy: PageSourcePolicy = {
  ...salesOrderPagePolicy,
  queries: [...salesOrderPagePolicy.queries, { query: totalRef, scope: 'record', purpose: 'metric', columns: totalColumns }],
  metrics: [{ metric: totalMetricRef, query: totalRef, formFactors: ['desktop', 'tablet', 'phone'] }],
  maxQueryCost: 13,
};
const callbacks: PageSourceCallbacks = {
    async authoriseRead(ctx, supplied) {
      const request = pageReadRequestSchema.parse(supplied), { session, client } = await owner(ctx);
      if (request.kind === 'list') return { kind: 'list', organisationId: session.organisationId };
      const record = await recordScope(client, session.organisationId, request.recordId);
      return { kind: 'record', organisationId: session.organisationId, recordId: record.id, revision: revisionOf(record), nativeRevision: record.revision };
    },
    async bindQueryInput(ctx, supplied, input) {
      const request = pageQueryRequestSchema.parse(input), kind = queryKind(request), { anchor, record } = await checkedAnchor(ctx, supplied);
      if (kind === 'list') { if (anchor.kind !== 'list') throw new Error('FORBIDDEN: this list needs its owning list scope.'); return listInput.parse({ pageSize: request.pageSize, cursor: request.cursor }); }
      if (anchor.kind !== 'record' || !record) throw new Error('FORBIDDEN: this component needs its owning Sales order.');
      const scoped = { orderId: record.id, expectedRevision: record.revision, expectedUpdatedAt: record.updatedAt.toISOString() };
      if (kind === 'header' || kind === 'total') { if (request.cursor !== null) throw new Error('Sales order details do not accept a cursor.'); return headerInput.parse(scoped); }
      return linesInput.parse({ ...scoped, pageSize: request.pageSize, cursor: request.cursor });
    },
    async projectQueryOutput(ctx, supplied, input, output) {
      const request = pageQueryRequestSchema.parse(input), kind = queryKind(request), { anchor } = await checkedAnchor(ctx, supplied);
      if ((kind === 'list') !== (anchor.kind === 'list')) throw new Error('FORBIDDEN: Sales page query scope changed.');
      const parsed = (kind === 'header' ? headerOutput : kind === 'total' ? totalOutput : kind === 'list' ? listOutput : linesOutput).parse(output);
      if ((kind === 'header' || kind === 'total') && anchor.kind === 'record' && (parsed.rows.length !== 1 || parsed.rows[0].id !== anchor.recordId || parsed.nextCursor !== null)) throw new Error('FIELD_STORAGE_INVALID: Sales page record projection changed.');
      if (parsed.rows.length > request.pageSize) throw new Error('FIELD_STORAGE_INVALID: Sales page cardinality changed.');
      if (parsed.nextCursor !== null) (kind === 'list' ? listCursor : lineCursor).parse(parsed.nextCursor);
      return parsed;
    },
  };
const retainedSalesOrderPageContract: StudioModuleContract = { contributions: [
  query({ ...identity, ...headerRef, kind: 'query', label: 'Sales order details', pagination: 'none', costClass: 'low', maxCardinality: 1, transaction: 'required', input: headerInput, output: headerOutput,
    async execute(ctx, input) {
      const { session, client } = await owner(ctx);
      const record = await client.salesOrder.findFirst({ where: { AND: [baseWhere(session.organisationId), { id: input.orderId, revision: input.expectedRevision, updatedAt: new Date(input.expectedUpdatedAt) }] }, select: headerSelect });
      if (!record) throw new Error('NOT_FOUND: Sales order is unavailable or has changed.');
      return { rows: [projectHeader(record)], nextCursor: null };
    } }),
  query({ ...identity, ...listRef, kind: 'query', label: 'Sales order list', pagination: 'cursor', costClass: 'medium', maxCardinality: 50, transaction: 'required', input: listInput, output: listOutput,
    async execute(ctx, input) {
      const { session, client } = await owner(ctx), base = baseWhere(session.organisationId);
      let continuation: Prisma.SalesOrderWhereInput = {};
      if (input.cursor) {
        const anchor = await client.salesOrder.findFirst({ where: { AND: [base, { id: input.cursor.id, updatedAt: new Date(input.cursor.updatedAt) }] }, select: { id: true, updatedAt: true } });
        if (!anchor) throw new Error('CONFLICT: Sales order cursor changed. Refresh this list.');
        continuation = { OR: [{ updatedAt: { lt: anchor.updatedAt } }, { updatedAt: anchor.updatedAt, id: { lt: anchor.id } }] };
      }
      const records = await client.salesOrder.findMany({ where: { AND: [base, continuation] }, select: headerSelect, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], take: input.pageSize + 1 });
      const rows = records.slice(0, input.pageSize), last = rows.at(-1);
      return { rows: rows.map(projectHeader), nextCursor: records.length > input.pageSize && last ? { id: last.id, updatedAt: last.updatedAt.toISOString() } : null };
    } }),
  query({ ...identity, ...linesRef, kind: 'query', label: 'Sales order items', pagination: 'cursor', costClass: 'medium', maxCardinality: 50, transaction: 'required', input: linesInput, output: linesOutput,
    async execute(ctx, input) {
      const { session, client } = await owner(ctx), parent = await recordScope(client, session.organisationId, input.orderId, input);
      let continuation: Prisma.SalesOrderLineWhereInput = {};
      if (input.cursor) {
        const anchor = await client.salesOrderLine.findFirst({ where: { id: input.cursor.id, orderId: parent.id, lineNumber: input.cursor.lineNumber,
          order: { organisationId: session.organisationId, party: { organisationId: session.organisationId } } }, select: { id: true, lineNumber: true } });
        if (!anchor) throw new Error('CONFLICT: Sales order item cursor changed. Refresh these items.');
        continuation = { OR: [{ lineNumber: { gt: anchor.lineNumber } }, { lineNumber: anchor.lineNumber, id: { gt: anchor.id } }] };
      }
      const rows = await client.salesOrderLine.findMany({ where: { AND: [{ orderId: parent.id, order: { organisationId: session.organisationId, party: { organisationId: session.organisationId } } }, continuation] },
        select: { id: true, lineNumber: true, type: true, descriptionSnapshot: true, unitOfMeasure: true, orderedQuantity: true, cancelledQuantity: true,
          unitPriceAmount: true, discountPercent: true, netAmount: true, taxAmount: true, invoiceWhenInStock: true },
        orderBy: [{ lineNumber: 'asc' }, { id: 'asc' }], take: input.pageSize + 1 });
      const selected = rows.slice(0, input.pageSize), last = selected.at(-1);
      return { rows: selected.map(row => ({ id: row.id, values: { line_number: row.lineNumber, type: row.type, description: row.descriptionSnapshot,
        unit_of_measure: row.unitOfMeasure, ordered_quantity: row.orderedQuantity.toString(), cancelled_quantity: row.cancelledQuantity.toString(),
        unit_price_amount: row.unitPriceAmount, discount_percent: row.discountPercent, net_amount: row.netAmount, tax_amount: row.taxAmount,
        invoice_when_in_stock: row.invoiceWhenInStock, currency: parent.currency } })), nextCursor: rows.length > input.pageSize && last ? { id: last.id, lineNumber: last.lineNumber } : null };
    } }),
  query({ ...identity, ...totalRef, kind: 'query', label: 'Sales order total', pagination: 'none', costClass: 'low', maxCardinality: 1,
    transaction: 'required', input: headerInput, output: totalOutput,
    async execute(ctx, input) {
      const { session, client } = await owner(ctx);
      const record = await client.salesOrder.findFirst({ where: { AND: [baseWhere(session.organisationId), { id: input.orderId,
        revision: input.expectedRevision, updatedAt: new Date(input.expectedUpdatedAt) }] }, select: { id: true, grossAmount: true, currency: true } });
      if (!record) throw new Error('NOT_FOUND: Sales order is unavailable or has changed.');
      return { rows: [{ id: record.id, values: { gross_amount: record.grossAmount, currency: record.currency } }], nextCursor: null };
    } }),
  declarative({ ...identity, ...totalMetricRef, kind: 'metric', label: 'Order total', schema: totalOutput, references: [totalRef.id] }),
  pageSource({ ...identity, id: 'sales.order.page', label: 'Sales order screen', policy: salesOrderPagePolicy, callbacks }),
  pageSource({ ...identity, version: 2, id: 'sales.order.page', label: 'Sales order screen', policy: salesOrderMetricPagePolicy, callbacks }),
] };

/** Same native owner and retained projections; finite immutable Analytics View
 * opt-in belongs only to this new revision, never a silent historical upgrade. */
export const salesOrderEmbeddedPagePolicy: PageSourcePolicy = { ...salesOrderMetricPagePolicy,
  embeddedViewSources: [{ id: 'analytics.dashboard.view', version: 1 }], maxQueryCost: 64 };
export const salesOrderPageContract: StudioModuleContract = { contributions: [
  ...retainedSalesOrderPageContract.contributions,
  pageSource({ ...identity, version: 3, id: 'sales.order.page', label: 'Sales order screen', policy: salesOrderEmbeddedPagePolicy, callbacks }),
] };
