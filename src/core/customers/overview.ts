import type { Session } from "@/core/auth/session";
import type { CustomerOverviewContribution } from "@/core/modules/types";
import { getNavigableModules } from "@/core/modules/runtime";

/** Collects Overview metrics/actions from every enabled, accessible module for
 *  one customer. Customer Master holds no Sales/Finance-specific logic — it
 *  only calls providers and renders what comes back. See
 *  docs/CUSTOMER_MASTER.md §Module extension points. */
export async function getCustomerOverviewContributions(
  session: Session,
  partyId: string,
): Promise<CustomerOverviewContribution[]> {
  const modules = await getNavigableModules(session);
  const results = await Promise.all(
    modules
      .filter((module) => module.customerOverviewProvider)
      .map((module) => module.customerOverviewProvider!({ organisationId: session.organisationId, session, partyId })),
  );
  return results.filter((contribution): contribution is CustomerOverviewContribution => contribution !== null);
}
