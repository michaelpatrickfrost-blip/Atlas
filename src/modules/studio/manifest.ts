import { SlidersHorizontal } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { STUDIO_CAPABILITIES, STUDIO_DATA_CAPABILITIES } from "@/core/studio/permissions";
export const studioManifest: ModuleManifest = {
  id: "studio", name: "Studio", description: "Business setup and approved data references.",
  icon: SlidersHorizontal, version: "0.1.0", minimumCoreVersion: "0.1.0", dependencies: [],
  capabilities: [...Object.values(STUDIO_CAPABILITIES), ...Object.values(STUDIO_DATA_CAPABILITIES)], rootPath: "/studio",
  audience: "customer", accessCapability: STUDIO_CAPABILITIES.read, status: "available",
  navigation: [{ label: "Business setup", href: "/studio", capability: STUDIO_CAPABILITIES.read }],
};
