import { Handshake } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { salesAttentionProvider } from "@/modules/sales/services/attention";
import { salesSearchProvider } from "@/modules/sales/services/search";
import { salesCustomerOverviewProvider } from "@/modules/sales/services/customer-overview";

export const salesManifest: ModuleManifest = {
  id: "sales",
  name: "Sales",
  description: "Prospecting, pipeline, forecasting and reporting.",
  icon: Handshake,
  version: "0.2.0",
  minimumCoreVersion: "0.1.0",
  dependencies: [],
  capabilities: Object.values(SALES_CAPABILITIES),
  rootPath: "/sales/today",
  accessCapability: SALES_CAPABILITIES.opportunityRead,
  status: "installed",
  // Navigation deliberately stays to five items (§5) — Leads/Tasks/Calls/
  // Sequences/Playbooks/Territories/Teams/Products/Settings all exist but are
  // reached contextually (from Today, Prospect, an opportunity, or Sales
  // settings), never as permanent top-level menu items.
  navigation: [
    { label: "Today", href: "/sales/today", capability: SALES_CAPABILITIES.opportunityRead },
    { label: "Prospect", href: "/sales/prospect", capability: SALES_CAPABILITIES.prospectRead },
    { label: "Pipeline", href: "/sales/pipeline", capability: SALES_CAPABILITIES.opportunityRead },
    { label: "Forecast", href: "/sales/forecast", capability: SALES_CAPABILITIES.forecastRead },
    { label: "Reports", href: "/sales/reports", capability: SALES_CAPABILITIES.reportRead },
  ],
  attentionProvider: salesAttentionProvider,
  searchProvider: salesSearchProvider,
  customerOverviewProvider: salesCustomerOverviewProvider,
};
