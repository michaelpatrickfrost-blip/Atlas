import type { ReactNode } from "react";
import { AtlasLogo } from "@/components/shell/atlas-logo";

export function AuthFrame({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
      <section className="relative hidden overflow-hidden bg-[#0c1222] text-white lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_0%,rgba(99,124,255,0.45),transparent_55%),radial-gradient(50%_40%_at_90%_80%,rgba(14,159,142,0.25),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <img src="/brand/atlas-icon.png" alt="" className="size-16 shrink-0" />
          <AtlasLogo onDark className="h-8 w-auto" />
        </div>
        <div className="relative max-w-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-200">Business operating system</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight">The calm way to run a whole company.</h1>
          <p className="mt-5 text-base leading-relaxed text-slate-300">Customers, people, money, stock and the work between them — one workspace, your logo, your team.</p>
        </div>
        <p className="relative text-xs text-slate-500">Desktop software. Shared company data stays on your server.</p>
      </section>
      <section className="flex items-center justify-center bg-[#eef2f8] px-5 py-12">
        <div className="w-full max-w-md">
          <AtlasLogo className="mb-8 h-10 w-auto lg:hidden" />
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-slate-500">{footer}</div>
        </div>
      </section>
    </div>
  );
}
