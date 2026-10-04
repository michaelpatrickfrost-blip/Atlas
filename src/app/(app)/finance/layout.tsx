import {ModuleSpace} from '@/components/shell/module-space';
import {financeManifest} from '@/modules/finance/manifest';
export default function FinanceLayout({children}:{children:React.ReactNode}){return <ModuleSpace module={financeManifest}>{children}</ModuleSpace>;}
