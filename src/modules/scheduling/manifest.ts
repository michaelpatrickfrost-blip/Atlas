import { CalendarDays } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { SCHEDULING_CAPABILITIES } from "@/core/permissions/capabilities";
import { schedulingAnalytics } from "./services/analytics";
export const schedulingManifest: ModuleManifest = {
  analyticsProvider: schedulingAnalytics,
  id: "scheduling", name: "People planner", description: "Month plans by team, office, production and contact-centre hours, traffic and cover when people are off.", icon: CalendarDays,
  version: "0.3.0", minimumCoreVersion: "0.1.0", dependencies: ["people"], capabilities: Object.values(SCHEDULING_CAPABILITIES),
  rootPath: "/scheduling", accessCapability: "core.profile.self", status: "available",
  navigation: [{ label: "Planner", href: "/scheduling" }],
};
