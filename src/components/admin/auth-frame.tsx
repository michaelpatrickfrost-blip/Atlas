import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { AtlasLogo } from "@/components/shell/atlas-logo";

export function AdminAuthFrame({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#f4f7fc] px-5 py-10 sm:py-16">
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,#dbeafe_0%,transparent_70%)]" />
    <section className="relative w-full max-w-[440px] rounded-3xl border border-white bg-white p-7 shadow-[0_24px_80px_-24px_rgba(30,58,138,0.22)] sm:p-10">
      <AtlasLogo className="mb-9 h-auto w-36" />
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"><ShieldCheck size={14} aria-hidden="true" />Administration</div>
      <h1 className="text-[28px] font-semibold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
      <div className="mt-7">{children}</div>
      <div className="mt-7 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-500">{footer ?? "Authorised Atlas staff only."}</div>
    </section>
  </main>;
}
