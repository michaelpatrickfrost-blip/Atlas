"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { iconForNav } from "@/components/shell/nav-icon";

type Item = { label: string; href: string; hint: string };
type Group = { label: string; items: Item[] };

function activeItem(href: string, pathname: string, tab: string | null) {
  const url = new URL(href, "http://atlas.local");
  if (url.pathname === "/profile") return pathname === "/profile";
  if (url.pathname !== "/settings") return pathname === url.pathname || pathname.startsWith(`${url.pathname}/`);
  if (pathname.startsWith("/settings/users")) return url.searchParams.get("tab") === "users";
  if (pathname !== "/settings") return false;
  return tab === url.searchParams.get("tab");
}

export function SettingsNav({ groups }: { groups: Group[] }) {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  return (
    <nav aria-label="Company administration" className="flex flex-col gap-4 lg:sticky lg:top-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1 text-[11px] font-medium text-[#86868b]">{group.label}</p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = iconForNav(item.label);
              const active = activeItem(item.href, pathname, tab);
              return (
                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex items-start gap-3 rounded-2xl px-3 py-2.5 ${active ? "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "hover:bg-white/80"}`}>
                  <Icon size={16} strokeWidth={1.8} className={`mt-0.5 shrink-0 ${active ? "text-[#0071e3]" : "text-[#86868b]"}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[#1d1d1f]">{item.label}</span>
                    <span className="block text-[11px] leading-4 text-[#6e6e73]">{item.hint}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
