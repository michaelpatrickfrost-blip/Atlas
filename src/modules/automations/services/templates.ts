export const AUTOMATION_TEMPLATES = [
  {
    id: 'order-to-invoice',
    name: 'Order Shipped → Invoice',
    description: 'Auto-invoice when order ships',
    trigger: 'logistics.shipment.delivered',
    actions: [
      { type: 'create_invoice', config: { linkedOrderId: '{{shipment.linkedOrderId}}' } }
    ],
  },
  {
    id: 'quote-to-order',
    name: 'Quote Accepted → Create Order',
    description: 'Auto-create order from accepted quote',
    trigger: 'sales.quote.accepted',
    actions: [
      { type: 'create_order', config: { fromQuoteId: '{{quote.id}}' } }
    ],
  },
  {
    id: 'mql-notify',
    name: 'MQL → Notify Sales',
    description: 'Alert sales when lead qualifies',
    trigger: 'crm.lead.created',
    actions: [
      { type: 'notify_user', config: { message: 'New MQL: {{lead.name}}' } }
    ],
  },
];
