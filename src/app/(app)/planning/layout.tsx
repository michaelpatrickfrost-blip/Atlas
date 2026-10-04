import { ModuleSpace } from '@/components/shell/module-space';
import { planningManifest } from '@/modules/planning/manifest';
export default function Layout({children}:{children:React.ReactNode}) {return <ModuleSpace module={planningManifest}>{children}</ModuleSpace>;}
