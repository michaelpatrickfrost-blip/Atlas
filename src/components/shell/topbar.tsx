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
import { TopbarVariant } from "./topbar-variant";
import { AtlasLogo } from "./atlas-logo";
import { CompanyMark } from "./company-mark";

export function Topbar({ session }: { session: Session }) {
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" }).format(new Date());
  const home = <header className="flex min-h-[88px] shrink-0 flex-wrap items-center gap-3 px-4 py-4 sm:flex-nowrap sm:px-6 lg:gap-8">
    <Link href="/home" aria-label="Atlas Home" className="flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-blue-600">
      <img src="/brand/atlas-mark.png" width={515} height={400} alt="" className="h-10 w-[52px] object-contain mix-blend-multiply sm:h-12 sm:w-[62px]" />
      <span className="hidden sm:block"><AtlasLogo className="h-auto w-[148px] mix-blend-multiply" /><span className="mt-1.5 block text-center text-[8px] tracking-[0.16em] text-[#526587]">Plan. Make. Deliver.</span></span>
    </Link>
    <div className="order-3 w-full min-w-0 sm:order-none sm:flex-1 lg:ml-12 lg:max-w-[450px]"><CommandPalette /></div>
    <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
      <NoticeBell />
      <Link href="/profile" aria-label="My work" title="My work" className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-white/70">
        <CompanyMark organisationId={session.organisationId} name={session.organisationName} size="md" />
        <span className="hidden max-w-[190px] text-left md:block"><span className="block truncate text-sm font-semibold tracking-tight text-slate-950">{session.organisationName}</span><span className="mt-1 block text-xs text-[#71809a]">{today}</span></span>
      </Link>
      <form action={logoutAction}><button type="submit" aria-label="Sign out" title="Sign out" className="inline-flex size-9 items-center justify-center rounded-full text-[#71809a] hover:bg-white"><LogOut size={16} /></button></form>
    </div>
  </header>;
  return (
    <TopbarVariant home={home} regular={
    // Keep fixed chat/search overlays relative to the viewport; backdrop-filter traps them in this header.
    <header className="flex h-[var(--atlas-topbar)] shrink-0 items-center gap-2 border-b border-black/[0.06] bg-white px-3 sm:gap-3 sm:px-5">
      <Link href="/home" aria-label="Home" title="Home" className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-black/[0.05]">
        <img src="/brand/atlas-icon.png" alt="" className="size-6" />
      </Link>
      <AppMenu><AppDirectory session={session} /></AppMenu>
      <WorkspaceBack />
      {can(session, "atlas.companies.manage") && <Link href="/atlas" title={`Atlas staff · ${session.organisationName}`} className="hidden max-w-48 truncate rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 sm:block">{session.organisationName} · Admin</Link>}
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
    } />
  );
}
