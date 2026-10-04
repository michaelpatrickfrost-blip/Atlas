import { productOptions } from "@/modules/quality/services/queries";
import { createSpecification } from "@/modules/quality/services/commands";
import { CHECK_METHODS, label } from "@/modules/quality/domain/workflow";

const input = "w-full rounded-xl border px-3 py-2 text-sm";

export default async function NewSpecification() {
  const products = await productOptions();
  return (
    <div className="max-w-2xl space-y-5">
      <h2 className="text-2xl font-semibold">New specification</h2>
      <form action={createSpecification} className="space-y-4 rounded-2xl border bg-white p-5">
        <div className="grid grid-cols-2 gap-4">
          <label className="text-xs">Product<select name="productId" className={input} required>
            <option value="">Select a product</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </select></label>
          <label className="text-xs">Code<input name="code" className={input} required placeholder="CP1/1" /></label>
          <label className="text-xs">Title<input name="title" className={input} required placeholder="Finished Product Specification" /></label>
          <label className="text-xs">Revision<input name="revision" className={input} required placeholder="QSP-04" /></label>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Characteristics</p>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-5 gap-2">
              <input name="characteristicName" className={input} placeholder="Diameter" />
              <select name="characteristicMethod" className={input} defaultValue="MEASUREMENT">
                {CHECK_METHODS.map((m) => <option key={m} value={m}>{label(m)}</option>)}
              </select>
              <input name="characteristicUnit" className={input} placeholder="mm" />
              <input name="characteristicLower" className={input} placeholder="Lower limit" />
              <input name="characteristicUpper" className={input} placeholder="Upper limit" />
            </div>
          ))}
          <p className="text-xs text-slate-500">Leave rows blank to skip. Add more characteristics later from the specification page.</p>
        </div>

        <button className="atlas-primary-button">Create specification</button>
      </form>
    </div>
  );
}
