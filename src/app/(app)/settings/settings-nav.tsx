"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { iconForNav } from "@/components/shell/nav-icon";

type Item = { label: string; href: string; hint: string };
type Group = { label: string; items: Item[] };

function activeItem(href: string, pathname: string, tab: string | null) {
  const url = new URL(href, "http://atlas.local");
  if (url.pathname.startsWith("/profile")) return pathname === "/profile";
  if (url.pathname !== "/settings")
    return pathname === url.pathname || pathname.startsWith(`${url.pathname}/`);
  if (pathname.startsWith("/settings/users"))
    return url.searchParams.get("tab") === "users";
  if (pathname !== "/settings") return false;
  return tab === url.searchParams.get("tab");
}

export function SettingsNav({ groups }: { groups: Group[] }) {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  const items = (
    <>
      {groups.map((group) => (
        <section key={group.label}>
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = iconForNav(item.label);
              const active = activeItem(item.href, pathname, tab);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-start gap-3 rounded-xl px-3 py-3 ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-blue-50/50"}`}
                >
                  <Icon size={17} className="mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-[10px] leading-4 text-slate-500">
                      {item.hint}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
  const active = groups
    .flatMap((g) => g.items)
    .find((item) => activeItem(item.href, pathname, tab));
  return (
    <nav
      aria-label="Company administration"
      className="rounded-[24px] border border-white bg-white/70 p-3 shadow-sm xl:sticky xl:top-4"
    >
      <details className="xl:hidden">
        <summary className="cursor-pointer px-2 py-2 text-xs font-semibold text-blue-700">
          Browse company settings · {active?.label ?? "Choose a section"}
        </summary>
        <div
          className="mt-3 max-h-[55vh] space-y-4 overflow-y-auto"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a"))
              e.currentTarget.parentElement?.removeAttribute("open");
          }}
        >
          {items}
        </div>
      </details>
      <div className="hidden max-h-[75vh] space-y-5 overflow-y-auto xl:block">
        {items}
      </div>
    </nav>
  );
}
