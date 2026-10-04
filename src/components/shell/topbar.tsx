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

export function Topbar({ session }: { session: Session }) {
  return (
    // Keep fixed chat/search overlays relative to the viewport; backdrop-filter traps them in this header.
    <header className="flex h-[var(--atlas-topbar)] shrink-0 items-center gap-2 border-b border-black/[0.06] bg-white px-3 sm:gap-3 sm:px-5">
      <Link href="/home" aria-label="Home" title="Home" className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-black/[0.05]">
        <img src="/brand/atlas-icon.png" alt="" className="size-6" />
      </Link>
      <AppMenu><AppDirectory session={session} /></AppMenu>
      <WorkspaceBack />
      <div className="min-w-0 flex-1 lg:max-w-md"><CommandPalette /></div>
      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <NewWindow />
        <NoticeBell />
        {can(session, CORE_CAPABILITIES.chatRead) && <ChatDock />}
        <Link href="/profile" aria-label="My work" title="My work" className="rounded-full p-0.5"><Avatar name={session.userName} size="sm" /></Link>
        <form action={logoutAction}>
          <button type="submit" aria-label="Sign out" title="Sign out" className="inline-flex size-9 items-center justify-center rounded-full text-[#6e6e73] hover:bg-black/[0.05] hover:text-[#1d1d1f]">
            <LogOut size={15} />
          </button>
        </form>
      </div>
    </header>
  );
}
