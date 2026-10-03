import { ModuleSpace } from "@/components/shell/module-space";
import { kpisManifest } from "@/modules/kpis/manifest";
export default function Layout({children}:{children:React.ReactNode}) {return <ModuleSpace module={kpisManifest}>{children}</ModuleSpace>;}
