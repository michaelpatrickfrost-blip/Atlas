import { ModuleSpace } from "@/components/shell/module-space";
import { automationsManifest } from "@/modules/automations/manifest";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ModuleSpace module={automationsManifest} wide chrome="quiet">{children}</ModuleSpace>;
}
