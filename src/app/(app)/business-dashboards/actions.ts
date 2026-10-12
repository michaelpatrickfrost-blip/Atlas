"use server";

import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { withFieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { readPublishedAnalyticsViewInTransaction } from "@/modules/analytics/services/studio-business-view";

export async function refreshPublishedBusinessDashboard(input: unknown) {
  const session = await requireSession();
  assertCapability(session, "analytics.dashboard.read");
  return withFieldRuntimeAuthority(session, authority => readPublishedAnalyticsViewInTransaction(authority, input));
}
