import { SlidersHorizontal } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { STUDIO_CAPABILITIES } from "@/core/studio/permissions";
export const studioManifest: ModuleManifest = {
  id: "studio", name: "Studio", description: "Review, publish and activate your company's configuration.",
  icon: SlidersHorizontal, version: "0.1.0", minimumCoreVersion: "0.1.0", dependencies: [],
  capabilities: Object.values(STUDIO_CAPABILITIES), rootPath: "/studio",
  audience: "customer", accessCapability: STUDIO_CAPABILITIES.read, status: "available",
  navigation: [{ label: "Configuration", href: "/studio", capability: STUDIO_CAPABILITIES.read }],
};
