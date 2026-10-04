import { productOptions, specificationList } from "@/modules/quality/services/queries";
import { createControlPoint } from "@/modules/quality/services/commands";
import { CONTROL_TRIGGERS, label } from "@/modules/quality/domain/workflow";

const input = "w-full rounded-xl border px-3 py-2 text-sm";

export default async function NewControlPoint() {
  const [products, specs] = await Promise.all([productOptions(), specificationList()]);
  return (
    <div className="max-w-xl space-y-5">
      <h2 className="text-2xl font-semibold">New control point</h2>
      <form action={createControlPoint} className="space-y-4 rounded-2xl border bg-white p-5">
        <div className="grid grid-cols-2 gap-4">
          <label className="text-xs">Code<input name="code" className={input} required placeholder="CP1/1-FINAL" /></label>
          <label className="text-xs">Name<input name="name" className={input} required placeholder="Final inspection" /></label>
          <label className="text-xs">Product<select name="productId" className={input}>
            <option value="">Any product</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></label>
          <label className="text-xs">Specification<select name="specificationId" className={input}>
            <option value="">None</option>
            {specs.map((s) => <option key={s.id} value={s.id}>{s.code} / {s.revision}</option>)}
          </select></label>
          <label className="text-xs">Trigger<select name="trigger" className={input} defaultValue="MANUAL">
            {CONTROL_TRIGGERS.map((t) => <option key={t} value={t}>{label(t)}</option>)}
          </select></label>
          <label className="text-xs">Sample size<input name="sampleSize" className={input} type="number" min={1} defaultValue={1} /></label>
          <label className="col-span-2 text-xs">Operation (optional)<input name="operation" className={input} placeholder="Press 2" /></label>
        </div>
        <button className="atlas-primary-button">Create control point</button>
      </form>
    </div>
  );
}
