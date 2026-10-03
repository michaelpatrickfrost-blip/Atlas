import clsx from "clsx";
import type { HTMLAttributes } from "react";

/** Use sparingly — prefer page surfaces with borders/spacing. A Card exists only
 *  where grouping genuinely improves comprehension (see docs/DESIGN_SYSTEM.md). */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        className,
      )}
      {...props}
    />
  );
}
