import { ModuleSpace } from "@/components/shell/module-space";
import { safetyManifest } from "@/modules/safety/manifest";

export default function SafetyLayout({ children }: { children: React.ReactNode }) {
  return <ModuleSpace module={safetyManifest} wide chrome="quiet">{children}</ModuleSpace>;
}
