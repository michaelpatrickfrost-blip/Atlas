import { ModuleSpace } from "@/components/shell/module-space";
import { schedulingManifest } from "@/modules/scheduling/manifest";
export default function Layout({ children }: { children: React.ReactNode }) { return <ModuleSpace module={schedulingManifest} wide>{children}</ModuleSpace>; }
