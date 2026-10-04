import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { loadBrand } from "@/core/email/render";
import { sanitiseBlocks } from "@/core/email/blocks";
import { ActionForm } from "@/components/ui/action-form";
import { TemplateMaker } from "./template-maker";
import { deleteEmailTemplate } from "../actions";
import { STARTER_TEMPLATES } from "@/core/email/starters";

export default async function Templates({ searchParams }: { searchParams: Promise<{ id?: string; starter?: string }> }) {
  const session = await requireSession();
  const q = await searchParams;
  const [templates, brand] = await Promise.all([
    db.emailTemplate.findMany({ where: { organisationId: session.organisationId }, orderBy: { updatedAt: "desc" } }),
    loadBrand(session.organisationId),
  ]);
  const current = templates.find((t) => t.id === q.id);
  const starter = STARTER_TEMPLATES.find((s) => s.key === q.starter);
  const initial = current
    ? { id: current.id, name: current.name, category: current.category, subject: current.subject, preheader: current.preheader, blocks: sanitiseBlocks(current.blocks) }
    : starter ? { id: "", name: starter.name, category: starter.category, subject: starter.subject, preheader: "", blocks: starter.blocks() } : null;
  return (
    <div className="space-y-8">
      <div><h2 className="text-2xl font-semibold tracking-tight">Email templates</h2><p className="mt-2 max-w-2xl text-sm text-slate-500">Build once, send everywhere. Every template is dressed in your company brand automatically: logo, colour and footer come from Brand settings.</p></div>
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your templates</p>
            {templates.map((t) => (
              <div key={t.id} className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${t.id === q.id ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}>
                <Link href={`/settings/it/templates?id=${t.id}`} className="min-w-0 flex-1 truncate">{t.name}<span className="block text-[11px] text-slate-400">{t.category.toLowerCase()}</span></Link>
                <ActionForm action={deleteEmailTemplate}><input type="hidden" name="id" value={t.id} /><button className="text-xs text-red-700" aria-label={`Delete ${t.name}`}>Delete</button></ActionForm>
              </div>
            ))}
            {!templates.length && <p className="text-sm text-slate-500">None yet. Start from a ready-made one.</p>}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start from</p>
            {STARTER_TEMPLATES.map((s) => <Link key={s.key} href={`/settings/it/templates?starter=${s.key}`} className="block rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:border-slate-300">{s.name}<span className="block text-[11px] text-slate-400">{s.hint}</span></Link>)}
            <Link href="/settings/it/templates?starter=blank" className="block rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm">Blank template</Link>
          </div>
        </aside>
        <TemplateMaker key={initial?.id || initial?.name || "blank"} initial={initial} brand={{ name: brand.name, accent: brand.accent, logoUrl: brand.logoUrl, letterhead: brand.letterhead, footer: brand.footer }} />
      </div>
    </div>
  );
}
