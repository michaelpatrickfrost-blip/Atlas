import Link from 'next/link';
import type { NativeReferenceModel } from '@/core/studio/authoring/native-reference-navigation';

export function NativeReferencePanel({ model, workspaceHref }: { model: NativeReferenceModel; workspaceHref: string }) {
  return <main className="mx-auto max-w-5xl px-5 py-8 sm:px-9">
    <Link href={workspaceHref} className="text-sm text-blue-700">← Business design studio</Link>
    <header className="mt-6 rounded-3xl border border-blue-100 bg-white p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">{model.owner} · {model.category}</p>
      <h1 className="mt-3 text-2xl font-semibold">{model.name}</h1>
      <p className="mt-3 text-sm text-slate-600">Approved app version {model.version}{model.detail ? ` · ${model.detail}` : ''}</p>
      <p className="mt-4 text-sm leading-6 text-slate-500">This is an approved part of the app. The owning app defines its behavior and permissions. This review does not edit native business rules or run an operation.</p>
      <nav aria-label="App reference review" className="mt-5 flex flex-wrap gap-4 text-sm font-medium">
        <Link href={model.sourceHref} aria-current={!model.usage ? 'page' : undefined}>Go to source</Link>
        <Link href={model.whereUsedHref} aria-current={model.usage ? 'page' : undefined}>Where used</Link>
      </nav>
    </header>
    {model.usage && <section aria-label="Saved designs using this app reference" className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
      <h2 className="text-lg font-semibold">Saved designs using this app reference</h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">This shows permitted screens, business setups, business types, dashboards and additional fields linked to this exact app capability. A capability can provide several details; this is not a count of individual fields or business records. Drafts and foundation reference sets are outside this review.</p>
      {!model.usages.length ? <p className="mt-5 text-sm text-slate-600">No permitted saved designs in this page of the review.</p>
        : <ul className="mt-5 space-y-3">{model.usages.map((item, index) => <li key={index} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
          <div><p className="font-medium">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.kind} · {item.status}</p></div>
          {item.href && <Link href={item.href} className="text-sm font-medium text-blue-700">Open current draft</Link>}
        </li>)}</ul>}
      {model.nextHref && <div className="mt-5 flex justify-end"><Link href={model.nextHref} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium">More references</Link></div>}
    </section>}
  </main>;
}
