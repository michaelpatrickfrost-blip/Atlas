import Link from "next/link";
import { conductChoices, savePlan } from "../../actions";
import { PlanForm } from "@/modules/people/components/plan-form";
import { RecordIntro } from "@/modules/people/components/record-form";

export default async function NewPlanPage() {
  const choices = await conductChoices();
  if (!choices.canEdit) return <div className="rounded-2xl border bg-white p-8"><h2 className="text-xl font-semibold">Performance plans are restricted</h2><p className="mt-2 text-sm text-slate-500">Opening a plan needs performance and disciplinary access for your team or the company.</p><Link href="/people/conduct" className="mt-4 inline-block text-sm text-blue-600">Back to conduct</Link></div>;
  return <div className="space-y-6"><Link href="/people/conduct" className="text-sm text-blue-600">← Conduct</Link><RecordIntro kicker="Performance plan" title="New performance plan" detail="Set the reason, the support the company will give, and the objectives you will review together." /><PlanForm action={savePlan.bind(null, null)} employees={choices.employees} /></div>;
}
