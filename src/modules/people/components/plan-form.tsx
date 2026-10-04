import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Field, FormSection, fieldClass } from "./record-form";
import { ObjectiveFields } from "./objective-fields";
import { PLAN_STATUSES, PLAN_STATUS_LABEL } from "@/modules/people/domain/conduct";

type Employee = { id: string; firstName: string; lastName: string; jobTitle: string; department: string | null };
type Objective = { goal: string; measure: string; support: string; by: string };
export type PlanValues = { employeeId: string; employeeName: string; title: string; reason: string; support: string; startOn: string; reviewOn: string; endOn: string; status: string; outcome: string; objectives: Objective[] };

export function PlanForm({ action, employees, plan }: { action: (form: FormData) => Promise<void>; employees: Employee[]; plan?: PlanValues }) {
  return <ActionForm action={action} className="space-y-6">
    <FormSection title="Who the plan is for" intro="A performance plan sets clear goals, support and review dates. It is not a warning by itself.">
      {plan ? <Field label="Employee" className="sm:col-span-2"><input name="employeeId" type="hidden" value={plan.employeeId} /><p className="mt-2 text-sm">{plan.employeeName}</p></Field> : <Field label="Employee" className="sm:col-span-2"><select name="employeeId" required defaultValue="" className={fieldClass}><option value="">Choose an employee</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName} · {employee.jobTitle}</option>)}</select></Field>}
      <Field label="Plan title" className="sm:col-span-2"><input name="title" required maxLength={160} defaultValue={plan?.title} className={fieldClass} placeholder="Customer response time" /></Field>
      <Field label="Why this plan is needed" className="sm:col-span-2" hint="Describe the gap in plain language. Keep investigation detail that should stay private on a disciplinary case."><textarea name="reason" required maxLength={4000} rows={4} defaultValue={plan?.reason} className={fieldClass} /></Field>
    </FormSection>
    <FormSection title="Dates and status">
      <Field label="Starts"><input name="startOn" type="date" required defaultValue={plan?.startOn} className={fieldClass} /></Field>
      <Field label="Review"><input name="reviewOn" type="date" required defaultValue={plan?.reviewOn} className={fieldClass} /></Field>
      <Field label="Ends"><input name="endOn" type="date" required defaultValue={plan?.endOn} className={fieldClass} /></Field>
      <Field label="Status"><select name="status" defaultValue={plan?.status ?? "DRAFT"} className={fieldClass}>{PLAN_STATUSES.map((status) => <option key={status} value={status}>{PLAN_STATUS_LABEL[status]}</option>)}</select></Field>
    </FormSection>
    <FormSection title="Objectives" intro="Each objective needs a goal and a way to tell whether it has been met.">
      <ObjectiveFields initial={plan?.objectives} />
    </FormSection>
    <FormSection title="Support and outcome">
      <Field label="Support from the company" className="sm:col-span-2" hint="Training, time, tools or a named person who will help."><textarea name="support" maxLength={4000} rows={3} defaultValue={plan?.support} className={fieldClass} /></Field>
      <Field label="Outcome" className="sm:col-span-2" hint="Fill this in when the plan is achieved, extended or closed."><textarea name="outcome" maxLength={4000} rows={3} defaultValue={plan?.outcome} className={fieldClass} /></Field>
      <Button type="submit" variant="primary" className="justify-self-start">Save plan</Button>
    </FormSection>
  </ActionForm>;
}
