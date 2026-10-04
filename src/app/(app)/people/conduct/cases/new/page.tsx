import Link from "next/link";
import { conductChoices, saveCase } from "../../actions";
import { CaseForm } from "@/modules/people/components/case-form";
import { RecordIntro } from "@/modules/people/components/record-form";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";

export default async function NewCasePage() {
  const [session, choices] = await Promise.all([requireSession(), conductChoices()]);
  if (!choices.canEdit) return <div className="rounded-2xl border bg-white p-8"><h2 className="text-xl font-semibold">Disciplinary cases are restricted</h2><p className="mt-2 text-sm text-slate-500">Opening a case needs performance and disciplinary access for your team or the company.</p><Link href="/people/conduct" className="mt-4 inline-block text-sm text-blue-600">Back to conduct</Link></div>;
  return <div className="space-y-6"><Link href="/people/conduct" className="text-sm text-blue-600">← Conduct</Link><RecordIntro kicker="Disciplinary case" title="New disciplinary case" detail="Start with what is alleged and the stage you are at. Add meetings, warnings and the outcome as the case moves on." /><CaseForm action={saveCase.bind(null, null)} employees={choices.employees} plans={choices.plans.map((plan) => ({ id: plan.id, title: plan.title, employeeName: `${plan.employee.firstName} ${plan.employee.lastName}` }))} confidential={can(session, HR.employeeManage)} /></div>;
}
