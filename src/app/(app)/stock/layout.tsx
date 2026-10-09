import { ModuleSpace } from "@/components/shell/module-space";
import { stockManifest } from "@/modules/stock/manifest";
import { requireSession } from "@/core/auth/session";
import { canOpenSupplyConsole } from "@/modules/manufacturing/services/console";
import { ConsoleSpace } from "@/modules/manufacturing/components/console-space";
export default async function Layout({children}:{children:React.ReactNode}) {
  const session = await requireSession();
  return await canOpenSupplyConsole(session)
    ? <ConsoleSpace module={stockManifest}>{children}</ConsoleSpace>
    : <ModuleSpace module={stockManifest}>{children}</ModuleSpace>;
}
