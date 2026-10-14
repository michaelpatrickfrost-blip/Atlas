import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "atlas-button-primary text-white",
  secondary: "atlas-button-secondary text-[var(--color-ink)]",
  ghost: "atlas-button-ghost text-[var(--color-ink-muted)]",
  danger: "atlas-button-danger text-white",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>(
  function Button({ className, variant = "secondary", ...props }, ref) {
    return (
      <button
        ref={ref}
        className={clsx(
          "atlas-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-atlas-blue)]",
          VARIANT_CLASSES[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
