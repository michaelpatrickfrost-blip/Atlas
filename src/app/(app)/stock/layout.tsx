import { ModuleSpace } from "@/components/shell/module-space";
import { stockManifest } from "@/modules/stock/manifest";
import { ConsoleReturn } from "@/modules/manufacturing/components/console-return";
export default function Layout({children}:{children:React.ReactNode}) {return <ModuleSpace module={stockManifest}><ConsoleReturn />{children}</ModuleSpace>;}
