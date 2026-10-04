export const fieldClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none ring-blue-500 placeholder:text-slate-400 focus:ring-2";

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return <label className={`block text-sm font-medium text-slate-800 ${className}`}>{label}{hint && <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{hint}</span>}{children}</label>;
}

export function FormSection({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="text-lg font-semibold tracking-tight">{title}</h3>{intro && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{intro}</p>}<div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div></section>;
}

export function RecordIntro({ kicker, title, detail }: { kicker: string; title: string; detail: string }) {
  return <div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-blue-600">{kicker}</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{detail}</p></div>;
}
