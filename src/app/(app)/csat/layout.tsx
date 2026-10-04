import { ModuleSpace } from "@/components/shell/module-space";
import { csatManifest } from "@/modules/csat/manifest";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ModuleSpace module={csatManifest} chrome="quiet">{children}</ModuleSpace>;
}
