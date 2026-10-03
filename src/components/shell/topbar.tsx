import Link from "next/link";
import { LogOut } from "lucide-react";
import { ChatDock } from "@/app/(app)/chat/chat-dock";
import { logoutAction } from "@/core/auth/actions";
import { CommandPalette } from "./command-palette";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { WorkspaceBack } from "./workspace-back";
import { Avatar } from "@/components/ui/avatar";
import { getNavigableModules } from "@/core/modules/runtime";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES, CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import type { Session } from "@/core/auth/session";

export async function Topbar({ session }: { session: Session }) {
  const modules = await getNavigableModules(session);
  return (
    <header className="flex h-[var(--atlas-topbar)] shrink-0 items-center gap-3 border-b border-white/70 bg-white/55 px-3 backdrop-blur-2xl sm:px-5">
      <MobileNav>
        <NavLinks modules={modules} showCustomers={can(session, CUSTOMER_CAPABILITIES.read)} showSettings={can(session, CORE_CAPABILITIES.modulesManage)} showChat={can(session, CORE_CAPABILITIES.chatRead)} />
      </MobileNav>
      <WorkspaceBack />
      <div className="min-w-0 flex-1 lg:max-w-xl"><CommandPalette /></div>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {can(session, CORE_CAPABILITIES.chatRead) && <ChatDock />}
        <Link href="/profile" aria-label="Your profile" className="rounded-full p-0.5"><Avatar name={session.userName} /></Link>
        <form action={logoutAction}>
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-[#6e6e73] hover:bg-white/80 hover:text-[#1d1d1f]">
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
