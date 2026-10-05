import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { CSAT_CAPABILITIES } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { CreateDialog } from "@/components/ui/create-dialog";
import { StatusPill } from "@/components/ui/status-pill";
import { createSurveyFromTemplate, saveSurvey } from "@/modules/csat/services/actions";
import { CSAT_TEMPLATES } from "@/modules/csat/domain/templates";
import { SurveyFields } from "@/modules/csat/components/survey-fields";

export default async function CsatSurveys() {
  const session = await requireSession();
  assertCapability(session, CSAT_CAPABILITIES.manage);
  const organisationId = session.organisationId;
  const [surveys, stats, automations] = await Promise.all([
    db.csatSurvey.findMany({ where: { organisationId }, orderBy: { createdAt: "desc" } }),
    db.csatResponse.groupBy({ by: ["surveyId"], where: { organisationId }, _count: { _all: true, score: true }, _avg: { score: true } }),
    db.automation.findMany({ where: { organisationId }, select: { id: true, steps: true, enabled: true } }),
  ]);
  const used = (id: string) => automations.filter((automation) => JSON.stringify(automation.steps).includes(id));
  const have = new Set(surveys.map((survey) => survey.context));
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-2xl font-semibold tracking-tight">Surveys</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Each survey is one question with a 1 to 5 score, reasons to tick and a follow-up. Start from a template, make it yours, then attach it to an automation so it sends itself.</p></div>
      <CreateDialog label="Blank survey" title="New survey" variant="secondary"><ActionForm action={saveSurvey}><div className="space-y-5"><SurveyFields /><Button type="submit" variant="primary">Create survey</Button></div></ActionForm></CreateDialog>
    </div>

    <section>
      <h3 className="mb-3 text-sm font-semibold">Your surveys</h3>
      {!surveys.length ? <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No surveys yet. Pick a template below to make your first one.</p> : <div className="grid gap-3 lg:grid-cols-2">{surveys.map((survey) => {
        const stat = stats.find((row) => row.surveyId === survey.id), linked = used(survey.id);
        return <Link key={survey.id} href={`/csat/surveys/${survey.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300">
          <div className="flex items-start justify-between gap-3"><p className="font-semibold">{survey.name}</p><StatusPill label={!survey.active ? "Off" : linked.some((row) => row.enabled) ? "Sending" : "Not attached"} tone={!survey.active ? "neutral" : linked.some((row) => row.enabled) ? "success" : "warning"} /></div>
          <p className="mt-1 text-sm text-slate-600">{survey.question}</p>
          <p className="mt-3 text-xs text-slate-500">{stat?._count._all ?? 0} sent · {stat?._count.score ?? 0} answered{stat?._avg.score ? ` · ${stat._avg.score.toFixed(1)} / 5` : ""} · {survey.reasons.length} reasons · {linked.length ? `${linked.length} automation${linked.length === 1 ? "" : "s"}` : "no automation yet"}</p>
        </Link>;
      })}</div>}
    </section>

    <section>
      <h3 className="mb-1 text-sm font-semibold">Templates</h3>
      <p className="mb-3 text-xs text-slate-500">Written for a trade business. Each comes with the email, the reasons and the follow-up for unhappy customers already filled in.</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{CSAT_TEMPLATES.map((template) => <div key={template.key} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-2"><p className="font-semibold">{template.name}</p>{have.has(template.key) && <StatusPill label="Added" tone="success" />}</div>
        <p className="mt-1 text-xs text-slate-500">{template.when}</p>
        <p className="mt-3 text-sm text-slate-700">“{template.question}”</p>
        <p className="mt-2 flex-1 text-xs leading-5 text-slate-500">{template.reasons.join(" · ")}</p>
        <ActionForm action={createSurveyFromTemplate} className="mt-4"><input type="hidden" name="template" value={template.key} /><Button type="submit" variant={have.has(template.key) ? "secondary" : "primary"}>{have.has(template.key) ? "Add another copy" : "Use this template"}</Button></ActionForm>
      </div>)}</div>
    </section>
  </div>;
}
