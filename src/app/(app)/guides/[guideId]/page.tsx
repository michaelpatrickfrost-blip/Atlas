import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, CheckCircle2, BookOpen, Lightbulb } from 'lucide-react';
import { requireSession } from '@/core/auth/session';
import { getAccessibleModules } from '@/core/modules/runtime';
import { guideAppId } from '@/core/guides/library';
import { visibleGuides, canFollowStep } from '@/core/guides/catalogue';

export default async function GuidePage({ params }: { params: Promise<{ guideId: string }> }) {
  const session = await requireSession();
  const { guideId } = await params;
  const accessible = await getAccessibleModules(session);
  const modules = new Set(accessible.map(module => module.id));
  const available = visibleGuides(session.capabilities, modules);
  const guide = available.find(guide => guide.id === guideId);
  if (!guide) notFound();
  const appId = guideAppId(guide, accessible);
  const appName = accessible.find(module => module.id === appId)?.name ?? (appId === "customers" ? "Customers" : "Your workspace");
  const related = available.filter(item => item.id !== guide.id && guideAppId(item, accessible) === appId).slice(0, 3);
  return <article className="mx-auto max-w-6xl space-y-6 pb-8">
    <Link href={`/guides/apps/${appId}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-600"><ArrowLeft size={16} /> {appName} guides</Link>
    <header className="atlas-workspace-heading rounded-[28px] border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 p-6 sm:p-9"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600"><BookOpen size={16} /> {appName} · Working guide</p><h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">{guide.title}</h1><p className="mt-4 max-w-3xl text-base leading-7 text-slate-500">{guide.summary}</p><p className="mt-4 text-xs font-semibold text-slate-400">{guide.steps.length} steps · Task links open the source workspace</p></header>
    <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"><aside className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-5"><nav aria-label="On this page"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">On this page</p><ol className="mt-3 space-y-2 text-sm text-slate-600"><li><a className="inline-block py-1 hover:text-blue-600" href="#before">Before you start</a></li>{guide.steps.map((step, i) => <li key={step.title}><a href={`#step-${i + 1}`} className="block py-1 leading-6 hover:text-blue-600">{i + 1}. {step.title}</a></li>)}<li><a href="#outcome" className="inline-block py-1 hover:text-blue-600">What happens next</a></li><li><a href="#troubleshooting" className="inline-block py-1 hover:text-blue-600">If you get stuck</a></li>{guide.terms && <li><a href="#terms" className="inline-block py-1 hover:text-blue-600">Plain-language terms</a></li>}</ol></nav></aside>
      <div className="min-w-0 space-y-5"><section id="before" className="scroll-mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-6"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Lightbulb size={20} className="text-blue-600" /> Before you start</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">{guide.before.map(item => <li key={item}>{item}</li>)}</ul></section>
        <ol aria-label="Working steps" className="space-y-4">{guide.steps.map((step, index) => <li key={step.title} id={`step-${index + 1}`} className="scroll-mt-6 rounded-[22px] border border-slate-200 bg-white p-6 sm:p-7"><div className="flex gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">{index + 1}</span><div className="min-w-0"><h2 className="text-lg font-bold tracking-tight text-slate-900">{step.title}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{step.detail}</p>{step.example && <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4"><p className="text-xs font-bold text-blue-600">Worked example</p><p className="mt-2 text-sm leading-7 text-slate-600">{step.example}</p></div>}{step.check && <p className="mt-4 text-sm leading-6 text-emerald-700"><strong>Check:</strong> {step.check}</p>}{canFollowStep(step, session.capabilities, modules) && <Link href={step.href!} prefetch={false} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100">Open workspace <ArrowUpRight size={16} /></Link>}</div></div></li>)}</ol>
        <section id="outcome" className="scroll-mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><CheckCircle2 size={20} className="text-emerald-600" /> What happens next</h2><p className="mt-3 text-sm leading-7 text-slate-600">{guide.outcome}</p></section>
        <section id="troubleshooting" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-bold text-slate-900">If you get stuck</h2><div className="mt-3 divide-y divide-slate-100">{guide.troubleshoot.map(item => <details key={item.question} className="py-4"><summary className="cursor-pointer text-sm font-semibold text-slate-700">{item.question}</summary><p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p></details>)}</div></section>
        {guide.terms && <section id="terms" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-bold text-slate-900">Plain-language terms</h2><dl className="mt-4 space-y-4">{guide.terms.map(term => <div key={term.word}><dt className="text-sm font-bold text-blue-700">{term.word}</dt><dd className="mt-1 text-sm leading-7 text-slate-600">{term.meaning}</dd></div>)}</dl></section>}
      </div>
    </div>
    {!!related.length && <section><h2 className="mb-3 text-lg font-bold text-slate-800">Continue with a related task</h2><div className="grid gap-3 sm:grid-cols-3">{related.map(item => <Link key={item.id} href={`/guides/${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold leading-6 text-blue-600 hover:border-blue-300">{item.title} →</Link>)}</div></section>}
  </article>;
}
