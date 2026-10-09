import { reports } from './services/reports';
import { manufacturingAnalytics } from "./services/analytics";
import { supplyPurchaseProvider } from "./services/purchase-proposals";
import { manufacturingRecordContext, manufacturingRecordRelationships } from "./services/relationships";
import { manufacturingBusinessPlanning, publishSopDemand } from "./services/business-planning";
import { Factory } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { manufacturingAttention, searchManufacturing } from "./services/queries";

// Manufacturing & Production Planning Module
// Includes MRP engine, planned orders, material shortage workbench, capacity planning,
// manufacturing orders, work orders and shop-floor execution.
export const manufacturingManifest: ModuleManifest = {
 reportProvider: reports,
 supplyPurchaseProvider,
 analyticsProvider: manufacturingAnalytics,
 recordContextProvider: manufacturingRecordContext, recordRelationshipProvider: manufacturingRecordRelationships,
 businessPlanningProvider: manufacturingBusinessPlanning,planningPublicationConsumer: publishSopDemand,
  id: "manufacturing",
  name: "Manufacturing & Supply",
  description: "One console for demand, materials, scheduling, production, procurement and spend.",
  icon: Factory,
  version: "0.2.0",
  minimumCoreVersion: "0.1.0",
  dependencies: ["stock", "products", "sales"],
  capabilities: Object.values(C),
  rootPath: "/manufacturing",
  accessCapability: C.orderRead,
  accessAnyOf: [C.orderRead, C.planRead, C.workOrderExecute, "planning.demand.read", "stock.read", "finance.purchase.read", "finance.report.read"],
  status: "available",
  attentionProvider: async ({ organisationId, session }) => (session.capabilities.has(C.orderRead) ? manufacturingAttention(organisationId) : []),
  searchProvider: async ({ session, query }) => (session.capabilities.has(C.orderRead) ? searchManufacturing(session, query) : []),
  navigation: [
    { label: "Console", href: "/manufacturing" },
    { label: "Production today", href: "/manufacturing/today", capability: C.orderRead },
    { label: "How-to library", href: "/manufacturing/help" },
    { label: "Production plan", href: "/manufacturing/planning", capability: C.planRead, group: "Planning" },
    { label: "Planned orders", href: "/manufacturing/planning/planned-orders", capability: C.planRead, group: "Planning" },
    { label: "Shortages", href: "/manufacturing/planning/shortages", capability: C.planRead, group: "Planning" },
    { label: "Forecast demand", href: "/manufacturing/planning/forecast", capability: C.planRead, group: "Planning" },
    { label: "Plant", href: "/manufacturing/plant", capability: C.orderRead },
    { label: "Schedule", href: "/manufacturing/schedule", capability: C.scheduleRead },
    { label: "Produce", href: "/manufacturing/produce", capability: C.orderRead },
    { label: "Shop Floor", href: "/manufacturing/shop-floor", capability: C.workOrderExecute },
    { label: "Reports", href: "/manufacturing/reports", capability: C.orderRead },
  ],
};
