import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { dayStamp } from "@/core/pricing/agreements";
import { saveAgreement } from "./actions";
import { CustomerPicker } from "./customer-picker";

const field = "mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm";

type AgreementValues = {
  id: string;
  partyId: string;
  name: string;
  status: string;
  startsOn: Date;
  endsOn: Date | null;
  priceListId: string | null;
  paymentTerms: string;
  notes: string;
  slaName: string;
  coverage: string;
  responseMinutes: number | null;
  resolutionMinutes: number | null;
  slaNotes: string;
};

const sectionHeading = "flex items-center gap-2 text-sm font-semibold sm:col-span-2";
const stepNumber = "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-atlas-blue)] text-[11px] font-semibold text-white";

export function AgreementForm({
  agreement,
  customers,
  lists,
}: {
  agreement?: AgreementValues;
  customers: { id: string; name: string; customerCode: string }[];
  lists: { id: string; name: string; currency: string }[];
}) {
  const hours = (minutes: number | null | undefined) => (minutes == null ? "" : String(minutes / 60));
  return (
    <ActionForm action={saveAgreement.bind(null, agreement?.id ?? "new")} className="grid gap-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className={sectionHeading}><span className={stepNumber}>1</span>Who this contract is with</h2>
        <div className="sm:col-span-2"><CustomerPicker customers={customers} defaultId={agreement?.partyId} /></div>
        <label className="text-sm sm:col-span-2">Agreement name<input name="name" required maxLength={150} defaultValue={agreement?.name ?? ""} placeholder="Annual supply 2026" className={field} /></label>

        <h2 className={sectionHeading}><span className={stepNumber}>2</span>Price list this customer is assigned to</h2>
        <p className="text-sm leading-relaxed text-[var(--color-ink-muted)] sm:col-span-2">This is the price list the customer is held to for as long as the contract is active. Leave it unset to keep charging their usual list or catalogue prices.</p>
        <label className="text-sm sm:col-span-2">Price list
          <select name="priceListId" defaultValue={agreement?.priceListId ?? ""} className={field}>
            <option value="">Customer’s usual list, or catalogue prices</option>
            {lists.map((list) => <option key={list.id} value={list.id}>{list.name} · {list.currency}</option>)}
          </select>
        </label>

        <h2 className={sectionHeading}><span className={stepNumber}>3</span>Term</h2>
        <label className="text-sm">Status
          <select name="status" defaultValue={agreement?.status ?? "DRAFT"} className={field}>
            <option value="DRAFT">Draft — not used for prices yet</option>
            <option value="ACTIVE">Active — use these prices</option>
            <option value="ENDED">Ended</option>
          </select>
        </label>
        <div />
        <label className="text-sm">Starts<input name="startsOn" required type="date" defaultValue={agreement ? dayStamp(agreement.startsOn) : ""} className={field} /></label>
        <label className="text-sm">Ends<input name="endsOn" type="date" defaultValue={dayStamp(agreement?.endsOn)} className={field} /></label>

        <h2 className={sectionHeading}><span className={stepNumber}>4</span>Payment terms</h2>
        <label className="text-sm sm:col-span-2">Terms<input name="paymentTerms" maxLength={200} defaultValue={agreement?.paymentTerms ?? ""} placeholder="30 days, or due on delivery" className={field} /></label>
        <label className="text-sm sm:col-span-2">Notes<textarea name="notes" maxLength={4000} defaultValue={agreement?.notes ?? ""} rows={3} className={field} /></label>
      </section>

      <section className="grid gap-4 rounded-[22px] bg-[var(--color-surface-sunken)] p-5 sm:grid-cols-2">
        <h2 className={sectionHeading}><span className={stepNumber}>5</span>Service level agreement (SLA)</h2>
        <p className="text-sm leading-relaxed text-[var(--color-ink-muted)] sm:col-span-2">What you have promised this customer while the contract is active. Hours are clock hours, so say the working window in coverage.</p>
        <label className="text-sm">Name<input name="slaName" maxLength={120} defaultValue={agreement?.slaName ?? ""} placeholder="Standard support" className={field} /></label>
        <label className="text-sm">When you cover them<input name="coverage" maxLength={200} defaultValue={agreement?.coverage ?? ""} placeholder="Weekdays 08:00–18:00" className={field} /></label>
        <label className="text-sm">Respond within (hours)<input name="responseHours" type="number" min="1" max="8760" step="1" defaultValue={hours(agreement?.responseMinutes)} className={field} /></label>
        <label className="text-sm">Resolve within (hours)<input name="resolutionHours" type="number" min="1" max="8760" step="1" defaultValue={hours(agreement?.resolutionMinutes)} className={field} /></label>
        <label className="text-sm sm:col-span-2">What happens if you miss it<textarea name="slaNotes" maxLength={2000} defaultValue={agreement?.slaNotes ?? ""} rows={3} placeholder="Service credit, escalation, exclusions" className={field} /></label>
      </section>
      <Button type="submit" variant="primary" className="justify-self-start">{agreement && agreement.id !== "new" ? "Save agreement" : "Create agreement"}</Button>
    </ActionForm>
  );
}
