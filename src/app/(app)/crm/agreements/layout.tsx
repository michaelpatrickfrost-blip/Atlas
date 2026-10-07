import { requireSession } from "@/core/auth/session";
import { assertModuleEnabled } from "@/core/modules/access";
export default async function AgreementsLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  await assertModuleEnabled(session, "pricing");
  return children;
}
