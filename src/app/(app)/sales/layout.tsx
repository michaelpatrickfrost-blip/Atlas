import { ModuleSpace } from "@/components/shell/module-space";
import { salesManifest } from "@/modules/sales/manifest";
export default function SalesLayout({ children }: { children: React.ReactNode }) { return <ModuleSpace module={salesManifest}>{children}</ModuleSpace>; }
