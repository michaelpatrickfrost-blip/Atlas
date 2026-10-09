import {ModuleSpace} from '@/components/shell/module-space';
import {financeManifest} from '@/modules/finance/manifest';
import {ConsoleReturn} from '@/modules/manufacturing/components/console-return';
export default function FinanceLayout({children}:{children:React.ReactNode}){return <ModuleSpace module={financeManifest}><ConsoleReturn/>{children}</ModuleSpace>;}
