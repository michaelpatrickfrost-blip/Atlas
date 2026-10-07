import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { serviceOrderProjection } from "@/core/service-work/connections";
import { redeemServiceRecovery } from "../services/recovery";
import { ActionForm } from "@/components/ui/action-form";
export async function OrderServicePanel({ orderId, partyId, draft }: { orderId: string; partyId: string; draft: boolean }) {
  const session = await requireSession();
  const { cases, recoveries } = await serviceOrderProjection(session, partyId, orderId);
  if (!cases.length && !recoveries.length) return null;
  return <section className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5"><h3 className="text-sm font-semibold">Customer service & recovery</h3><div className="mt-3 space-y-3">{cases.map(c => <Link key={c.id} className="block text-sm text-teal-700" href={`/service/cases/${c.id}`}>{c.number} · {c.subject} →</Link>)}{recoveries.map(benefit => <div className="flex flex-wrap items-center justify-between gap-3" key={benefit.id}><p className="text-sm">{benefit.number}: approved {benefit.type === "PERCENT" ? `${benefit.value / 100}%` : `${benefit.currency} ${(benefit.value / 100).toFixed(2)}`} recovery available · expires {benefit.expiresAt.toLocaleDateString("en-GB")}</p>{draft && session.capabilities.has("sales.order.edit_draft") && <ActionForm action={redeemServiceRecovery} label="Apply benefit"><input type="hidden" name="orderId" value={orderId}/><input type="hidden" name="recoveryId" value={benefit.id}/></ActionForm>}</div>)}</div></section>;
}
