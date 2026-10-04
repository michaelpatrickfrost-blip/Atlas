import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";
import { canReadPolicies } from "@/core/permissions/hr-access";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { listPolicies, publishPolicy, archivePolicy } from "./actions";
import { PolicyFileButton } from "./policy-library";
import { Field, FormSection, RecordIntro, fieldClass } from "@/modules/people/components/record-form";
import { POLICY_CATEGORIES } from "@/modules/people/domain/conduct";

const audienceLabel = { EVERYONE: "Everyone", MANAGERS: "Managers", HR: "HR only" };

export default async function PoliciesPage() {
  const session = await requireSession();
  if (!canReadPolicies(session)) throw new Error("FORBIDDEN: company policies are not included in your access.");
  const policies = await listPolicies();
  const manage = can(session, HR.policyManage);
  const today = new Date().toISOString().slice(0, 10);
  return <div className="space-y-6">
    <RecordIntro kicker="Company policies" title="Policies" detail="Published policies are PDF documents stored with the company records. People only see the copies their access allows." />
    {manage && <FormSection title="Add a policy" intro="Upload the finished PDF. The form records who it is for and when it applies. It does not rebuild the policy as fields.">
      <ActionForm action={publishPolicy} className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
        <Field label="Title"><input name="title" required maxLength={160} className={fieldClass} placeholder="Holiday policy" /></Field>
        <Field label="Category"><select name="category" className={fieldClass} required>{POLICY_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></Field>
        <Field label="Who can read it" className="sm:col-span-2"><select name="audience" className={fieldClass}><option value="EVERYONE">Everyone in the company</option><option value="MANAGERS">Managers</option><option value="HR">HR only</option></select></Field>
        <Field label="Effective from"><input name="effectiveOn" type="date" required defaultValue={today} className={fieldClass} /></Field>
        <Field label="Review by" hint="Optional. A reminder for HR, not an automatic expiry."><input name="reviewOn" type="date" className={fieldClass} /></Field>
        <Field label="Short summary" className="sm:col-span-2" hint="Shown in the list. The PDF is the policy itself."><textarea name="summary" maxLength={1000} rows={3} className={fieldClass} /></Field>
        <Field label="PDF file" className="sm:col-span-2" hint="PDF only, up to 3 MB. The file stays on the server."><input name="file" type="file" accept="application/pdf,.pdf" required className={fieldClass} /></Field>
        <Button type="submit" variant="primary" className="justify-self-start">Publish policy</Button>
      </ActionForm>
    </FormSection>}
    <section className="space-y-3">{policies.map((policy) => <article key={policy.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-slate-400">{policy.category} · {audienceLabel[policy.audience]}{policy.status === "ARCHIVED" ? " · Archived" : ""}</p><h3 className="mt-1 text-lg font-semibold">{policy.title}</h3>{policy.summary && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{policy.summary}</p>}<p className="mt-2 text-xs text-slate-400">Effective {policy.effectiveOn.toLocaleDateString("en-GB", { timeZone: "UTC" })}{policy.reviewOn ? ` · Review ${policy.reviewOn.toLocaleDateString("en-GB", { timeZone: "UTC" })}` : ""} · {policy.fileName}</p></div><div className="flex items-center gap-4"><PolicyFileButton id={policy.id} name={policy.fileName} />{manage && policy.status === "PUBLISHED" && <ActionForm action={archivePolicy.bind(null, policy.id)}><Button type="submit">Archive</Button></ActionForm>}</div></div></article>)}{!policies.length && <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">No policies published for your access yet.</p>}</section>
  </div>;
}
