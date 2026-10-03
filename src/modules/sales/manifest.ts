import { Handshake } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { salesAttentionProvider } from "@/modules/sales/services/attention";
import { salesSearchProvider } from "@/modules/sales/services/search";

export const salesManifest: ModuleManifest = {
  id: "sales",
  name: "Sales",
  description: "Pipeline, customers, quotes and orders.",
  icon: Handshake,
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: [],
  capabilities: Object.values(SALES_CAPABILITIES),
  rootPath: "/sales",
  accessCapability: SALES_CAPABILITIES.customerRead,
  status: "installed",
  navigation: [
    { label: "Pipeline", href: "/sales/pipeline", capability: SALES_CAPABILITIES.opportunityRead },
    { label: "Customers", href: "/sales/customers", capability: SALES_CAPABILITIES.customerRead },
    { label: "Quotes", href: "/sales/quotes", capability: SALES_CAPABILITIES.quoteRead },
    { label: "Orders", href: "/sales/orders", capability: SALES_CAPABILITIES.orderRead },
  ],
  attentionProvider: salesAttentionProvider,
  searchProvider: salesSearchProvider,
};
