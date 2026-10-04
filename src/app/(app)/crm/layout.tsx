import { ModuleSpace } from "@/components/shell/module-space";
import { crmManifest } from "@/modules/crm/manifest";
export default function CRMLayout({ children }: { children: React.ReactNode }) { return <ModuleSpace module={crmManifest} wide chrome="quiet">{children}</ModuleSpace>; }
