import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { assertCapability, can } from "@/core/permissions/check";
import { CSAT_CAPABILITIES } from "@/core/permissions/capabilities";
import { loadBrand } from "@/core/email/render";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { deleteSurvey, saveSurvey, setSurveyActive } from "@/modules/csat/services/actions";
import { csatTemplate } from "@/modules/csat/domain/templates";
import { SurveyFields } from "@/modules/csat/components/survey-fields";
import { CsatForm } from "@/app/csat/[token]/form";

const panel = "rounded-2xl border border-slate-200 bg-white p-5";

export default async function SurveyPage({ params }: { params: Promise<{ surveyId: string }> }) {
  const session = await requireSession();
  assertCapability(session, CSAT_CAPABILITIES.manage);
  const { surveyId } = await params, organisationId = session.organisationId;
  const survey = await db.csatSurvey.findFirst({ where: { id: surveyId, organisationId } });
  if (!survey) notFound();
  const [brand, sent, answered, automations] = await Promise.all([
    loadBrand(organisationId),
    db.csatResponse.count({ where: { organisationId, surveyId } }),
    db.csatResponse.aggregate({ where: { organisationId, surveyId, score: { not: null } }, _count: { _all: true }, _avg: { score: true } }),
    db.automation.findMany({ where: { organisationId }, select: { id: true, name: true, enabled: true, steps: true } }),
  ]);
  const linked = automations.filter((automation) => JSON.stringify(automation.steps).includes(survey.id));
  const template = csatTemplate(survey.context), canAutomate = can(session, "automations.rule.manage");
  return <div className="space-y-5">
    <Link href="/csat/surveys" className="text-xs text-slate-500">← All surveys</Link>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="flex flex-wrap items-center gap-3 text-2xl font-semibold tracking-tight">{survey.name}<StatusPill label={survey.active ? "On" : "Off"} tone={survey.active ? "success" : "neutral"} /></h2><p className="mt-1 text-sm text-slate-500">{sent} sent · {answered._count._all} answered{answered._avg.score ? ` · average ${answered._avg.score.toFixed(1)} / 5` : ""}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/csat?survey=${survey.id}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">See results</Link>
        <ActionForm action={setSurveyActive}><input type="hidden" name="id" value={survey.id} /><input type="hidden" name="active" value={String(!survey.active)} /><button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">{survey.active ? "Turn off" : "Turn on"}</button></ActionForm>
      </div>
    </div>

    <section className={panel}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-sm font-semibold">When it sends</h3><p className="mt-1 text-xs text-slate-500">A survey sends itself from an automation. {template ? `This one is designed to go ${template.attach.sentence}.` : "Choose what triggers it in Automations."}</p></div>
        {canAutomate && survey.active && <Link href={`/automations/new?survey=${survey.id}`} className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700">{linked.length ? "Attach to another automation" : "Attach to an automation"}</Link>}
      </div>
      {linked.length ? <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">{linked.map((automation) => <li key={automation.id} className="flex items-center justify-between gap-3 py-3"><Link href={`/automations/${automation.id}`} className="text-sm font-medium text-blue-700">{automation.name}</Link><StatusPill label={automation.enabled ? "Running" : "Switched off"} tone={automation.enabled ? "success" : "warning"} /></li>)}</ul> : <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Not attached yet, so nobody is being asked. {survey.active ? "Attach it to start sending." : "Turn the survey on, then attach it."}</p>}
    </section>

    <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
      <section className={panel}><h3 className="mb-4 text-sm font-semibold">Edit survey</h3><ActionForm action={saveSurvey}><div className="space-y-5"><input type="hidden" name="id" value={survey.id} /><SurveyFields survey={survey} /><Button type="submit" variant="primary">Save survey</Button></div></ActionForm></section>
      <div className="space-y-5">
        <section className={panel}>
          <h3 className="text-sm font-semibold">What the customer sees</h3><p className="mt-1 text-xs text-slate-500">Try it: tap a score. Nothing is saved from this preview. Save your edits to refresh it.</p>
          <div className="mt-4 rounded-2xl bg-slate-100 p-4"><div className="rounded-2xl bg-white p-6" style={{ borderTop: `3px solid ${brand.accent}` }}><p className="mb-4 text-sm font-bold">{brand.name}</p><CsatForm preview token="" accent={brand.accent} survey={{ question: survey.question, followUpQuestion: survey.followUpQuestion, lowFollowUpQuestion: survey.lowFollowUpQuestion, thanksText: survey.thanksText, lowLabel: survey.lowLabel, highLabel: survey.highLabel, reasons: survey.reasons }} /></div></div>
        </section>
        <section className={panel}>
          <h3 className="text-sm font-semibold">The email</h3>
          <p className="mt-3 text-xs text-slate-500">Subject</p><p className="text-sm font-medium">{survey.emailSubject || survey.question}</p>
          <p className="mt-3 text-xs text-slate-500">Message</p><p className="whitespace-pre-wrap text-sm text-slate-700">{survey.emailIntro || "Hello {{contact.firstName}},\n\nWe would value your view. It takes one tap."}</p>
          <p className="mt-3 text-xs text-slate-500">Then the question with five buttons, 1 ({survey.lowLabel.toLowerCase()}) to 5 ({survey.highLabel.toLowerCase()}), in your brand. An automation can use one of your email templates instead.</p>
        </section>
        {!sent && <section className={panel}><h3 className="text-sm font-semibold">Delete survey</h3><p className="mt-2 text-xs text-slate-500">Only possible before it has been sent to anyone.</p><ActionForm action={deleteSurvey}><input type="hidden" name="id" value={survey.id} /><Button type="submit" variant="danger" className="mt-3">Delete survey</Button></ActionForm></section>}
      </div>
    </div>
  </div>;
}
