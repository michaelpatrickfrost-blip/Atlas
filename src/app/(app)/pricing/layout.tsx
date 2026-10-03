import { ModuleSpace } from "@/components/shell/module-space";
import { pricingManifest } from "@/modules/pricing/manifest";
export default function Layout({children}:{children:React.ReactNode}) {return <ModuleSpace module={pricingManifest}>{children}</ModuleSpace>;}
