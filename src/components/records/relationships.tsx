import Link from "next/link";
import type { Session } from "@/core/auth/session";
import { loadRecordRelationships } from "@/core/relationships/load";
import type { RecordRef } from "@/core/relationships/types";

export async function RecordRelationships({ session, record }: { session: Session; record: RecordRef }) {
  const data = await loadRecordRelationships(session, record);
  if (!data) return null;
  return <section aria-label="Record relationships" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
    <div><h2 className="text-sm font-semibold">Related records</h2><p className="mt-1 text-xs text-slate-500">Follow the records behind this work and what it creates.</p></div>
    {!data.links.length && !data.unavailable && <p className="text-sm text-slate-500">No linked records visible with your access.</p>}
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {([['upstream', 'Upstream', 'Where this work came from'], ['downstream', 'Downstream', 'What this work supports'], ['related', 'Related', 'Shared business context']] as const).map(([direction, title, description]) => {
        const links = data.links.filter(link => link.direction === direction);
        if (!links.length) return null;
        return <div key={direction}><h3 className="text-xs font-semibold text-slate-700">{title}</h3><p className="mt-1 text-xs text-slate-500">{description}</p>
          {links.length ? <ul className="mt-3 space-y-2">{links.map(link => <li key={`${direction}:${link.href}`}><Link href={link.href} className="block rounded-xl border border-slate-100 px-3 py-2 hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600"><span className="block text-xs text-slate-500">{link.kind}</span><span className="mt-1 block break-words text-sm font-medium text-blue-700">{link.title} →</span>{link.detail && <span className="mt-1 block text-xs text-slate-600">{link.detail}</span>}</Link></li>)}</ul> : <p className="mt-3 text-xs text-slate-400">No linked records visible with your access.</p>}
        </div>;
      })}
    </div>
    {data.hasMore && <p className="text-xs text-slate-500">Showing up to 50 records of each type. Open the relevant workspace to see more.</p>}
    {data.unavailable && <p role="status" className="text-xs text-amber-800">Some related records could not be loaded. Refresh to try again.</p>}
  </section>;
}
