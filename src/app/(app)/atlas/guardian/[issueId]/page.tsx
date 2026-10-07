import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { GUARDIAN_CAPABILITY } from "@/core/guardian/report";
import { IssueProgress } from "../form-controls";
import { BriefCopy } from "../brief-copy";

export default async function GuardianIssue({ params }: { params: Promise<{ issueId: string }> }) {
  const session = await requireSession();
  assertCapability(session, GUARDIAN_CAPABILITY);
  const { issueId } = await params;
  const issue = await db.guardianIssue.findUnique({ where: { id: issueId } });
  if (!issue) notFound();
  return <div className="mx-auto max-w-5xl space-y-6 pb-10"><Link href="/atlas/guardian" className="text-sm text-blue-700">← All Guardian reports</Link><div><p className="text-xs text-slate-500">{issue.severity} · {issue.status} · {issue.occurrences} observations</p><h1 className="mt-2 text-2xl font-semibold">{issue.title}</h1><p className="mt-2 text-sm text-slate-500">{issue.route} · first seen {issue.firstSeenAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}</p></div><section className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><h2 className="font-semibold">AI repair brief</h2><div className="flex gap-4"><BriefCopy brief={issue.brief} /><a href={`/api/atlas/guardian/${issue.id}/brief`} className="text-sm text-blue-700">Download brief</a></div></div><pre className="mt-4 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700">{issue.brief}</pre></section><IssueProgress issue={{ id: issue.id, status: issue.status, resolution: issue.resolution, verifiedRevision: issue.verifiedRevision }} /></div>;
}
