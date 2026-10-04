import { Factory } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { manufacturingAttention, searchManufacturing } from "./services/queries";

// Phase 1 domain foundation only (BOM/routing snapshot references, Production Orders,
// Work Orders) — see docs/modules/MANUFACTURING_PLANNING.md and
// docs/modules/MANUFACTURING_COVERAGE.md for what remains open (MRP, scheduling,
// Shop Floor execution UI, costing, traceability, cross-module providers).
export const manufacturingManifest: ModuleManifest = {
  id: "manufacturing",
  name: "Manufacturing",
  description: "Production orders, work orders and shop-floor execution.",
  icon: Factory,
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: ["stock", "products"],
  capabilities: Object.values(C),
  rootPath: "/manufacturing",
  accessCapability: C.orderRead,
  status: "available",
  attentionProvider: async ({ organisationId, session }) => (session.capabilities.has(C.orderRead) ? manufacturingAttention(organisationId) : []),
  searchProvider: async ({ session, query }) => (session.capabilities.has(C.orderRead) ? searchManufacturing(session, query) : []),
  navigation: [
    { label: "Today", href: "/manufacturing", capability: C.orderRead },
    { label: "Plan", href: "/manufacturing/plan", capability: C.planRead },
    { label: "Plant", href: "/manufacturing/plant", capability: C.orderRead },
    { label: "Schedule", href: "/manufacturing/schedule", capability: C.scheduleRead },
    { label: "Produce", href: "/manufacturing/produce", capability: C.orderRead },
    { label: "Shop Floor", href: "/manufacturing/shop-floor", capability: C.workOrderExecute },
    { label: "Reports", href: "/manufacturing/reports", capability: C.orderRead },
  ],
};
