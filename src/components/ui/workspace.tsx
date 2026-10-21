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
    <div className="atlas-workspace-heading flex flex-wrap items-end justify-between gap-5 border-b border-[var(--color-border)] pb-6 pt-2">
      <div className="max-w-2xl">
        <p className="text-[12px] font-medium text-[var(--color-ink-faint)]">
          {eyebrow}
        </p>
        <h2 className="atlas-serif mt-1.5 text-[30px] leading-[1.1] text-[var(--color-ink)] sm:text-[40px]">
          {title}
        </h2>
        <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--color-ink-muted)]">
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
    <div className="atlas-stat-row grid grid-cols-2 lg:grid-cols-4">
      {items.map(({ label, value, hint, icon: Icon }) => (
        <div
          key={label}
          className="atlas-stat-cell min-w-0 px-1 py-4 sm:px-5 sm:py-5"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] text-[var(--color-ink-muted)]">{label}</p>
            <Icon size={15} className="shrink-0 text-[var(--color-ink-faint)]" aria-hidden />
          </div>
          <p className="atlas-serif mt-2 break-words text-[34px] leading-none text-[var(--color-ink)]">
            {value}
          </p>
          {hint && <p className="mt-2 text-[12px] text-[var(--color-ink-faint)]">{hint}</p>}
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
          className="atlas-workspace-link group flex min-w-0 items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        >
          <span className="rounded-lg p-2">
            <Icon size={18} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium text-[var(--color-ink)]">
              {title}
            </span>
            <span className="mt-1 block text-[12px] leading-relaxed text-[var(--color-ink-muted)]">
              {description}
            </span>
          </span>
          <ArrowUpRight
            size={15}
            className="shrink-0 text-[var(--color-ink-faint)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-ink)]"
            aria-hidden
          />
        </Link>
      ))}
    </div>
  );
}
