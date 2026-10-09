import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

export function WorkspaceHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-5 sm:p-7">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function WorkspaceStats({
  items,
}: {
  items: {
    label: string;
    value: string | number;
    hint?: string;
    icon: LucideIcon;
  }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, hint, icon: Icon }) => (
        <div
          key={label}
          className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <Icon size={17} className="shrink-0 text-blue-500" aria-hidden />
          </div>
          <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
      ))}
    </div>
  );
}

export function WorkspaceLinks({
  items,
}: {
  items: {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
  }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ title, description, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
        >
          <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <Icon size={19} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">
              {title}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-500">
              {description}
            </span>
          </span>
          <ArrowUpRight
            size={15}
            className="shrink-0 text-slate-300 group-hover:text-blue-600"
            aria-hidden
          />
        </Link>
      ))}
    </div>
  );
}
