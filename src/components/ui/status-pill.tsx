import clsx from "clsx";

export type StatusTone = "success" | "warning" | "danger" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-[var(--color-status-success-soft)] text-[var(--color-status-success)]",
  warning: "bg-[var(--color-status-warning-soft)] text-[var(--color-status-warning)]",
  danger: "bg-[var(--color-status-danger-soft)] text-[var(--color-status-danger)]",
  neutral: "bg-[var(--color-status-neutral-soft)] text-[var(--color-status-neutral)]",
};

/** Concise status label with meaningful colour. Red is reserved for genuine problems —
 *  callers must pick `tone` deliberately rather than defaulting to danger. */
export function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", TONE_CLASSES[tone])}>
      {label}
    </span>
  );
}
