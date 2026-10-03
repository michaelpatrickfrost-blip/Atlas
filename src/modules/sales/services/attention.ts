import { db } from "@/core/db/client";
import type { AttentionProvider } from "@/core/modules/types";
import { can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";

export const salesAttentionProvider: AttentionProvider = async ({ organisationId, session }) => {
  if (!can(session, SALES_CAPABILITIES.quoteRead)) return [];

  const sentQuotes = await db.quote.count({
    where: { organisationId, status: "SENT" },
  });

  if (sentQuotes === 0) return [];

  return [
    {
      id: "sales.quotes.awaiting_response",
      label: `${sentQuotes} ${sentQuotes === 1 ? "quote" : "quotes"} awaiting customer response`,
      href: "/sales/quotes",
      severity: "warning",
    },
  ];
};
