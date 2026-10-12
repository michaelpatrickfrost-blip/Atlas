import { requireSession } from "@/core/auth/session";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { readBusinessViewDraftInTransaction, loadBusinessViewMetricsInTransaction } from "@/modules/analytics/services/studio-business-view";
import { BusinessDashboardEditor } from "./editor";

export default async function DashboardDesign({ params, searchParams }: {
  params: Promise<{ definitionId: string }>; searchParams: Promise<{ business?: string }>;
}) {
  const actor = await requireSession(), { definitionId } = await params, { business } = await searchParams;
  const workspace = await withStudioAuthoringAuthority(actor, CAP.read, business, async authority => {
    const draft = await readBusinessViewDraftInTransaction(authority, definitionId);
    return { draft, company: authority.session.organisationName,
      metrics: await loadBusinessViewMetricsInTransaction(authority, draft.content.period),
      canEdit: authority.session.capabilities.has(CAP.edit) && authority.session.capabilities.has("analytics.dashboard.manage"),
      canPublish: authority.session.capabilities.has(CAP.publish) && authority.session.capabilities.has("analytics.dashboard.manage") };
  });
  return <BusinessDashboardEditor {...workspace} business={business}/>;
}
