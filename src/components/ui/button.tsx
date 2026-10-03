import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-[var(--color-atlas-blue)] text-white hover:bg-[var(--color-atlas-blue-hover)]",
  secondary: "bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border-strong)] hover:border-[var(--color-ink-faint)]",
  ghost: "bg-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]",
  danger: "bg-[var(--color-status-danger)] text-white hover:opacity-90",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>(
  function Button({ className, variant = "secondary", ...props }, ref) {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-atlas-sm)] px-3.5 py-2 text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-atlas-blue)]",
          VARIANT_CLASSES[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
