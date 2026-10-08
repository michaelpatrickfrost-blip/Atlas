import { QualityForm } from "@/modules/quality/components/action-form";
import { inspectionControlPoints, controlPointDetail, warehouseOptions, inspectionHistory } from "@/modules/quality/services/queries";
import { executeInspection } from "@/modules/quality/services/commands";

const input = "w-full rounded-xl border px-3 py-2 text-sm";

export default async function Checks({ searchParams }: { searchParams: Promise<{ controlPointId?: string; inspected?: string }> }) {
  const { controlPointId, inspected } = await searchParams;

  if (!controlPointId) {
    const [points,history] = await Promise.all([inspectionControlPoints(),inspectionHistory()]);
    return (
      <div className="max-w-2xl space-y-5">
        <h2 className="text-2xl font-semibold">Quality check</h2>
        {inspected && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Inspection recorded and passed.</div>}
        <p className="text-sm text-slate-500">Choose a control point to run its inspection.</p>
        <div className="divide-y rounded-2xl border bg-white">
          {points.filter((p) => p.active).map((p) => (
            <a key={p.id} href={`/quality/checks?controlPointId=${p.id}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50">
              <span><span className="font-medium">{p.code}</span> · {p.name}</span>
              <span className="text-slate-500">{p.product?.name ?? "Any product"}</span>
            </a>
          ))}
          {points.length === 0 && <p className="px-4 py-6 text-sm text-slate-500">No control points configured yet.</p>}
        </div>
        <section className="space-y-3"><h2 className="text-xl font-semibold">Inspection history</h2><p className="text-xs text-slate-500">Latest 50 inspections. Open a record to see its recorded results.</p>{history.map(record=><a key={record.id} href={`/quality/checks/${record.id}`} className="block rounded-xl border p-4 text-sm">{record.number} · {record.product.name} · {record.result.toLowerCase()} · {record.inspectedAt.toLocaleDateString("en-GB")}</a>)}</section>
      </div>
    );
  }

  const [point, warehouses] = await Promise.all([controlPointDetail(controlPointId), warehouseOptions()]);
  const characteristics = point.specification?.characteristics ?? [];

  return (
    <div className="max-w-2xl space-y-5">
      <h2 className="text-2xl font-semibold">{point.name}</h2>
      <p className="text-sm text-slate-500">{point.code} · {point.product?.name ?? "Any product"}</p>
      <QualityForm action={executeInspection} className="space-y-4 rounded-2xl border bg-white p-5">
        <input type="hidden" name="controlPointId" value={point.id} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-xs">Quantity inspected<input name="quantityInspected" type="number" min={1} defaultValue={point.sampleSize} className={input} /></label>
          <label className="text-xs">Lot / batch<input name="lotCode" className={input} /></label>
          <label className="text-xs">Warehouse<select name="warehouseId" className={input}>
            <option value="">Not applicable</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select></label>
        </div>

        {characteristics.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Checks</p>
            {characteristics.map((c) => (
              <div key={c.id} className="rounded-xl border p-3">
                <input type="hidden" name="characteristicId" value={c.id} />
                <p className="text-sm font-medium">{c.name} {c.unit ? `(${c.unit})` : ""}</p>
                {(c.target != null || c.lowerLimit != null || c.upperLimit != null) && (
                  <p className="text-xs text-slate-500">Target {c.target?.toString() ?? "—"} · Limits {c.lowerLimit?.toString() ?? "—"} to {c.upperLimit?.toString() ?? "—"}</p>
                )}
                {c.method === "MEASUREMENT" ? (
                  <input aria-label={`Measurement: ${c.name}`} name={`value:${c.id}`} required className={`${input} mt-2`} placeholder="Enter measurement" />
                ) : (
                  <div className="mt-2 flex gap-4 text-sm">
                    <label className="flex items-center gap-1"><input type="radio" name={`pass:${c.id}`} value="1" required /> Pass</label>
                    <label className="flex items-center gap-1"><input type="radio" name={`pass:${c.id}`} value="0" required /> Fail</label>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border p-3">
            <p className="text-sm text-slate-500">No specification characteristics — record a simple pass/fail.</p>
            <div className="mt-2 flex gap-4 text-sm">
              <label className="flex items-center gap-1"><input type="radio" name="pass" value="1" required /> Pass</label>
              <label className="flex items-center gap-1"><input type="radio" name="pass" value="0" required /> Fail</label>
            </div>
          </div>
        )}

        <label className="text-xs">Notes<textarea name="notes" className={input} rows={2} /></label>
        <p className="text-xs text-slate-500">A failed check automatically places the inspected quantity on Quality Hold and opens an NCR.</p>
        <button className="atlas-primary-button">Complete inspection</button>
      </QualityForm>
    </div>
  );
}
