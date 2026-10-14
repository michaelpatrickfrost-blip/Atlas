import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, Search } from 'lucide-react';
import { requireSession } from '@/core/auth/session';
import { getAccessibleModules } from '@/core/modules/runtime';
import { guideApps, filterGuideApps, type GuideCategory } from '@/core/guides/library';
import { GuideCard } from '@/core/guides/guide-card';
export default async function AppGuides({ params, searchParams }: { params: Promise<{ appId: string }>; searchParams: Promise<{ q?: string; area?: string }> }) {
  const session = await requireSession();
  const { appId } = await params;
  const apps = guideApps(session.capabilities, await getAccessibleModules(session));
  const app = apps.find(app => app.id === appId);
  if (!app) notFound();
  const query = await searchParams;
  const search = typeof query.q === 'string' ? query.q.trim().slice(0, 120) : '';
  const area = typeof query.area === 'string' && apps.some(entry => entry.guides.some(guide => guide.area === query.area)) ? query.area : '';
  const results = filterGuideApps([app], { q: search, area })[0]?.guides ?? [];
  const backParams = new URLSearchParams(); if (area) backParams.set('area', area); if (search) backParams.set('q', search);
  const backHref = `/guides${backParams.size ? `?${backParams}` : ''}`;
  const categories: GuideCategory[] = ['Setup', 'Daily work', 'Troubleshooting'];
  return <div className="mx-auto max-w-6xl space-y-6 pb-8"><Link href={backHref} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft size={16} /> Guides by app</Link><header className="atlas-workspace-heading rounded-[28px] border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 p-6 sm:p-9"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600"><BookOpen size={16} /> App guides</p><h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{app.name}</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{app.description} Start with preparation, follow the task and check the result.</p>{area && <p className="mt-3 text-sm text-slate-500">{results.length} {area} {results.length === 1 ? 'guide' : 'guides'} · <Link href={`/guides/apps/${app.id}`} className="font-semibold text-blue-600">All {app.name} guides</Link></p>}<form className="mt-5 flex max-w-2xl flex-wrap gap-2">{area && <input type="hidden" name="area" value={area}/>}<label className="relative min-w-0 flex-1"><span className="sr-only">Search {app.name} guides</span><Search size={18} className="absolute left-4 top-3.5 text-slate-400" aria-hidden="true" /><input name="q" type="search" defaultValue={search} placeholder={`Search ${app.name} guides`} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm" /></label><button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white">Search</button></form></header><nav aria-label="App guide sections" className="flex flex-wrap gap-2">{categories.filter(category => results.some(guide => guide.category === category)).map(category => <a key={category} href={`#${category.toLowerCase().replaceAll(' ', '-')}`} className="rounded-full border border-blue-100 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600">{category}</a>)}</nav>{categories.map(category => { const guides = results.filter(guide => guide.category === category); return guides.length ? <section key={category} id={category.toLowerCase().replaceAll(' ', '-')} className="scroll-mt-6 space-y-3"><h2 className="text-xl font-bold text-slate-900">{category}</h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{guides.map(guide => <GuideCard key={guide.id} guide={guide} />)}</div></section> : null; })}{!results.length && <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No matching task. Try a simpler phrase or <Link className="font-semibold text-blue-600" href={`/guides/apps/${app.id}`}>browse all {app.name} guides</Link>.</p>}</div>;
}
