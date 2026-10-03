import { ModuleSpace } from "@/components/shell/module-space";
import { stockManifest } from "@/modules/stock/manifest";
export default function Layout({children}:{children:React.ReactNode}) {return <ModuleSpace module={stockManifest}>{children}</ModuleSpace>;}
