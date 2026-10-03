import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import type { AttentionItem } from "@/core/modules/types";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";

/** Core-owned attention items for Customer Master (credit holds today).
 *  Unlike module contributions, this runs unconditionally for Core — Customer
 *  Master isn't an optional module. */
export async function getCustomerAttentionItems(session: Session): Promise<AttentionItem[]> {
  if (!can(session, CUSTOMER_CAPABILITIES.creditRead)) return [];

  const onHold = await db.customerCreditProfile.findMany({
    where: { onHold: true, party: { organisationId: session.organisationId } },
    include: { party: { select: { id: true, name: true } } },
  });

  return onHold.map((profile) => ({
    id: `customer.credit_hold.${profile.partyId}`,
    label: `${profile.party.name} is on credit hold`,
    href: `/customers/${profile.partyId}`,
    severity: "critical" as const,
  }));
}
