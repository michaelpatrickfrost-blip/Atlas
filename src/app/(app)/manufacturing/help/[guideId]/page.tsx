import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { SUPPLY_GUIDES } from "@/modules/manufacturing/domain/guides";
import { supplyNavigation } from "@/modules/manufacturing/services/console";
export default async function Guide({ params }: { params: Promise<{ guideId: string }> }) {
  const { guideId } = await params;
  const guide = SUPPLY_GUIDES.find((item) => item.id === guideId);
  if (!guide) notFound();
  const session = await requireSession();
  const { destinations } = await supplyNavigation(session);
  const links = destinations.filter((item) => guide.destinations.includes(item.id));
  return <article className="mx-auto w-full max-w-5xl space-y-6"><Link href="/manufacturing/help" className="text-sm font-medium text-blue-600">← How-to library</Link><header><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">{guide.role} · working instructions</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">{guide.title}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{guide.summary}</p></header><figure className="overflow-hidden rounded-[24px] border border-blue-100 bg-white"><Image src={`/guides/manufacturing/${guide.image}.svg`} width={1120} height={520} alt={guide.alt} className="h-auto w-full" unoptimized /><figcaption className="border-t border-blue-50 px-5 py-3 text-xs text-slate-500">Workflow illustration · use the linked workspaces below for your company&apos;s records.</figcaption></figure><section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5"><h3 className="text-sm font-semibold">Before you start</h3><p className="mt-2 text-sm leading-6 text-slate-600">{guide.before}</p></section><ol className="space-y-4">{guide.steps.map((step, index) => <li key={step.title} className="rounded-[22px] border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-600">{index + 1}</span><div className="min-w-0"><h3 className="text-base font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{step.instruction}</p><p className="mt-4 flex items-start gap-2 text-xs leading-5 text-emerald-700"><CheckCircle2 size={15} className="mt-0.5 shrink-0" /><span><strong>Check:</strong> {step.check}</span></p></div></div></li>)}</ol><section className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5"><h3 className="text-sm font-semibold">Exceptions and things to check</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">{guide.exceptions.map((text) => <li key={text}>{text}</li>)}</ul></section><nav aria-label="Open guide workspaces" className="flex flex-wrap gap-2">{links.map((item) => <Link key={item.id} href={item.href} className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700">Open {item.label} →</Link>)}</nav></article>;
}
