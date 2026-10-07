import { pricingAnalytics } from "./services/analytics";
import { Tags } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";

export const pricingManifest: ModuleManifest = {
  analyticsProvider: pricingAnalytics,
  id: "pricing",
  name: "Price lists",
  description: "Sales price lists and commercial pricing shared with CRM.",
  icon: Tags,
  version: "0.2.0",
  minimumCoreVersion: "0.1.0",
  dependencies: [],
  capabilities: [],
  rootPath: "/sales/price-lists",
  launcherVisible: false,
  accessCapability: "core.pricing.read",
  navigation: [
    { label: "Price lists", href: "/sales/price-lists" },
  ],
  status: "available",
};
