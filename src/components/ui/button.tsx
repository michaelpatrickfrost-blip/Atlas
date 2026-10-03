import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-[var(--color-atlas-blue)] text-white shadow-none hover:bg-[var(--color-atlas-blue-hover)]",
  secondary: "bg-white text-[var(--color-ink)] border border-[var(--color-border)] shadow-sm hover:border-[var(--color-atlas-blue)] hover:text-[var(--color-atlas-blue)]",
  ghost: "bg-transparent text-[var(--color-ink-muted)] hover:bg-white/80 hover:text-[var(--color-ink)]",
  danger: "bg-[var(--color-status-danger)] text-white shadow-sm hover:brightness-110",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>(
  function Button({ className, variant = "secondary", ...props }, ref) {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-atlas-blue)]",
          VARIANT_CLASSES[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
