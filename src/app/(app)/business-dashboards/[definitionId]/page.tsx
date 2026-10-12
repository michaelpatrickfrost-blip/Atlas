import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { withFieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { readPublishedAnalyticsViewInTransaction } from "@/modules/analytics/services/studio-business-view";
import { PublishedBusinessDashboard } from "./dashboard";

export default async function BusinessDashboard({ params }: { params: Promise<{ definitionId: string }> }) {
  const session = await requireSession();
  assertCapability(session, "analytics.dashboard.read");
  const { definitionId } = await params;
  const view = await withFieldRuntimeAuthority(session, authority => readPublishedAnalyticsViewInTransaction(authority, { definitionId }));
  return <div className="mx-auto max-w-[1600px] space-y-7 px-5 py-7 md:px-8">
    <Link className="inline-flex items-center gap-2 text-sm text-slate-500" href="/home"><ArrowLeft size={16}/>Business Home</Link>
    <header><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{session.organisationName}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{view.name}</h1></header>
    <PublishedBusinessDashboard key={`${view.definitionId}:${view.definitionRevision}:${view.view.versionId}`} initial={view}/>
  </div>;
}
