import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Field, FormSection, fieldClass } from "./record-form";
import { CASE_STAGES, CASE_STAGE_LABEL, CASE_STATUSES, CASE_STATUS_LABEL } from "@/modules/people/domain/conduct";

type Employee = { id: string; firstName: string; lastName: string; jobTitle: string };
type Plan = { id: string; title: string; employeeName: string };
export type CaseValues = { employeeId: string; employeeName: string; planId: string; stage: string; status: string; allegation: string; facts: string; outcome: string; sanction: string; hearingOn: string; appealBy: string; confidentialNotes: string };

export function CaseForm({ action, employees, plans, record, confidential }: { action: (form: FormData) => Promise<void>; employees: Employee[]; plans: Plan[]; record?: CaseValues; confidential: boolean }) {
  return <ActionForm action={action} className="space-y-6">
    <FormSection title="What this is about" intro="Record the allegation in the employee's own terms where you can. Facts found later go in the next section.">
      {record ? <Field label="Employee" className="sm:col-span-2"><input name="employeeId" type="hidden" value={record.employeeId} /><p className="mt-2 text-sm">{record.employeeName}</p></Field> : <Field label="Employee" className="sm:col-span-2"><select name="employeeId" required defaultValue="" className={fieldClass}><option value="">Choose an employee</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName} · {employee.jobTitle}</option>)}</select></Field>}
      <Field label="Linked performance plan" className="sm:col-span-2" hint="Optional. The plan must be for the same employee."><select name="planId" defaultValue={record?.planId ?? ""} className={fieldClass}><option value="">No linked plan</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.employeeName} — {plan.title}</option>)}</select></Field>
      <Field label="What is alleged" className="sm:col-span-2"><textarea name="allegation" required maxLength={4000} rows={4} defaultValue={record?.allegation} className={fieldClass} /></Field>
    </FormSection>
    <FormSection title="Stage">
      <Field label="Where the process is"><select name="stage" defaultValue={record?.stage ?? "INFORMAL"} className={fieldClass}>{CASE_STAGES.map((stage) => <option key={stage} value={stage}>{CASE_STAGE_LABEL[stage]}</option>)}</select></Field>
      <Field label="Status"><select name="status" defaultValue={record?.status ?? "OPEN"} className={fieldClass}>{CASE_STATUSES.map((status) => <option key={status} value={status}>{CASE_STATUS_LABEL[status]}</option>)}</select></Field>
      <Field label="Hearing date"><input name="hearingOn" type="date" defaultValue={record?.hearingOn} className={fieldClass} /></Field>
      <Field label="Appeal by"><input name="appealBy" type="date" defaultValue={record?.appealBy} className={fieldClass} /></Field>
    </FormSection>
    <FormSection title="Findings and decision" intro="Share the outcome with the employee. Confidential notes stay with HR and are not shown to the employee or their manager.">
      <Field label="Facts established" className="sm:col-span-2"><textarea name="facts" maxLength={8000} rows={4} defaultValue={record?.facts} className={fieldClass} /></Field>
      <Field label="Outcome" className="sm:col-span-2"><textarea name="outcome" maxLength={4000} rows={3} defaultValue={record?.outcome} className={fieldClass} /></Field>
      <Field label="Sanction" className="sm:col-span-2"><input name="sanction" maxLength={1000} defaultValue={record?.sanction} className={fieldClass} placeholder="First written warning, 6 months" /></Field>
      {confidential && <Field label="Confidential HR note" className="sm:col-span-2" hint="Visible only to people with HR employee management. Not included in the employee's view."><textarea name="confidentialNotes" maxLength={8000} rows={3} defaultValue={record?.confidentialNotes} className={fieldClass} /></Field>}
      <Button type="submit" variant="primary" className="justify-self-start">Save case</Button>
    </FormSection>
  </ActionForm>;
}
