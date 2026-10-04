import { pricingAnalytics } from "./services/analytics";
import { Tags } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";

export const pricingManifest: ModuleManifest = {
  analyticsProvider: pricingAnalytics,
  id: "pricing",
  name: "Pricing",
  description: "Price lists, customer prices, contracts and service promises.",
  icon: Tags,
  version: "0.2.0",
  minimumCoreVersion: "0.1.0",
  dependencies: [],
  capabilities: [],
  rootPath: "/pricing",
  accessCapability: "core.pricing.read",
  navigation: [
    { label: "Price lists", href: "/pricing" },
    { label: "Agreements", href: "/pricing/agreements" },
  ],
  status: "available",
};
