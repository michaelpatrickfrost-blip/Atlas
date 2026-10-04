import { ActionForm } from "@/components/ui/action-form";
import type { ManagerPolicy } from "@/core/permissions/manager-level";
import { saveManagerPolicy } from "./actions";

const input = "mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm";

export function ManagerPanel({ policy, currency }: { policy: ManagerPolicy; currency: string }) {
  return (
    <ActionForm action={saveManagerPolicy} className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold">Manager level</h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">Turn a manager level on for an app. People keep the permissions already on their role. The switch decides when a manager has to assign the work or sign it off.</p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 text-sm">
          <span>
            <span className="block font-medium">CRM</span>
            <span className="mt-1 block text-xs text-slate-500">Sales managers assign tasks and push prospects and deals. Everyone else can still work their own book.</span>
          </span>
          <input name="crm" type="checkbox" defaultChecked={policy.crm} className="size-5 accent-blue-600" />
        </label>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 text-sm">
          <span>
            <span className="block font-medium">Finance</span>
            <span className="mt-1 block text-xs text-slate-500">A finance manager signs off high-value documents. They cannot approve their own request. Other currencies always wait for a manager.</span>
          </span>
          <input name="finance" type="checkbox" defaultChecked={policy.finance} className="size-5 accent-blue-600" />
        </label>
        <label className="mt-4 block text-xs">Sign-off from ({currency})
          <input name="financeLimit" type="number" min={0} max={21474836} step="0.01" required defaultValue={(policy.financeLimitMinor / 100).toFixed(2)} className={input} />
        </label>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 text-sm">
          <span>
            <span className="block font-medium">Customer Service</span>
            <span className="mt-1 block text-xs text-slate-500">A service manager signs off complaints, and queries linked to an order at or above the limit. Agents can keep working the case.</span>
          </span>
          <input name="service" type="checkbox" defaultChecked={policy.service} className="size-5 accent-blue-600" />
        </label>
        <label className="mt-4 block text-xs">Query sign-off from ({currency})
          <input name="serviceLimit" type="number" min={0} max={21474836} step="0.01" required defaultValue={(policy.serviceLimitMinor / 100).toFixed(2)} className={input} />
        </label>
      </section>
      <button className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs text-white">Save manager level</button>
    </ActionForm>
  );
}
