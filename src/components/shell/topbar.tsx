import { TasksButton } from "./task-notifications";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { ChatDock } from "@/app/(app)/chat/chat-dock";
import { NoticeBell } from "./notice-bell";
import { logoutAction } from "@/core/auth/actions";
import { CommandPalette } from "./command-palette";
import { AppDirectory } from "./app-directory";
import { AppMenu } from "./app-menu";
import { NewWindow } from "./shell-chrome";
import { WorkspaceBack } from "./workspace-back";
import { Avatar } from "@/components/ui/avatar";
import { can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import type { Session } from "@/core/auth/session";
import { CompanyMark } from "./company-mark";
import { TopbarTitle } from "./topbar-title";
import { RailToggle } from "./rail-nav";
import { getNavigableModules } from "@/core/modules/runtime";
import { ContextGuideLink } from './context-guide-link';

/** One slim header for every route. On desktop the icon rail carries Home, Apps,
 *  utilities and the account; phones keep those controls here. */
export async function Topbar({ session }: { session: Session }) {
  const apps = (await getNavigableModules(session)).map((app): [string, string] => [app.rootPath, app.name]);
  return (
    // Keep fixed chat/search overlays relative to the viewport; backdrop-filter traps them in this header.
    <header className="atlas-workspace-topbar flex h-[var(--atlas-topbar)] shrink-0 flex-wrap items-center gap-1 px-2 py-2 min-[360px]:gap-2 min-[360px]:px-3 sm:flex-nowrap sm:gap-3 sm:px-5 sm:py-0">
      <RailToggle />
      <Link href="/home" aria-label="Home" title="Home" className="atlas-top-icon atlas-top-brand flex size-9 shrink-0 items-center justify-center rounded-lg">
        <img src="/brand/atlas-icon.png" alt="" width={1024} height={1024} className="size-6 rounded-[7px]" />
      </Link>
      <div className="lg:hidden"><AppMenu><AppDirectory session={session} /></AppMenu></div>
      <div className="hidden min-[360px]:block"><WorkspaceBack /></div>
      <span className="atlas-topbar-org hidden lg:block"><CompanyMark organisationId={session.organisationId} name={session.organisationName} size="sm" /></span>
      <TopbarTitle organisation={session.organisationName} apps={apps} />
      <div className="order-3 w-full min-w-0 sm:order-none sm:ml-auto sm:w-[240px] sm:flex-none lg:w-[280px]"><CommandPalette variant="workspace" /></div>
      <div className="atlas-header-utilities ml-auto flex sm:ml-0 shrink-0 items-center gap-1 sm:gap-1.5">
        <NewWindow />
        {can(session, "core.profile.self") && <div className="lg:hidden"><TasksButton /></div>}
        <ContextGuideLink canPurchase={session.capabilities.has('finance.purchase.read')} />
        <NoticeBell />
        {can(session, CORE_CAPABILITIES.chatRead) && <ChatDock />}
        <Link href="/profile" aria-label="My work" title="My work" className="rounded-full p-0.5 lg:hidden"><Avatar name={session.userName} size="sm" /></Link>
        <form action={logoutAction} className="lg:hidden">
          <button type="submit" aria-label="Sign out" title="Sign out" className="atlas-top-icon inline-flex size-9 items-center justify-center rounded-lg">
            <LogOut size={15} />
          </button>
        </form>
      </div>
    </header>
  );
}
