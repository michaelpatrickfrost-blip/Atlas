import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { Session } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { STUDIO_CAPABILITIES } from "@/core/studio/permissions";
import { logoutAdminAction } from "@/core/auth/actions";
import { AtlasLogo } from "@/components/shell/atlas-logo";
import { GuardianObserver } from "@/components/shell/guardian-observer";
import { Refresh } from "@/components/shell/refresh";
import { AdminNavigation, type AdminLink } from "./navigation";

/** A separate platform console: no business launcher, data search, chat or task chrome. */
export function AdminShell({ session, children }: { session: Session; children: ReactNode }) {
  const links: AdminLink[] = [
    { id: "companies", href: "/atlas", label: "Companies", description: "Accounts, access and setup" },
    ...(can(session, ATLAS_CAPABILITIES.staff) ? [{ id: "team" as const, href: "/atlas/team", label: "Atlas team", description: "Platform staff and access" }] : []),
    ...(can(session, STUDIO_CAPABILITIES.read) ? [{ id: "studio" as const, href: "/atlas/studio", label: "Studio setup", description: "Company configuration" }] : []),
    { id: "connections", href: "/atlas/connections", label: "Connections", description: "Reviewed company imports" },
    { id: "guardian", href: "/atlas/guardian", label: "Guardian", description: "Platform quality and health" },
    ...(can(session, ATLAS_CAPABILITIES.archive) ? [{ id: "cleanup" as const, href: "/atlas/cleanup", label: "Cleanup", description: "Review Test-company cleanup" }] : []),
    { id: "activity", href: "/atlas/activity", label: "Admin activity", description: "Administrative audit trail" },
  ];
  return <div className="atlas-home-shell flex h-dvh min-w-0 flex-col overflow-hidden" data-atlas-console="admin">
    <Refresh /><GuardianObserver />
    <a href="#atlas-admin-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:p-3 focus:text-blue-700">Skip to administration</a>
    <header className="flex min-h-[88px] shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-7">
      <Link href="/atlas" aria-label="Atlas Admin" className="flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-blue-600">
        <img src="/brand/atlas-mark.png" width={515} height={400} alt="" className="h-11 w-[56px] object-contain mix-blend-multiply" />
        <span><AtlasLogo className="h-auto w-[136px] mix-blend-multiply" /><span className="mt-1 block text-[10px] font-semibold tracking-[0.14em] text-[#526587]">ADMINISTRATION</span></span>
      </Link>
      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
        <span className="hidden items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-3 py-2 text-xs text-blue-700 sm:inline-flex"><ShieldCheck size={14} aria-hidden="true" />Atlas staff</span>
        <span className="min-w-0 max-w-[120px] text-right sm:max-w-[200px]"><span className="block truncate text-xs font-semibold text-slate-900 sm:text-sm">{session.userName}</span><span className="mt-1 block text-[10px] text-[#71809a] sm:text-xs">Admin console</span></span>
        <form action={logoutAdminAction}><button type="submit" aria-label="Sign out of Atlas Admin" title="Sign out of Atlas Admin" className="inline-flex size-10 items-center justify-center rounded-xl bg-white/70 text-[#526587] hover:bg-white focus-visible:outline-2 focus-visible:outline-blue-600"><LogOut size={17} /></button></form>
      </div>
    </header>
    <div className="min-w-0 shrink-0 px-3 pb-3 lg:hidden"><AdminNavigation links={links} /></div>
    <div className="flex min-h-0 min-w-0 flex-1 gap-4 px-3 pb-4 sm:px-5 lg:gap-6 lg:px-7 lg:pb-6">
      <aside className="hidden w-[232px] shrink-0 lg:block"><AdminNavigation links={links} /></aside>
      <main id="atlas-admin-content" className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden rounded-[24px] border border-white/90 bg-white/65 p-4 shadow-[0_8px_40px_-28px_rgba(44,81,136,0.2)] sm:p-6 lg:p-7">
        <div className="mx-auto max-w-7xl space-y-7 pb-8"><div className="mb-6 border-b border-[#e6edf7] pb-5"><h1 className="text-2xl font-semibold tracking-tight text-slate-950">Atlas Admin</h1><p className="mt-2 text-sm text-[#7b879e]">Manage business accounts, platform access and company setup.</p></div>{children}</div>
      </main>
    </div>
  </div>;
}
