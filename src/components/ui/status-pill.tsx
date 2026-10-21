import clsx from "clsx";

export type StatusTone = "success" | "warning" | "danger" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-[var(--color-status-success-soft)] text-[var(--color-status-success)]",
  warning: "bg-[var(--color-status-warning-soft)] text-[var(--color-status-warning)]",
  danger: "bg-[var(--color-status-danger-soft)] text-[var(--color-status-danger)]",
  neutral: "bg-[var(--color-status-neutral-soft)] text-[var(--color-status-neutral)]",
};

export function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span className={clsx("atlas-status-pill inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium", TONE_CLASSES[tone])}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
