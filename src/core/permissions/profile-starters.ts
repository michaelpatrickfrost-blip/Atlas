/** Optional starting points; stored profiles remain ordinary, editable company roles. */
export const PROFILE_STARTERS = [
  {
    id: "customer-service-manager",
    name: "Customer service manager",
    description:
      "Customer cases, invoice viewing and own procurement requests. Banking stays off.",
    capabilities: [
      "customers.read",
      "service.case.read",
      "service.case.create",
      "service.case.update",
      "service.case.assign",
      "service.case.note",
      "service.case.communication",
      "service.case.resolve",
      "service.case.close",
      "service.case.approve",
      "service.queue.manage",
      "finance.overview.read",
      "finance.receivables.read",
      "finance.request.create",
    ],
  },
  {
    id: "logistics-coordinator",
    name: "Logistics coordinator",
    description:
      "View fulfilment, picking, shipments and returns. Add operational permissions as needed.",
    capabilities: [
      "logistics.fulfilment.read",
      "logistics.pick.read",
      "logistics.shipment.read",
      "logistics.return.read",
      "logistics.report.read",
    ],
  },
  {
    id: "invoice-viewer",
    name: "Invoice viewer",
    description:
      "View customer invoices and balances in Finance. Banking, purchasing and changes stay off.",
    capabilities: ["finance.overview.read", "finance.receivables.read"],
  },
] as const;
