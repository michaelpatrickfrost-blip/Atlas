import { Handshake } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { salesAttentionProvider } from "@/modules/sales/services/attention";
import { salesSearchProvider } from "@/modules/sales/services/search";
import { salesCustomerOverviewProvider } from "@/modules/sales/services/customer-overview";

export const salesManifest: ModuleManifest = {
  id: "sales",
  name: "Sales",
  description: "Pipeline, quotes and orders.",
  icon: Handshake,
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: [],
  capabilities: Object.values(SALES_CAPABILITIES),
  rootPath: "/sales",
  accessCapability: SALES_CAPABILITIES.opportunityRead,
  status: "installed",
  // Customers live in Customer Master (/customers) — Sales contributes to a
  // customer's Overview via customerOverviewProvider rather than owning its
  // own customer list/record pages. See docs/CUSTOMER_MASTER.md.
  navigation: [
    { label: "Pipeline", href: "/sales/pipeline", capability: SALES_CAPABILITIES.opportunityRead },
    { label: "Quotes", href: "/sales/quotes", capability: SALES_CAPABILITIES.quoteRead },
    { label: "Orders", href: "/sales/orders", capability: SALES_CAPABILITIES.orderRead },
  ],
  attentionProvider: salesAttentionProvider,
  searchProvider: salesSearchProvider,
  customerOverviewProvider: salesCustomerOverviewProvider,
};
