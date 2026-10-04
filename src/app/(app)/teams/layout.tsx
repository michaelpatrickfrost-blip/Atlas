import { ModuleSpace } from "@/components/shell/module-space";
import { teamsManifest } from "@/modules/teams/manifest";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ModuleSpace module={teamsManifest} wide>{children}</ModuleSpace>;
}
