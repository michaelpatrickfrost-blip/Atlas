import { AccountNotes } from "@/components/customers/account-notes";
import { EmptyState } from "@/components/ui/empty-state";
import type { Session } from "@/core/auth/session";
import type { getCustomer } from "@/core/customers/queries";
import type { getCustomerActivity } from "@/core/activity/log";

type Customer = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;
export function CustomerActivity({ customer, activity, session }: { customer: Customer; activity: Awaited<ReturnType<typeof getCustomerActivity>>; session: Session }) {
  return <div className="grid items-start gap-5 lg:grid-cols-2"><AccountNotes partyId={customer.id} notes={customer.notes} session={session} /><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-semibold">Customer timeline</h2><p className="mt-1 text-xs text-slate-500">Activity linked to this account from across Atlas.</p><div className="mt-5">{!activity.length ? <EmptyState title="No activity yet." description="Customer activity will appear here as work moves forward." /> : activity.map(entry => <article key={entry.id} className="relative ml-2 border-l border-blue-100 pb-6 pl-6 last:pb-0"><span className="absolute -left-1.5 top-1 size-3 rounded-full border-2 border-white bg-blue-500" /><time dateTime={entry.createdAt.toISOString()} className="text-xs text-slate-400">{entry.createdAt.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time><p className="mt-1 break-words text-sm text-slate-700">{entry.summary}</p></article>)}</div></section></div>;
}
