import Link from "next/link";
import { ChartNoAxesColumnIncreasing, Home, ListTodo, MessageSquare, Settings } from "lucide-react";
import type { Session } from "@/core/auth/session";
import { getNavigableModules } from "@/core/modules/runtime";
import { can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { canOpenCompanyAdmin } from "@/app/(app)/settings/settings-menu";

/** Workspace utilities only. Business apps live in the central directory. */
export async function HomeNavigation({ session }: { session: Session }) {
  const modules = await getNavigableModules(session);
  const links = [
    { name: "Home", href: "/home", icon: Home },
    ...(modules.some((app) => app.id === "analytics") ? [{ name: "Reports", href: "/analytics", icon: ChartNoAxesColumnIncreasing }] : []),
    { name: "My tasks", href: "/profile#assigned", icon: ListTodo },
    ...(can(session, CORE_CAPABILITIES.chatRead) ? [{ name: "Messages", href: "/chat", icon: MessageSquare }] : []),
    ...(canOpenCompanyAdmin(session) ? [{ name: "Settings", href: "/settings", icon: Settings }] : []),
  ];
  return <nav aria-label="Workspace utilities" className="flex gap-1 rounded-[24px] border border-white/90 bg-white/75 p-2 shadow-[0_8px_40px_-28px_rgba(44,81,136,0.3)] lg:h-full lg:flex-col lg:gap-2 lg:p-2.5">
    {links.map(({ name, href, icon: Icon }) => <Link key={href} href={href} prefetch={false} aria-current={href === "/home" ? "page" : undefined} className={`flex min-h-11 flex-1 items-center justify-center gap-3 rounded-2xl px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:min-h-12 lg:flex-none lg:justify-start ${href === "/home" ? "bg-[#eaf3ff] text-[#075bff]" : "text-[#526587] hover:bg-blue-50 hover:text-blue-700"}`}><Icon aria-hidden="true" size={19} strokeWidth={1.8} /><span className="hidden sm:inline">{name}</span><span className="sr-only sm:hidden">{name}</span></Link>)}
  </nav>;
}
