import Link from "next/link";
import { ClipboardList, MessageCircle } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { IconChip } from "@/components/ui/icon-chip";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { CORE_CAPABILITIES, HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { updateHrSettings, createAppraisalTemplate, toggleAppraisalTemplateActive, createOneToOneTemplate, toggleOneToOneTemplateActive } from "./actions";

export default async function HrSettingsPage() {
  const session = await requireSession();
  const companyAdmin = can(session, CORE_CAPABILITIES.modulesManage);
  const canAppraisalTemplates = can(session, HR_CAPABILITIES.appraisalManage);
  const canOneToOneTemplates = can(session, HR_CAPABILITIES.oneToOneManage);
  if (!companyAdmin && !can(session, HR_CAPABILITIES.employeeManage) && !canAppraisalTemplates && !canOneToOneTemplates) assertCapability(session, HR_CAPABILITIES.employeeManage);
  const [org, appraisalTemplates, oneToOneTemplates] = await Promise.all([
    db.organisation.findUniqueOrThrow({
      where: { id: session.organisationId },
      select: { hrAppraisalCadenceMonths: true, hrOneToOneCadenceWeeks: true, hrStandardWeeklyHours: true, hrOvertimeMultiplier: true },
    }),
    canAppraisalTemplates ? db.appraisalTemplate.findMany({ where: { organisationId: session.organisationId }, orderBy: { createdAt: "desc" } }) : [],
    canOneToOneTemplates ? db.oneToOneTemplate.findMany({ where: { organisationId: session.organisationId }, orderBy: { createdAt: "desc" } }) : [],
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      {companyAdmin && <Link href="/settings?tab=workspace" className="text-xs font-medium text-[#0071e3]">Company administration</Link>}
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <h2 className="text-lg font-semibold">Company defaults</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Appraisal timing, weekly hours and overtime pay for the whole company. A company administrator changes these. An employee record can still set its own contracted hours.</p>
        {companyAdmin ? (
          <ActionForm action={updateHrSettings} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">Appraisal cadence (months)<input type="number" min="1" name="hrAppraisalCadenceMonths" defaultValue={org.hrAppraisalCadenceMonths} className="mt-2 w-full p-3" /></label>
            <label className="text-sm">One-to-one cadence (weeks)<input type="number" min="1" name="hrOneToOneCadenceWeeks" defaultValue={org.hrOneToOneCadenceWeeks} className="mt-2 w-full p-3" /></label>
            <label className="text-sm">Standard weekly hours<input type="number" min="1" step="0.5" name="hrStandardWeeklyHours" defaultValue={org.hrStandardWeeklyHours} className="mt-2 w-full p-3" /></label>
            <label className="text-sm">Overtime multiplier<input type="number" min="1" step="0.1" name="hrOvertimeMultiplier" defaultValue={org.hrOvertimeMultiplier} className="mt-2 w-full p-3" /></label>
            <p className="text-xs text-[var(--color-ink-muted)] sm:col-span-2">Confirmed rota hours over the standard threshold in a pay period are paid at the overtime multiplier.</p>
            <Button type="submit" variant="primary" className="justify-self-start sm:col-span-2">Save company defaults</Button>
          </ActionForm>
        ) : (
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            {[["Appraisal cadence", `${org.hrAppraisalCadenceMonths} months`], ["One-to-one cadence", `${org.hrOneToOneCadenceWeeks} weeks`], ["Standard weekly hours", String(org.hrStandardWeeklyHours)], ["Overtime multiplier", String(org.hrOvertimeMultiplier)]].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 px-4 py-3"><dt className="text-[11px] text-[var(--color-ink-muted)]">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>
            ))}
          </dl>
        )}
      </section>

      {(canAppraisalTemplates || canOneToOneTemplates) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {canAppraisalTemplates && (
            <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <div className="flex items-center gap-3">
                <IconChip icon={ClipboardList} color="blue" />
                <div>
                  <h3 className="text-sm font-semibold">Appraisal templates</h3>
                  <p className="text-xs text-[var(--color-ink-muted)]">A fixed question set, reused every cycle.</p>
                </div>
              </div>
              {appraisalTemplates.length > 0 && (
                <ul className="space-y-2">
                  {appraisalTemplates.map((t) => (
                    <li key={t.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{t.name}</span>
                        <div className="flex items-center gap-2">
                          <StatusPill label={t.active ? "Active" : "Inactive"} tone={t.active ? "success" : "neutral"} />
                          <ActionForm action={toggleAppraisalTemplateActive.bind(null, t.id)}>
                            <input type="hidden" name="active" value={t.active ? "off" : "on"} />
                            <Button type="submit" className="text-xs">{t.active ? "Deactivate" : "Activate"}</Button>
                          </ActionForm>
                        </div>
                      </div>
                      <ul className="mt-2 space-y-0.5">
                        {t.questions.map((q) => <li key={q} className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]"><span className="size-1 rounded-full bg-[var(--color-ink-faint)]" />{q}</li>)}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
              <ActionForm action={createAppraisalTemplate} className="grid gap-3 border-t border-[var(--color-border)] pt-4">
                <label className="text-sm">Template name<input name="name" required maxLength={150} placeholder="Engineering review" className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
                <label className="text-sm">Questions (one per line)<textarea name="questions" required rows={4} placeholder={"Delivery\nCode quality\nCollaboration"} className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label>
                <Button type="submit" variant="primary" className="justify-self-start">Add template</Button>
              </ActionForm>
            </section>
          )}

          {canOneToOneTemplates && (
            <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <div className="flex items-center gap-3">
                <IconChip icon={MessageCircle} color="teal" />
                <div>
                  <h3 className="text-sm font-semibold">One-to-one templates</h3>
                  <p className="text-xs text-[var(--color-ink-muted)]">Reusable talking points for regular check-ins.</p>
                </div>
              </div>
              {oneToOneTemplates.length > 0 && (
                <ul className="space-y-2">
                  {oneToOneTemplates.map((t) => (
                    <li key={t.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{t.name}</span>
                        <div className="flex items-center gap-2">
                          <StatusPill label={t.active ? "Active" : "Inactive"} tone={t.active ? "success" : "neutral"} />
                          <ActionForm action={toggleOneToOneTemplateActive.bind(null, t.id)}>
                            <input type="hidden" name="active" value={t.active ? "off" : "on"} />
                            <Button type="submit" className="text-xs">{t.active ? "Deactivate" : "Activate"}</Button>
                          </ActionForm>
                        </div>
                      </div>
                      <ul className="mt-2 space-y-0.5">
                        {t.talkingPoints.map((q) => <li key={q} className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]"><span className="size-1 rounded-full bg-[var(--color-ink-faint)]" />{q}</li>)}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
              <ActionForm action={createOneToOneTemplate} className="grid gap-3 border-t border-[var(--color-border)] pt-4">
                <label className="text-sm">Template name<input name="name" required maxLength={150} placeholder="Manager check-in" className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
                <label className="text-sm">Talking points (one per line)<textarea name="talkingPoints" required rows={4} placeholder={"Workload and priorities\nBlockers\nCareer development"} className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label>
                <Button type="submit" variant="primary" className="justify-self-start">Add template</Button>
              </ActionForm>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
