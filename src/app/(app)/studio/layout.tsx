import { ModuleSpace } from "@/components/shell/module-space";
import { studioManifest } from "@/modules/studio/manifest";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ModuleSpace module={studioManifest} wide>{children}</ModuleSpace>;
}
