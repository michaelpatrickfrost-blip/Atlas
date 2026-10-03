import { ModuleSpace } from "@/components/shell/module-space";
import { peopleManifest } from "@/modules/people/manifest";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ModuleSpace module={peopleManifest}>{children}</ModuleSpace>;
}
