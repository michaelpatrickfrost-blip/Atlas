import { ModuleSpace } from "@/components/shell/module-space";
import { projectsManifest } from "@/modules/projects/manifest";
export default function Layout({children}:{children:React.ReactNode}) {return <ModuleSpace module={projectsManifest}>{children}</ModuleSpace>;}
