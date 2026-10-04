import { Zap } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { AUTOMATION_CAPABILITIES } from "@/core/permissions/capabilities";

export const automationsManifest: ModuleManifest = {
  id: "automations",
  name: "Automations",
  description: "When this happens, do that — across Sales, CRM, Logistics, Finance, Production and Service.",
  icon: Zap,
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: [],
  capabilities: Object.values(AUTOMATION_CAPABILITIES),
  rootPath: "/automations",
  accessCapability: AUTOMATION_CAPABILITIES.read,
  status: "available",
  navigation: [
    { label: "Automations", href: "/automations", capability: AUTOMATION_CAPABILITIES.read },
    { label: "Activity", href: "/automations/activity", capability: AUTOMATION_CAPABILITIES.read },
  ],
};
