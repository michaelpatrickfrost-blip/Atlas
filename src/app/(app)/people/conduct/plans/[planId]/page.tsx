import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { getPlan, savePlan, addPlanReview, commentOnPlan } from "../../actions";
import { PlanForm } from "@/modules/people/components/plan-form";
import { Field, FormSection, RecordIntro, fieldClass } from "@/modules/people/components/record-form";
import { PLAN_STATUS_LABEL } from "@/modules/people/domain/conduct";

function day(value: Date) { return value.toISOString().slice(0, 10); }
function objectives(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    return [{ goal: String(item.goal ?? ""), measure: String(item.measure ?? ""), support: String(item.support ?? ""), by: String(item.by ?? "") }];
  });
}

export default async function PlanPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  const { plan, canEdit, own } = await getPlan(planId);
  const goals = objectives(plan.objectives);
  return <div className="space-y-6">
    <Link href="/people/conduct" className="text-sm text-blue-600">← Conduct</Link>
    <div className="flex flex-wrap items-end justify-between gap-3"><RecordIntro kicker="Performance plan" title={plan.title} detail={`${plan.employee.firstName} ${plan.employee.lastName} · ${plan.employee.jobTitle}`} /><StatusPill label={PLAN_STATUS_LABEL[plan.status as keyof typeof PLAN_STATUS_LABEL] ?? plan.status} tone={plan.status === "ACHIEVED" ? "success" : plan.status === "NOT_MET" ? "danger" : "warning"} /></div>
    {canEdit ? <PlanForm action={savePlan.bind(null, plan.id)} employees={[]} plan={{ employeeId: plan.employeeId, employeeName: `${plan.employee.firstName} ${plan.employee.lastName}`, title: plan.title, reason: plan.reason, support: plan.support ?? "", startOn: day(plan.startOn), reviewOn: day(plan.reviewOn), endOn: day(plan.endOn), status: plan.status, outcome: plan.outcome ?? "", objectives: goals }} /> : <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm leading-6 text-slate-600">{plan.reason}</p>{plan.support && <p className="text-sm leading-6 text-slate-600"><span className="font-medium">Support: </span>{plan.support}</p>}<ol className="space-y-3">{goals.map((goal, index) => <li key={index} className="rounded-xl bg-slate-50 p-4 text-sm"><p className="font-medium">{goal.goal}</p><p className="mt-1 text-slate-500">Measure: {goal.measure}{goal.by ? ` · By ${goal.by}` : ""}</p>{goal.support && <p className="mt-1 text-slate-500">Support: {goal.support}</p>}</li>)}</ol>{plan.outcome && <p className="text-sm"><span className="font-medium">Outcome: </span>{plan.outcome}</p>}</section>}
    <FormSection title={own ? "Your comments" : "Employee comments"} intro="The employee can add their own view. It does not change the objectives.">
      <p className="text-sm leading-6 text-slate-600 sm:col-span-2">{plan.employeeComment || "No comment yet."}</p>
      {(own || canEdit) && <ActionForm action={commentOnPlan.bind(null, plan.id)} className="grid gap-4 sm:col-span-2"><Field label={own ? "Your comment" : "Comment on behalf of the employee"}><textarea name="employeeComment" maxLength={4000} rows={4} defaultValue={plan.employeeComment ?? ""} className={fieldClass} /></Field><Button type="submit" variant="primary" className="justify-self-start">Save comment</Button></ActionForm>}
    </FormSection>
    <FormSection title="Reviews" intro="Add a check-in when you meet. Earlier reviews stay on the plan.">
      <div className="space-y-3 sm:col-span-2">{plan.reviews.map((review) => <article key={review.id} className="rounded-xl border border-slate-200 p-4 text-sm"><p className="text-xs text-slate-400">{review.heldOn.toLocaleDateString("en-GB", { timeZone: "UTC" })}</p><p className="mt-2">{review.progress}</p>{review.managerNotes && <p className="mt-2 text-slate-500">Manager: {review.managerNotes}</p>}{review.employeeNotes && <p className="mt-2 text-slate-500">Employee: {review.employeeNotes}</p>}</article>)}{!plan.reviews.length && <p className="text-sm text-slate-500">No reviews yet.</p>}</div>
      {(own || canEdit) && <ActionForm action={addPlanReview.bind(null, plan.id)} className="grid gap-4 sm:col-span-2 sm:grid-cols-2"><Field label="Review date"><input name="heldOn" type="date" required className={fieldClass} /></Field><Field label="Progress" className="sm:col-span-2"><textarea name="progress" required maxLength={2000} rows={3} className={fieldClass} /></Field>{!own && <Field label="Manager notes" className="sm:col-span-2"><textarea name="managerNotes" maxLength={4000} rows={3} className={fieldClass} /></Field>}<Field label="Employee notes" className="sm:col-span-2"><textarea name="employeeNotes" maxLength={4000} rows={3} className={fieldClass} /></Field><Button type="submit" variant="primary" className="justify-self-start">Add review</Button></ActionForm>}
    </FormSection>
  </div>;
}
