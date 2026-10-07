import { planBusinessPlanning } from "./services/input-read";
import { Compass } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { PLAN_CAPABILITIES } from "@/core/permissions/capabilities";
import { planAttention, planSearch } from "./services/providers";

export const planManifest: ModuleManifest = {
 businessPlanningProvider: planBusinessPlanning,
  id: "plan",
  name: "Plan",
  description: "Decide what should happen next, from the records Atlas already holds.",
  icon: Compass,
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: [],
  capabilities: Object.values(PLAN_CAPABILITIES),
  rootPath: "/plan",
  accessCapability: PLAN_CAPABILITIES.read,
  status: "available",
  attentionProvider: planAttention,
  searchProvider: planSearch,
  navigation: [
    { label: "Home", href: "/plan" },
    { label: "Plans", href: "/plan/plans" },
    { label: "Scenarios", href: "/plan/scenarios" },
    { label: "Reviews", href: "/plan/reviews" },
    { label: "Insights", href: "/plan/insights" },
  ],
};
