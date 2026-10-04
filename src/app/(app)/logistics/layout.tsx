import { ModuleSpace } from "@/components/shell/module-space";
import { logisticsManifest } from "@/modules/logistics/manifest";

export default function LogisticsLayout({ children }: { children: React.ReactNode }) {
  return <ModuleSpace module={logisticsManifest} wide chrome="quiet">{children}</ModuleSpace>;
}
