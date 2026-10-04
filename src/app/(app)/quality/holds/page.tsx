import { requireSession } from "@/core/auth/session";
import { QUALITY_CAPABILITIES } from "@/core/permissions/capabilities";
import { holdList } from "@/modules/quality/services/queries";
import { releaseHold } from "@/modules/quality/services/commands";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";

const input = "rounded-xl border px-3 py-2 text-sm";

export default async function Holds() {
  const session = await requireSession();
  const holds = await holdList();
  const canRelease = session.capabilities.has(QUALITY_CAPABILITIES.holdRelease);
  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-semibold">Quality Holds</h2><p className="text-sm text-slate-500">Stock on quality hold is not pickable or shippable while active.</p></div>
      <div className="space-y-3">
        {holds.map((hold) => (
          <div key={hold.id} className="rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{hold.number} · {hold.product.name}</p>
                <p className="text-sm text-slate-500">{hold.quantity} units · {hold.reason}{hold.lotCode ? ` · Lot ${hold.lotCode}` : ""}</p>
              </div>
              <StatusPill label={hold.status === "ACTIVE" ? "Active" : "Released"} tone={hold.status === "ACTIVE" ? "danger" : "success"} />
            </div>
            {hold.status === "ACTIVE" && canRelease && (
              <form action={releaseHold} className="mt-3 flex items-center gap-2">
                <input type="hidden" name="holdId" value={hold.id} />
                <input name="releaseNote" required placeholder="Release reason / evidence" className={`${input} flex-1`} />
                <Button type="submit" variant="secondary">Release</Button>
              </form>
            )}
            {hold.status === "RELEASED" && <p className="mt-2 text-xs text-slate-500">Released: {hold.releaseNote}</p>}
          </div>
        ))}
        {holds.length === 0 && <p className="text-sm text-slate-500">No quality holds recorded.</p>}
      </div>
    </div>
  );
}
