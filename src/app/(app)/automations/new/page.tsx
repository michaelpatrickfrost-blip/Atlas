import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { Builder } from "../builder";
import { TEMPLATES } from "@/modules/automations/engine/templates";
import { csatTemplate } from "@/modules/csat/domain/templates";

export default async function NewAutomation({ searchParams }: { searchParams: Promise<{ template?: string; survey?: string }> }) {
  const session = await requireSession();
  const q = await searchParams;
  const template = TEMPLATES.find((t) => t.key === q.template);
  const [templates, surveys, accounts, audiences] = await Promise.all([
    db.emailTemplate.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true, category: true }, orderBy: { name: "asc" } }),
    db.csatSurvey.findMany({ where: { organisationId: session.organisationId, active: true }, select: { id: true, name: true } }),
    db.emailAccount.findMany({ where: { organisationId: session.organisationId, active: true }, select: { id: true, label: true } }),
    db.marketingAudience.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true } }),
  ]);
  // Arriving from a CSAT survey: the trigger, the wait and the survey step are filled in.
  const survey = q.survey ? await db.csatSurvey.findFirst({ where: { id: q.survey, organisationId: session.organisationId, active: true }, select: { id: true, name: true, context: true } }) : null;
  const preset = survey ? csatTemplate(survey.context) : undefined;
  const fromSurvey = survey ? { id: "", name: `${survey.name}: send the survey`, description: preset ? `Sends the "${survey.name}" survey ${preset.attach.sentence}.` : `Sends the "${survey.name}" survey.`, triggerType: "EVENT", triggerEvent: preset?.attach.triggerEvent ?? "", conditions: preset?.attach.conditions ?? [], steps: [...(preset?.attach.waitDays ? [{ id: "w", type: "wait", params: { amount: String(preset.attach.waitDays), unit: "days" } }] : []), { id: "s", type: "send_csat", params: { to: "contact", survey: survey.id } }], schedule: {} } : null;
  return (
    <div className="mx-auto max-w-4xl">
      <Builder
        initial={fromSurvey ? fromSurvey as never : template ? { id: "", name: template.name, description: template.description, triggerType: "EVENT", triggerEvent: template.triggerEvent, conditions: template.conditions, steps: template.steps, schedule: {} } : null}
        options={{ templates, surveys, accounts, audiences }}
      />
    </div>
  );
}
