import { ModuleSpace } from '@/components/shell/module-space';
import { planningManifest } from '@/modules/planning/manifest';
import { requireSession } from '@/core/auth/session';
import { canOpenSupplyConsole } from '@/modules/manufacturing/services/console';
import { ConsoleSpace } from '@/modules/manufacturing/components/console-space';
export default async function Layout({children}:{children:React.ReactNode}) {const session=await requireSession();return await canOpenSupplyConsole(session)?<ConsoleSpace module={planningManifest}>{children}</ConsoleSpace>:<ModuleSpace module={planningManifest}>{children}</ModuleSpace>;}
