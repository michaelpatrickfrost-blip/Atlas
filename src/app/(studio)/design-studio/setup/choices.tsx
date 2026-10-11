import { inputClass } from "@/components/ui/service-fields";

export type SetupChoice = { id: string; name: string };
export function RecordSetupChoices({ pages, fields, page, requiredFields = [], inherit = false }: {
  pages: SetupChoice[]; fields: SetupChoice[]; page?: string | null; requiredFields?: string[]; inherit?: boolean;
}) {
  const missing = requiredFields.filter(id => !fields.some(field => field.id === id));
  return <div className="space-y-5">
    <label className="grid gap-2 text-sm font-medium">Record screen
      <select name="page" className={inputClass} defaultValue={inherit && page === undefined ? "inherit" : page ?? ""}>
        {inherit && <option value="inherit">Use the business&apos;s base screen</option>}
        <option value="">Use the app&apos;s standard screen</option>
        {page && !pages.some(choice => choice.id === page) && <option value={page}>Previously selected screen · currently unavailable</option>}
        {pages.map(choice => <option key={choice.id} value={choice.id}>{choice.name}</option>)}
      </select>
    </label>
    <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">Required additional fields</legend>
      <p className="mb-3 text-xs leading-5 text-slate-500">Choose the details your team must complete. The app&apos;s existing rules always apply.</p>
      {fields.map(choice => <label key={choice.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm">
        <input type="checkbox" name="requiredField" value={choice.id} defaultChecked={requiredFields.includes(choice.id)} className="mt-1 accent-blue-600"/>{choice.name}
      </label>)}
      {missing.map(id => <label key={id} className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <input type="hidden" name="requiredField" value={id}/><span>A previously required field is unavailable. Restore its access before changing this setup.</span>
      </label>)}
      {!fields.length && !missing.length && <p className="text-sm text-slate-500">Create and publish an additional field to make it available here.</p>}
    </fieldset>
  </div>;
}
export function SetupIdentity({ business, id, revision, kind }: { business?: string; id?: string; revision?: number; kind: string }) {
  return <>{business && <input type="hidden" name="business" value={business}/>}<input type="hidden" name="kind" value={kind}/>
    {id && <input type="hidden" name="definitionId" value={id}/>} {revision !== undefined && <input type="hidden" name="revision" value={revision}/>}</>;
}
export function SetupName({ label = "", help = "" }: { label?: string; help?: string }) {
  return <><label className="grid gap-2 text-sm font-medium">Display name<input className={inputClass} name="label" defaultValue={label} required maxLength={100}/></label>
    <label className="grid gap-2 text-sm font-medium">Helpful description<textarea className={inputClass} name="help" defaultValue={help} maxLength={500} rows={3}/></label></>;
}
