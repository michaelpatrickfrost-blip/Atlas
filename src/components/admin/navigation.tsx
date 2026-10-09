"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, SlidersHorizontal, Cable, ShieldCheck, Archive, History } from "lucide-react";

const ICONS = { companies: Building2, team: Users, studio: SlidersHorizontal, connections: Cable, guardian: ShieldCheck, cleanup: Archive, activity: History };
export type AdminLink = { id: keyof typeof ICONS; href: string; label: string; description: string };

export function AdminNavigation({ links }: { links: readonly AdminLink[] }) {
  const path = usePathname();
  const selected = links.find(link => link.href !== "/atlas" && (path === link.href || path.startsWith(`${link.href}/`)))?.id ?? "companies";
  return <nav aria-label="Atlas administration" className="flex gap-1 overflow-x-auto rounded-[24px] border border-white/90 bg-white/80 p-2 shadow-[0_8px_40px_-28px_rgba(44,81,136,0.3)] lg:h-full lg:flex-col lg:gap-2 lg:p-3">
    {links.map(({ id, href, label, description }) => {
      const Icon = ICONS[id], active = selected === id;
      return <Link key={id} href={href} prefetch={false} aria-current={active ? "page" : undefined} className={`group flex min-h-12 shrink-0 items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:shrink ${active ? "bg-[#eaf3ff] text-[#075bff]" : "text-[#526587] hover:bg-blue-50 hover:text-blue-700"}`}>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${active ? "bg-white" : "bg-blue-50/80"}`}><Icon size={19} strokeWidth={1.8} aria-hidden="true" /></span>
        <span className="min-w-0"><span className="block whitespace-nowrap font-semibold">{label}</span><span className="mt-1 hidden text-[11px] font-normal leading-4 text-[#7b879e] lg:block">{description}</span></span>
      </Link>;
    })}
  </nav>;
}
