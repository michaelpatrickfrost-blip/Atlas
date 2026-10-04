import Link from "next/link";
import { Network, Plus } from "lucide-react";
import type { Session } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { setCustomerParent } from "@/core/customers/hierarchy-actions";
import { saveCustomerTradingLink, archiveCustomerTradingLink } from "@/core/customers/trading-actions";
import { loadCustomerMap } from "@/core/customers/map-data";
import { AccountMap } from "@/components/customers/account-map";
import { Button } from "@/components/ui/button";
import { CreateDialog } from "@/components/ui/create-dialog";
import { ActionForm } from "@/components/ui/action-form";

const input = "mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm";

export async function CustomerHierarchy({ partyId, session }: { partyId: string; session: Session }) {
  const includeInvoices = can(session, "customers.commercial.read") || can(session, "sales.order.read") || can(session, "sales.quote.read");
  const manageTrading = can(session, "customers.commercial.manage");
  const showTrading = can(session, "customers.commercial.read");
  const map = await loadCustomerMap(session.organisationId, includeInvoices);
  const customer = map.accounts.find((account) => account.id === partyId);
  if (!customer) return null;
  const links = showTrading
    ? await db.customerTradingLink.findMany({
        where: { organisationId: session.organisationId, active: true, OR: [{ accountId: partyId }, { tradingAccountId: partyId }] },
        include: { account: true, tradingAccount: true },
      })
    : [];
  const extraLinks = links.filter((link) => !(link.accountId === partyId && link.tradingAccountId === customer.invoiceAccountId));

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <Network size={18} className="text-blue-600" />
          <div>
            <h2 className="text-sm font-semibold">Corporate structure</h2>
            <p className="mt-1 text-xs text-slate-500">Who owns/belongs to whom, and the trading relationships used for invoicing.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/customers/map?account=${partyId}`} className="text-xs font-medium text-blue-600">Open the map</Link>
          {can(session, "customers.edit") && (
            <CreateDialog title="Account type" label="Account type" variant="secondary">
              <ActionForm action={setCustomerParent.bind(null, partyId)} className="space-y-4">
                <label className="block text-xs">Customer type
                  <input name="customerGroup" defaultValue={customer.customerGroup ?? ""} placeholder="Your own category" className={input} />
                </label>
                <input type="hidden" name="parentPartyId" value={customer.parentPartyId ?? ""} />
                <input type="hidden" name="hierarchyRole" value={customer.hierarchyRole} />
                <Button type="submit" variant="primary">Save type</Button>
              </ActionForm>
            </CreateDialog>
          )}
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <AccountMap
          accounts={map.accounts}
          people={map.people}
          focusId={partyId}
          canEdit={can(session, "customers.edit")}
          canCreate={can(session, "customers.create")}
          canInvoice={manageTrading}
          canPeople={can(session, "customers.contacts.manage")}
        />
      </div>
      {showTrading && (
        <div className="border-t border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold">Other trading links</h3>
          <p className="mt-1 text-xs text-slate-500">The invoice customer is chosen on the map. Anything else this account buys through, or supplies for, stays here.</p>
          <div className="mt-3 space-y-2">
            {extraLinks.map((link) => {
              const outgoing = link.accountId === partyId;
              const other = outgoing ? link.tradingAccount : link.account;
              return (
                <div key={link.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-[10px] font-medium text-slate-400">{outgoing ? "Also invoices" : "Supplies for"}</span>
                  <Link href={`/customers/${other.id}`} className="mt-1 block text-sm font-semibold text-blue-700">{other.name} <span className="font-normal text-slate-400">· {other.customerCode}</span></Link>
                  {link.notes && <p className="mt-2 whitespace-pre-wrap text-xs text-slate-500">{link.notes}</p>}
                  {manageTrading && (
                    <ActionForm action={archiveCustomerTradingLink.bind(null, link.id)}>
                      <button type="submit" className="mt-2 text-[10px] text-slate-400 hover:text-rose-600">Remove</button>
                    </ActionForm>
                  )}
                </div>
              );
            })}
            {!extraLinks.length && <p className="text-xs text-slate-400">No other trading links.</p>}
            {manageTrading && (
              <CreateDialog title="Link a trading account" label="Add trading link" variant="secondary">
                <ActionForm action={saveCustomerTradingLink.bind(null, partyId)} className="space-y-4">
                  <p className="text-sm text-slate-500">Use this when the account buys through another business as well as its invoice customer.</p>
                  <label className="block text-xs">Buys through
                    <select name="tradingAccountId" required className={input}>
                      <option value="">Choose a business</option>
                      {map.accounts.filter((account) => account.id !== partyId).map((account) => (
                        <option key={account.id} value={account.id}>{account.name} · {account.customerCode}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs">Relationship notes<textarea name="notes" maxLength={2000} className={input} /></label>
                  <Button type="submit" variant="primary"><Plus size={14} />Save trading link</Button>
                </ActionForm>
              </CreateDialog>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
