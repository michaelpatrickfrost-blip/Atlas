import { db } from "@/core/db/client";
import type { AttentionProvider } from "@/core/modules/types";
import { can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";

/** Sales' contribution to Home's "Needs your attention" (§127) — explainable,
 *  never a bare "AI prioritised this" claim. */
export const salesAttentionProvider: AttentionProvider = async ({ organisationId, session }) => {
  if (!can(session, SALES_CAPABILITIES.opportunityRead)) return [];

  const [noNextAction, newProspects] = await Promise.all([
    db.opportunity.count({
      where: { organisationId, ownerUserId: session.userId, status: "OPEN", nextActionAt: null },
    }),
    db.prospect.count({ where: { organisationId, ownerUserId: session.userId, lifecycleStage: "NEW" } }),
  ]);

  const items = [];
  if (noNextAction > 0) {
    items.push({
      id: "sales.opportunities.no_next_action",
      label: `${noNextAction} ${noNextAction === 1 ? "opportunity has" : "opportunities have"} no next action`,
      href: "/crm/pipeline",
      severity: "warning" as const,
    });
  }
  if (newProspects > 0) {
    items.push({
      id: "sales.prospects.new",
      label: `${newProspects} new ${newProspects === 1 ? "prospect needs" : "prospects need"} contacting`,
      href: "/crm/prospect?filter=new",
      severity: "info" as const,
    });
  }
  return items;
};
