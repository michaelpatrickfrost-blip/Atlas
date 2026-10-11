import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { GuideLibraryEntry } from './library';
export function GuideCard({ guide }: { guide: GuideLibraryEntry }) {
  return <Link href={guide.href} className="group flex min-w-0 flex-col rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_8px_28px_-24px_rgba(34,62,104,.3)] transition hover:border-blue-300 hover:shadow-sm"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-blue-600">{guide.category}</span><ArrowUpRight size={17} className="shrink-0 text-slate-400 group-hover:text-blue-600" aria-hidden="true" /></div><h3 className="mt-3 text-lg font-bold leading-7 tracking-tight text-slate-900">{guide.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{guide.summary}</p><p className="mt-auto pt-5 text-xs font-semibold text-slate-400">{guide.steps ? `${guide.steps} steps · ` : ''}Preparation, checks & help</p></Link>;
}
