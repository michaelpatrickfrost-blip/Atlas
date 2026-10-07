import { requestServiceReturn } from "./services/service-return";
import { logisticsBusinessPlanning } from "./services/business-planning";
import { Truck } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { LOGISTICS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { consumeSalesOrder, projectOrder } from "./services/demand";
import { releaseBalancedStock } from "./services/stock-balance";
import { logisticsAnalytics } from "./services/analytics";
import { customerLogistics, logisticsAttention, searchLogistics } from "./services/queries";

export const logisticsManifest: ModuleManifest = {
 serviceOperationProvider:requestServiceReturn,
 businessPlanningProvider: logisticsBusinessPlanning,
  id: "logistics",
  name: "Logistics",
  description: "Fulfilment, warehouse work, dispatch and returns.",
  icon: Truck,
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: ["stock"],
  capabilities: Object.values(C),
  rootPath: "/logistics",
  accessCapability: C.fulfilmentRead,
  status: "available",
  analyticsProvider: logisticsAnalytics,
  salesLogisticsConsumer: consumeSalesOrder,
  stockReplenishedConsumer: releaseBalancedStock,
  fulfilmentProjectionProvider: ({ organisationId, orderId }) => projectOrder(organisationId, orderId),
  attentionProvider: async ({ organisationId, session }) => session.capabilities.has(C.fulfilmentRead) ? logisticsAttention(organisationId) : [],
  searchProvider: async ({ session, query }) => session.capabilities.has(C.fulfilmentRead) ? searchLogistics(session, query) : [],
  customerOverviewProvider: async ({ organisationId, session, partyId }) => {
    if (!session.capabilities.has(C.fulfilmentRead) || !session.capabilities.has("customers.read")) return null;
    const values = await customerLogistics(organisationId, partyId);
    const metrics = [
      { label: "Open deliveries", value: String(values.open), href: "/logistics/fulfil" },
      ...(values.next ? [{ label: "Next delivery", value: values.next.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }), href: "/logistics/fulfil" }] : []),
      ...(values.last ? [{ label: "Last delivery", value: values.last.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }), href: "/logistics/dispatch" }] : []),
      ...(values.otif !== null ? [{ label: "Delivery performance", value: `${values.otif}% OTIF`, href: "/logistics/reports" }] : []),
      ...(values.returns ? [{ label: "Outstanding returns", value: String(values.returns), href: "/logistics/returns" }] : []),
    ];
    return { moduleId: "logistics", metrics, actions: [] };
  },
  navigation: [
    { label: "Today", href: "/logistics", capability: C.fulfilmentRead },
    { label: "Fulfil", href: "/logistics/fulfil", capability: C.fulfilmentRead },
    { label: "Receive", href: "/logistics/receive", capability: C.receiptExecute },
    { label: "Dispatch", href: "/logistics/dispatch", capability: C.shipmentRead },
    { label: "Returns", href: "/logistics/returns", capability: C.returnRead },
    { label: "Reports", href: "/logistics/reports", capability: C.reportRead },
  ],
};
