import { productOptions } from "@/modules/quality/services/queries";
import { reportNcr } from "@/modules/quality/services/commands";
import { NCR_SOURCES, NCR_SEVERITIES, label } from "@/modules/quality/domain/workflow";

const input = "w-full rounded-xl border px-3 py-2 text-sm";

export default async function NewNcr() {
  const products = await productOptions();
  return (
    <div className="max-w-xl space-y-5">
      <h2 className="text-2xl font-semibold">Report nonconformance</h2>
      <form action={reportNcr} className="space-y-4 rounded-2xl border bg-white p-5">
        <label className="text-xs">What failed?<input name="title" className={input} required placeholder="Diameter above specification" /></label>
        <label className="text-xs">Requirement / defect<textarea name="defect" className={input} required rows={3} /></label>
        <div className="grid grid-cols-2 gap-4">
          <label className="text-xs">Source<select name="source" className={input} defaultValue="OTHER">
            {NCR_SOURCES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select></label>
          <label className="text-xs">Severity<select name="severity" className={input} defaultValue="MINOR">
            {NCR_SEVERITIES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select></label>
          <label className="text-xs">Product<select name="productId" className={input}>
            <option value="">Not product-specific</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></label>
          <label className="text-xs">Quantity affected<input name="quantityAffected" type="number" min={0} className={input} /></label>
        </div>
        <label className="text-xs">Immediate containment (optional)<textarea name="containment" className={input} rows={2} /></label>
        <button className="atlas-primary-button">Report NCR</button>
      </form>
    </div>
  );
}
