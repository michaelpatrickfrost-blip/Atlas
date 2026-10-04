import { ModuleSpace } from "@/components/shell/module-space";
import { manufacturingManifest } from "@/modules/manufacturing/manifest";

export default function ManufacturingLayout({ children }: { children: React.ReactNode }) {
  return <ModuleSpace module={manufacturingManifest} wide chrome="quiet">{children}</ModuleSpace>;
}
