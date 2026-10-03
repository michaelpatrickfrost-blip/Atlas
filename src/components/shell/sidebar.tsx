import Link from "next/link";
import { Layers } from "lucide-react";
import type { Session } from "@/core/auth/session";
import { getNavigableModules } from "@/core/modules/runtime";
import { NavLinks } from "@/components/shell/nav-links";
import { Avatar } from "@/components/ui/avatar";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES, CORE_CAPABILITIES } from "@/core/permissions/capabilities";

/** Desktop sidebar. Hidden below `md`; the mobile drawer (`MobileNav`) in the
 *  topbar renders the same `NavLinks` for small screens instead of duplicating
 *  markup that could drift out of sync. */
export async function Sidebar({ session }: { session: Session }) {
  const modules = await getNavigableModules(session);

  return (
    <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-[#24324c] bg-[#101d37] px-3 py-5 md:flex">
      <div className="flex items-center gap-2 px-2 pb-6">
        <Layers size={23} strokeWidth={1.7} />
        <span className="text-[20px] font-semibold tracking-tight text-white">Atlas</span>
      </div>
      <p className="mb-5 truncate px-3 text-xs text-[#aebed9]">{session.organisationName}</p>

      <NavLinks modules={modules} showCustomers={can(session, CUSTOMER_CAPABILITIES.read)} showSettings={can(session, CORE_CAPABILITIES.modulesManage)} showChat={can(session, CORE_CAPABILITIES.chatRead)} />

      <Link href="/profile" className="mt-3 flex min-w-0 items-center gap-2 border-t border-[#24324c] px-2 pt-3">
        <Avatar name={session.userName} size="sm" />
        <span className="truncate text-sm text-[#aebed9]">{session.userName}</span>
      </Link>
    </aside>
  );
}
