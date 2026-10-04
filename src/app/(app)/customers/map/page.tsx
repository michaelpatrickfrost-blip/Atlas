import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { can, assertCapability } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { loadCustomerMap } from "@/core/customers/map-data";
import { AccountMap } from "@/components/customers/account-map";

export default async function MapPage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.read);
  const { account } = await searchParams;
  const includeInvoices = can(session, "customers.commercial.read") || can(session, "sales.order.read") || can(session, "sales.quote.read");
  const map = await loadCustomerMap(session.organisationId, includeInvoices);
  const focusId = map.accounts.some((item) => item.id === account) ? account : undefined;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#dce5f6] bg-[linear-gradient(115deg,#eaf0ff,#f5efff_65%,#eafff8)] p-8">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#66789e]">Who&apos;s who</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Customer map</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Groups, the businesses inside them, and the branches under those. People sit under their manager. Move a company up or down, point it at a group, and choose the invoice customer.
        </p>
        <Link href="/customers" className="mt-4 inline-block text-sm text-[var(--color-atlas-blue)]">Customer list</Link>
      </div>
      <AccountMap
        accounts={map.accounts}
        people={map.people}
        focusId={focusId}
        canEdit={can(session, CUSTOMER_CAPABILITIES.edit)}
        canCreate={can(session, CUSTOMER_CAPABILITIES.create)}
        canInvoice={can(session, "customers.commercial.manage")}
        canPeople={can(session, CUSTOMER_CAPABILITIES.contactsManage)}
      />
      {map.truncated && <p className="text-xs text-[var(--color-ink-muted)]">Showing the first 500 accounts.</p>}
    </div>
  );
}
