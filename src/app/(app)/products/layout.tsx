import { ModuleSpace } from "@/components/shell/module-space";
import { productsManifest } from "@/modules/products/manifest";
export default function Layout({children}:{children:React.ReactNode}) {return <ModuleSpace module={productsManifest}>{children}</ModuleSpace>;}
