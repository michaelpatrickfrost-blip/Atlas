import Link from "next/link";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">{children}</h2>;
}

export function Panel({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white">{children}</div>;
}

export function Row({ href, title, meta, tone }: { href: string; title: string; meta?: string; tone?: "stop" | "attention" | "verified" | "active" }) {
  const colour = tone === "stop" ? "text-rose-700" : tone === "attention" ? "text-amber-700" : tone === "verified" ? "text-emerald-700" : tone === "active" ? "text-[var(--color-atlas-blue)]" : "text-[var(--color-ink-muted)]";
  return (
    <Link href={href} className="flex items-start justify-between gap-4 px-5 py-4 text-sm hover:bg-[var(--color-surface-sunken)]">
      <span className="font-medium">{title}</span>
      {meta && <span className={`shrink-0 ${colour}`}>{meta}</span>}
    </Link>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm"><span className="text-[var(--color-ink-muted)]">{label}</span><span className="mt-1 block">{children}</span></label>;
}

export const inputClass = "w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm";

export function Quiet({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">{children}</p>;
}
