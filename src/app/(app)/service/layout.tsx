import { ModuleSpace } from '@/components/shell/module-space';
import { serviceManifest } from '@/modules/service/manifest';
export default function Layout({children}:{children:React.ReactNode}) {return <ModuleSpace module={serviceManifest}>{children}</ModuleSpace>;}
