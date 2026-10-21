import { pageApprovalsSchema, type PageApprovals, type PageRegistryApproval } from '@/core/studio/pages/approvals';
import { compilePage } from '@/core/studio/pages/compiler';
import { pagePayloadSchema, type PageComponent, type PagePayload, type PageSection } from '@/core/studio/pages/schema';

export type SalesOrderPagePreset = { id: string; name: string; description: string; scope: 'record' | 'list'; page: PagePayload };
const forms: PagePayload['formFactors'] = ['desktop', 'tablet', 'phone'];
const reference = ({ id, version, schemaHash, contractHash }: PageRegistryApproval) => ({ id, version, schemaHash, contractHash });

/** Pure layout suggestions from server owner approvals. This is neither a grant
 * nor a publication API: the actual owner factory/current compiler must provide
 * and recheck approvals. No queries, commands, records or preview data execute.
 */
export function createSalesOrderPagePresets(input: PageApprovals): SalesOrderPagePreset[] {
  const approvals = pageApprovalsSchema.parse(input);
  if (approvals.entity.id !== 'sales.order' || approvals.entity.version !== 1 || approvals.entity.ownerModuleId !== 'sales'
    || approvals.sourcePage.id !== 'sales.order.page' || approvals.sourcePage.version !== 1 || approvals.sourcePage.ownerModuleId !== 'sales'
    || approvals.entity.capability !== 'sales.order.read' || approvals.sourcePage.capability !== 'sales.order.read' || approvals.variants)
    throw new Error('Sales presets require the current approved read-only Sales order screen.');
  const entity = reference(approvals.entity);
  const query = (id: string, purpose: 'list' | 'fact') => {
    const approved = approvals.queries.find(value => value.id === id && value.version === 1 && value.sourceEntityId === entity.id && value.purpose === purpose);
    if (!approved || approved.ownerModuleId !== 'sales' || approved.capability !== 'sales.order.read') throw new Error('This Sales layout is unavailable until its owning read source is approved.');
    return reference(approved);
  };
  query('sales.order.page.header', 'fact');
  const lines = query('sales.order.page.lines', 'list'), list = query('sales.order.page.list', 'list');
  const fields = (id: string, label: string, ids: string[]): PageComponent => ({ id, type: 'fields', label, formFactors: [...forms],
    fields: ids.map(fieldId => ({ source: 'native', fieldId, mode: 'read' })) });
  const section = (id: string, label: string, components: PageComponent[], columns = 1): PageSection => ({ id, label, help: '',
    formFactors: [...forms], columns: { desktop: columns, tablet: Math.min(columns, 2), phone: 1 }, components });
  const items = (id: string, columns: string[]): PageComponent => ({ id, type: 'queryList', label: 'Order items', formFactors: [...forms], query: lines, pageSize: 20, columns });
  const acknowledgement = approvals.commands.find(value => value.id === 'sales.order.preview_acknowledgement' && value.version === 1
    && value.ownerModuleId === 'sales' && value.sourceEntityId === entity.id && value.capability === 'sales.order.read'
    && forms.every(form => value.formFactors.includes(form)));
  const action: PageComponent[] = acknowledgement ? [{ id: 'preview_acknowledgement', type: 'action', label: 'Preview acknowledgement',
    formFactors: [...forms], command: reference(acknowledgement), collectInput: 'owner_schema', confirm: acknowledgement.confirmation === 'required', preview: false, icon: 'document' }] : [];
  const preset = (id: string, name: string, description: string, scope: 'record' | 'list', sections: PageSection[]): SalesOrderPagePreset => {
    const page = pagePayloadSchema.parse({ schemaVersion: 1, entity, formFactors: [...forms], sections, variants: [] });
    // Validate selected fields, exact approved references, columns, costs and owner
    // restrictions; the genuine owner factory validates currency metadata and grants.
    compilePage(page, approvals);
    return { id, name, description, scope, page };
  };
  return [
    preset('sales_order_overview', 'Sales order', 'A clear customer summary, order items and totals.', 'record', [
      section('order_details', 'Order details', [fields('order_identity', 'Order & customer', ['reference', 'status', 'order_type', 'customer_name', 'customer_po_reference', 'external_reference']),
        fields('order_dates', 'Dates', ['order_date', 'requested_delivery_date', 'promised_delivery_date'])], 2),
      section('order_items', 'Order items', [items('order_item_list', ['description', 'ordered_quantity', 'unit_of_measure', 'unit_price_amount', 'net_amount', 'tax_amount'])]),
      section('order_totals', 'Totals', [fields('totals', 'Order totals', ['currency', 'net_amount', 'tax_amount', 'gross_amount']), ...action], 2),
    ]),
    preset('sales_order_delivery', 'Delivery focus', 'Keep the customer, promised dates and outstanding items in view.', 'record', [
      section('delivery_details', 'Customer & delivery', [fields('delivery_identity', 'Order & customer', ['reference', 'customer_name', 'status', 'customer_po_reference']),
        fields('delivery_dates', 'Delivery dates', ['requested_delivery_date', 'promised_delivery_date'])], 2),
      section('delivery_items', 'Items to deliver', [items('delivery_item_list', ['description', 'ordered_quantity', 'cancelled_quantity', 'unit_of_measure'])]),
      section('delivery_summary', 'Order summary', [fields('delivery_total', 'Order total', ['currency', 'gross_amount']), ...action], 2),
    ]),
    preset('sales_orders_list', 'Sales orders', 'Scan customers, status, order dates and totals in one list.', 'list', [
      section('sales_orders', 'Sales orders', [{ id: 'sales_order_list', type: 'queryList', label: 'Sales orders', formFactors: [...forms], query: list,
        pageSize: 25, columns: ['reference', 'customer_name', 'status', 'order_date', 'gross_amount'] }]),
    ]),
  ];
}
