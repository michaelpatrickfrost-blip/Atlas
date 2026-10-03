import { crmCustomerOverviewProvider } from "./customer-overview";
import { Handshake } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { salesAttentionProvider } from "@/modules/crm/services/attention";
import { salesSearchProvider } from "@/modules/crm/services/search";

export const crmManifest: ModuleManifest = {
  id: "crm",
  name: "CRM",
  description: "Prospecting, pipeline, forecasting and reporting.",
  icon: Handshake,
  version: "0.2.0",
  minimumCoreVersion: "0.1.0",
  dependencies: [],
  capabilities: Object.values(SALES_CAPABILITIES).filter((capability) => !capability.startsWith("sales.order.") && !capability.startsWith("sales.quote.")),
  rootPath: "/crm/today",
  accessCapability: SALES_CAPABILITIES.opportunityRead,
  status: "installed",
  // Navigation deliberately stays to five items (§5) — Leads/Tasks/Calls/
  // Sequences/Playbooks/Territories/Teams/Products/Settings all exist but are
  // reached contextually (from Today, Prospect, an opportunity, or Sales
  // settings), never as permanent top-level menu items.
  navigation: [
    { label: "Dashboards", href: "/crm/dashboards", capability: SALES_CAPABILITIES.reportRead },
    { label: "Today", href: "/crm/today", capability: SALES_CAPABILITIES.opportunityRead },
    { label: "Prospect", href: "/crm/prospect", capability: SALES_CAPABILITIES.prospectRead },
    { label: "Pipeline", href: "/crm/pipeline", capability: SALES_CAPABILITIES.opportunityRead },
    { label: "Forecast", href: "/crm/forecast", capability: SALES_CAPABILITIES.forecastRead },
    { label: "Reports", href: "/crm/reports", capability: SALES_CAPABILITIES.reportRead },
  ],
  customerOverviewProvider: crmCustomerOverviewProvider,
  attentionProvider: salesAttentionProvider,
  searchProvider: salesSearchProvider,

};
