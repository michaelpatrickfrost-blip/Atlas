import { ModuleSpace } from "@/components/shell/module-space";
import { analyticsManifest } from "@/modules/analytics/manifest";
export default function Layout({children}:{children:React.ReactNode}) {return <ModuleSpace module={analyticsManifest} wide>{children}</ModuleSpace>;}
