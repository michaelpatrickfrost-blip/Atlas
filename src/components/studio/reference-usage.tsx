import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Link2 } from "lucide-react";
import type { ReferenceUsageModel } from "@/core/studio/authoring/reference-navigation";

export function ReferenceUsagePanel({ model, workspaceHref }: { model: ReferenceUsageModel; workspaceHref: string }) {
  return <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
    <Link href={workspaceHref} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4"/>Back to Studio</Link>
    <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-semibold text-blue-600">Where used</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{model.name}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Saved screens and business setup that refer to this version. Only designs you can access are shown.</p>
        {model.retired && <p className="mt-2 text-sm text-amber-700">This source has been retired. Its saved references are kept for review.</p>}</div>
      {!model.retired && model.sourceHref && <Link href={model.sourceHref} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-300">Go to source<ArrowUpRight className="h-4 w-4"/></Link>}
    </header>
    <section aria-label="Saved references" className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {model.usages.length === 0 ? <div className="px-6 py-10 text-center"><Link2 className="mx-auto h-6 w-6 text-slate-400"/><h2 className="mt-3 font-semibold text-slate-800">No accessible references on this page</h2><p className="mt-1 text-sm text-slate-500">Published and retained versions appear here when they use this source.</p></div>
        : <ul className="divide-y divide-slate-100">{model.usages.map((item, index) => <li key={`${item.href}:${index}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0"><p className="break-words font-semibold text-slate-800">{item.name}</p><p className="mt-1 text-sm text-slate-500">{item.kind} · {item.status} · {item.direct ? "Uses this source" : "Uses a design linked to this source"}</p></div>
          {item.status !== "Retired" && item.href && <Link href={item.href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800">Open design<ArrowUpRight className="h-4 w-4"/></Link>}
        </li>)}</ul>}
    </section>
    {model.nextHref && <div className="mt-5 flex justify-end"><Link href={model.nextHref} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">More references</Link></div>}
    {model.logicalUsages !== undefined && <section aria-label="Screens using this business type" className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">Screens using this business type in conditions</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">These visibility rules choose the business type itself, independently of its published version. They are separate from the saved-version references above.</p>
      {model.logicalUsages.length ? <ul className="mt-4 divide-y divide-slate-100">{model.logicalUsages.map((item, index) => <li key={`${item.href}:${item.version}:${index}`} className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div><p className="font-semibold text-slate-800">{item.name}</p><p className="mt-1 text-sm text-slate-500">Screen · Version {item.version} · {item.status} · Uses this type in a condition</p></div>
        {item.href && <Link href={item.href} className="text-sm font-semibold text-blue-600">Go to source · current draft</Link>}
      </li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No accessible saved screen conditions use this business type.</p>}
      {model.logicalNextHref && <div className="mt-4 flex justify-end"><Link href={model.logicalNextHref} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">More screen conditions</Link></div>}
    </section>}
    <p className="mt-5 text-xs leading-5 text-slate-500">This review covers saved configuration references. Draft changes and individual business records are not included.</p>
  </main>;
}
