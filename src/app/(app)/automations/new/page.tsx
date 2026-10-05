import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { Builder } from "../builder";
import { TEMPLATES } from "@/modules/automations/engine/templates";

export default async function NewAutomation({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const session = await requireSession();
  const q = await searchParams;
  const template = TEMPLATES.find((t) => t.key === q.template);
  const [templates, surveys, accounts, audiences] = await Promise.all([
    db.emailTemplate.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true, category: true }, orderBy: { name: "asc" } }),
    db.csatSurvey.findMany({ where: { organisationId: session.organisationId, active: true }, select: { id: true, name: true } }),
    db.emailAccount.findMany({ where: { organisationId: session.organisationId, active: true }, select: { id: true, label: true } }),
    db.marketingAudience.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true } }),
  ]);
  return (
    <div className="mx-auto max-w-4xl">
      <Builder
        initial={template ? { id: "", name: template.name, description: template.description, triggerType: "EVENT", triggerEvent: template.triggerEvent, conditions: template.conditions, steps: template.steps, schedule: {} } : null}
        options={{ templates, surveys, accounts, audiences }}
      />
    </div>
  );
}
