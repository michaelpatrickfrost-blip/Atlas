import Link from "next/link";
import { Network } from "lucide-react";
import type { Session } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { loadCustomerMap } from "@/core/customers/map-data";

/** Compact "who owns/belongs to whom, who do we invoice" summary for Overview.
 *  The full tree/map lives in the Relationships tab (see hierarchy.tsx) so it
 *  doesn't dominate every visit to the record. */
export async function RelationshipSummary({ partyId, session }: { partyId: string; session: Session }) {
  const includeInvoices = can(session, "customers.commercial.read") || can(session, "sales.order.read") || can(session, "sales.quote.read");
  const map = await loadCustomerMap(session.organisationId, includeInvoices, partyId);
  const customer = map.accounts.find((account) => account.id === partyId);
  if (!customer) return null;

  const parent = customer.parentPartyId ? map.accounts.find((account) => account.id === customer.parentPartyId) : null;
  const branchCount = map.accounts.filter((account) => account.parentPartyId === partyId).length;
  const hasRelationships = parent || branchCount > 0 || customer.invoiceAccountId || customer.customerGroup;
  if (!hasRelationships) return null;

  return (
    <Link
      href={`/customers/${partyId}?tab=relationships`}
      className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm hover:border-[var(--color-atlas-blue)]"
    >
      <Network size={16} className="shrink-0 text-[var(--color-ink-muted)]" />
      <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-[var(--color-ink-muted)]">
        {parent && <span><span className="text-[var(--color-ink-faint)]">Parent</span> {parent.name}</span>}
        {branchCount > 0 && <span><span className="text-[var(--color-ink-faint)]">Branches</span> {branchCount}</span>}
        {customer.invoiceAccountId && <span><span className="text-[var(--color-ink-faint)]">Invoice account</span> {customer.invoiceAccountName}</span>}
        {customer.customerGroup && <span><span className="text-[var(--color-ink-faint)]">Group</span> {customer.customerGroup}</span>}
      </div>
      <span className="shrink-0 text-xs font-medium text-[var(--color-atlas-blue)]">View relationships →</span>
    </Link>
  );
}
