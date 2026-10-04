import Link from "next/link";
import type { Session } from "@/core/auth/session";
import { getNavigableModules } from "@/core/modules/runtime";
import { NavLinks } from "@/components/shell/nav-links";
import { Avatar } from "@/components/ui/avatar";
import { AtlasLogo } from "@/components/shell/atlas-logo";
import { CompanyMark } from "@/components/shell/company-mark";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES, CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { canOpenCompanyAdmin } from "@/app/(app)/settings/settings-menu";

export async function Sidebar({ session }: { session: Session }) {
  const modules = await getNavigableModules(session);
  return (
    <aside className="atlas-sidebar hidden h-full w-[248px] shrink-0 flex-col px-3 py-5 md:flex">
      <Link href="/home" aria-label="Atlas home" className="mb-4 flex items-center gap-2.5 overflow-hidden rounded-xl px-1.5 py-1 hover:bg-black/[0.04]">
        <img src="/brand/atlas-icon.png" alt="" className="size-8 shrink-0" />
        <AtlasLogo className="h-5 min-w-0" />
      </Link>
      <div className="mb-4 flex min-w-0 items-center gap-2.5 px-1.5">
        <CompanyMark organisationId={session.organisationId} name={session.organisationName} size="sm" />
        <p className="min-w-0 truncate text-[13px] font-medium text-[#1d1d1f]">{session.organisationName}</p>
      </div>
      <NavLinks modules={modules} showCustomers={can(session, CUSTOMER_CAPABILITIES.read)} showSettings={can(session, CORE_CAPABILITIES.modulesManage)} showCompanyAdmin={canOpenCompanyAdmin(session)} showChat={can(session, CORE_CAPABILITIES.chatRead)} />
      <Link href="/profile" className="mt-3 flex min-w-0 items-center gap-2.5 rounded-2xl px-2 py-2 hover:bg-black/[0.04]">
        <Avatar name={session.userName} size="sm" />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-[#1d1d1f]">{session.userName}</span>
          <span className="block truncate text-[11px] text-[#6e6e73]">My work</span>
        </span>
      </Link>
    </aside>
  );
}
