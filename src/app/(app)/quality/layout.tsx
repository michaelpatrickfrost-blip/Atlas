import { ModuleSpace } from '@/components/shell/module-space';
import { qualityManifest } from '@/modules/quality/manifest';
export default function Layout({children}:{children:React.ReactNode}) {return <ModuleSpace module={qualityManifest}>{children}</ModuleSpace>;}
