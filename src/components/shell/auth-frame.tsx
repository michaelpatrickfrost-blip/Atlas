import type { ReactNode } from "react";
import { AtlasLogo } from "@/components/shell/atlas-logo";

export function AuthFrame({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <img src="/brand/atlas-icon.png" alt="" className="size-9 shrink-0" />
          <AtlasLogo className="h-6 w-auto" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-[#6e6e73]">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-5 text-[13px] text-[#6e6e73]">{footer}</div>}
      </div>
    </div>
  );
}
