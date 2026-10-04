import Link from "next/link";
import { loadEchoInbox } from "@/modules/audit/services/actions";

export default async function EchoInboxPage() {
  const items = await loadEchoInbox();
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Echo</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-muted)]">Notes that point you at a customer, order or sale. Open the record to reply.</p>
      </div>
      <section className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
        {items.map((item) => (
          <article key={item.id} className={`px-5 py-4 ${item.seen ? "" : "bg-blue-50/50"}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="text-sm font-medium">{item.author} pointed you at {item.title}</p>
              <time className="text-xs text-slate-400">{new Date(item.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            {item.href ? <Link href={item.href} className="mt-3 inline-block text-sm text-blue-700">Open the record</Link> : <p className="mt-3 text-xs text-slate-400">You cannot open this record.</p>}
          </article>
        ))}
        {!items.length && <p className="px-5 py-10 text-sm text-slate-500">Nobody has pointed you at a record yet. Echo lives on customers, orders, quotations and call-offs.</p>}
      </section>
    </div>
  );
}
