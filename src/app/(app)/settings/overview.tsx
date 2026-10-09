"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Search,
  ShieldCheck,
  Users,
  SlidersHorizontal,
} from "lucide-react";
import type { SettingsLink } from "./settings-menu";
import { iconForNav } from "@/components/shell/nav-icon";
export function SettingsOverview({
  links,
  companyName,
  users,
  active,
  profiles,
}: {
  links: SettingsLink[];
  companyName: string;
  users: number | null;
  active: number | null;
  profiles: number | null;
}) {
  const [search, setSearch] = useState("");
  const available = links.filter(
    (link) => !["Overview", "Your profile"].includes(link.label),
  );
  const filtered = available.filter((link) =>
    (link.label + " " + link.hint + " " + link.group)
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-blue-50/60 to-blue-100/60 p-6 sm:p-8">
        <div className="absolute -right-5 -top-4 text-blue-200/70">
          <Building2 size={180} strokeWidth={0.6} />
        </div>
        <div className="relative max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
            Made for your company
          </p>
          <h3 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">
            The right setup.
            <br />
            The right access.
          </h3>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Shape {companyName} around the way your teams work. Keep company
            details, people, access and working rules in one place.
          </p>
          {links.some((l) => l.href === "/settings?tab=roles") && (
            <Link
              href="/settings?tab=roles"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white"
            >
              Build access profiles
              <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Company users", value: users, icon: Users },
          { label: "Active accounts", value: active, icon: Building2 },
          { label: "Access profiles", value: profiles, icon: ShieldCheck },
        ]
          .filter((stat) => stat.value !== null)
          .map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-blue-100/60 bg-white p-5"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                <stat.icon size={21} />
              </span>
              <div>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
      </div>
      <label className="relative block">
        <Search size={18} className="absolute left-4 top-4 text-slate-400" />
        <input
          aria-label="Search company settings"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find people, access, branding or a working rule…"
          className="min-h-12 w-full rounded-2xl border border-blue-100 bg-white py-3 pl-11 pr-4 text-sm"
        />
      </label>
      {[...new Set(filtered.map((link) => link.group))].map((group) => (
        <section key={group}>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <SlidersHorizontal size={14} />
            {group}
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {filtered
              .filter((link) => link.group === group)
              .map((link) => {
                const Icon = iconForNav(link.label);
                return (
                  <Link
                    href={link.href}
                    key={link.href}
                    className="group flex min-h-24 items-center gap-4 rounded-2xl border border-blue-100/60 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                      <Icon size={21} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold">{link.label}</h4>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {link.hint}
                      </p>
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="shrink-0 text-slate-400 group-hover:text-blue-600"
                    />
                  </Link>
                );
              })}
          </div>
        </section>
      ))}
      {!filtered.length && (
        <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">
          No settings match your search.
        </p>
      )}
    </div>
  );
}
