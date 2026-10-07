import { requestServiceQuality } from "./services/service-issue";
import { ShieldCheck } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { QUALITY_CAPABILITIES } from "@/core/permissions/capabilities";

export const qualityManifest: ModuleManifest = {
 serviceOperationProvider:requestServiceQuality,
  id: "quality", name: "Quality", description: "Inspections, nonconformance and corrective actions.",
  icon: ShieldCheck, version: "0.1.0", minimumCoreVersion: "0.1.0", dependencies: [],
  capabilities: Object.values(QUALITY_CAPABILITIES),
  rootPath: "/quality", accessCapability: QUALITY_CAPABILITIES.today, status: "available",
  navigation: [
    { label: "Quality Home", href: "/quality", capability: QUALITY_CAPABILITIES.today },
    { label: "Specifications", href: "/quality/specifications", capability: QUALITY_CAPABILITIES.specRead },
    { label: "Control Points", href: "/quality/control-points", capability: QUALITY_CAPABILITIES.controlPointRead },
    { label: "Checks", href: "/quality/checks", capability: QUALITY_CAPABILITIES.checkExecute },
    { label: "Quality Holds", href: "/quality/holds", capability: QUALITY_CAPABILITIES.holdRead },
    { label: "NCRs", href: "/quality/ncr", capability: QUALITY_CAPABILITIES.ncrRead },
    { label: "Reports", href: "/quality/reports", capability: QUALITY_CAPABILITIES.reportRead },
  ],
};
