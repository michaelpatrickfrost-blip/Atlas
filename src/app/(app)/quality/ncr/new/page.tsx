import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { QUALITY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { qualityWorkspaceOptions } from "@/modules/quality/services/queries";
import { IssueForm } from "@/modules/quality/components/issue-form";
export default async function NewNcr(){const session=await requireSession();assertCapability(session,C.ncrReport);const options=await qualityWorkspaceOptions();return <div className="mx-auto max-w-4xl space-y-5"><header><h1 className="text-3xl font-semibold tracking-tight">Report a quality issue</h1><p className="mt-2 text-sm text-slate-500">Start with what failed and what you did to contain it. Add the investigation detail when you know more.</p></header><section className="rounded-3xl border bg-white p-5 md:p-6"><IssueForm options={options}/></section></div>;}
