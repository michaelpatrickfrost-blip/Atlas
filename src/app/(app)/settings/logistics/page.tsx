import Link from "next/link";
import { Truck } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { policyFor } from "@/modules/logistics/services/numbers";
import { saveDispatchDelivery } from "./actions";

export default async function LogisticsCompanySettings() {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.modulesManage);
  const policy = await policyFor(session.organisationId);
  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/settings?tab=workspace" className="text-xs font-medium text-[#0071e3]">Company administration</Link>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Logistics</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">Choose what happens when an order leaves the warehouse.</p>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <Truck className="mb-4 text-blue-500" size={23} />
        <h3 className="text-base font-semibold">Dispatched orders</h3>
        <p className="mt-2 text-sm text-slate-500">Turn this on when leaving the warehouse is the delivery. The order leaves Dispatch, the delivered quantity is recorded, and Finance receives a draft invoice dated that day. Leave it off when someone confirms delivery later, after a courier update or the customer’s signature.</p>
        <ActionForm action={saveDispatchDelivery} className="mt-5 space-y-4">
          <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 text-sm">
            <span>When an order is dispatched, mark it delivered</span>
            <input name="dispatchConfirmsDelivery" type="checkbox" defaultChecked={policy.dispatchConfirmsDelivery} className="size-5 accent-blue-600" />
          </label>
          <button className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs text-white">Save logistics</button>
        </ActionForm>
      </section>
    </div>
  );
}
