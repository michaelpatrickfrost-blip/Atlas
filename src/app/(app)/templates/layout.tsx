import { ModuleSpace } from '@/components/shell/module-space';
import { templatesManifest } from '@/modules/templates/manifest';
export default function Layout({children}:{children:React.ReactNode}){return <ModuleSpace module={templatesManifest} wide>{children}</ModuleSpace>;}
