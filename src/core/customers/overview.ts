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
      .map(async (module): Promise<CustomerOverviewContribution | null> => {
        try {
          return await module.customerOverviewProvider!({ organisationId: session.organisationId, session, partyId });
        } catch {
          // A module data-service mismatch must not make the shared customer
          // identity and hierarchy inaccessible. Never report failed reads as zero.
          return {
            moduleId: module.id,
            metrics: [{ label: `${module.name} summary unavailable`, value: "Unavailable" }],
            actions: [],
          };
        }
      }),
  );
  return results.filter((contribution): contribution is CustomerOverviewContribution => contribution !== null);
}
