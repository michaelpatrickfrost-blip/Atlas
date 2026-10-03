import clsx from "clsx";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-atlas)]",
        className,
      )}
      {...props}
    />
  );
}
