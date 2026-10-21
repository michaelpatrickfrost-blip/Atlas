import type { ReactNode } from "react";
import { AtlasLogo } from "@/components/shell/atlas-logo";

export function AuthFrame({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="atlas-auth-frame flex min-h-screen items-center justify-center px-5 py-12">
      <div className="atlas-auth-card w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <AtlasLogo full className="h-auto w-48 mix-blend-multiply" />
        </div>
        <h1 className="text-[34px] leading-tight text-[var(--color-ink)]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-5 text-[13px] text-[var(--color-ink-muted)]">{footer}</div>}
      </div>
    </div>
  );
}
