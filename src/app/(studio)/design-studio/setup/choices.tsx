'use client';
import { useState } from 'react';
import { ReferenceNavigationControls, type ReferenceNavigationLinks } from '@/components/studio/reference-navigation-controls';
import { inputClass } from "@/components/ui/service-fields";

export type SetupChoice = { id: string; name: string } & ReferenceNavigationLinks;
export type SavedSetupReferences = { page?: ({ id: string } & ReferenceNavigationLinks) | null;
  baseProfile?: ({ name: string } & ReferenceNavigationLinks) | null; requiredFields?: readonly ({ id: string } & ReferenceNavigationLinks)[] };
export function RecordSetupChoices({ pages, fields, page, requiredFields = [], inherit = false, references, disabled = false }: {
  pages: SetupChoice[]; fields: SetupChoice[]; page?: string | null; requiredFields?: string[]; inherit?: boolean; references?: SavedSetupReferences; disabled?: boolean;
}) {
  const initialPage = inherit && page === undefined ? "inherit" : page ?? "";
  const [selectedPage, setSelectedPage] = useState(initialPage);
  const [pageChanged, setPageChanged] = useState(false);
  const [touchedFields, setTouchedFields] = useState<ReadonlySet<string>>(new Set());
  const pageLinks = !pageChanged && references && page === selectedPage ? references.page : pages.find(value => value.id === selectedPage);
  const missing = requiredFields.filter(id => !fields.some(field => field.id === id));
  return <div className="space-y-5">
    <label className="grid gap-2 text-sm font-medium">Record screen
      <select name="page" disabled={disabled} className={inputClass} value={selectedPage} onChange={event => { setSelectedPage(event.target.value); setPageChanged(true); }}>
        {inherit && <option value="inherit">Use the business&apos;s base screen</option>}
        <option value="">Use the app&apos;s standard screen</option>
        {page && !pages.some(choice => choice.id === page) && <option value={page}>Previously selected screen · currently unavailable</option>}
        {pages.map(choice => <option key={choice.id} value={choice.id}>{choice.name}</option>)}
      </select>
    </label>
    <ReferenceNavigationControls {...pageLinks} label="Record screen"/>
    {!pageChanged && references && page && !references.page && <p className="text-xs text-slate-500">The saved screen reference is currently unavailable. Its selection is preserved.</p>}
    {references?.baseProfile && <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs"><p>Based on {references.baseProfile.name}. Its saved base version is retained.</p>
      <ReferenceNavigationControls {...references.baseProfile} label="Base record setup"/></div>}
    <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">Required additional fields</legend>
      <p className="mb-3 text-xs leading-5 text-slate-500">Choose the details your team must complete. The app&apos;s existing rules always apply.</p>
      {fields.map(choice => <div key={choice.id} className="space-y-2 rounded-xl border border-slate-200 p-3"><label className="flex items-start gap-3 text-sm">
        <input type="checkbox" disabled={disabled} name="requiredField" value={choice.id} defaultChecked={requiredFields.includes(choice.id)}
          onChange={() => setTouchedFields(previous => new Set([...previous, choice.id]))} className="mt-1 accent-blue-600"/>{choice.name}
      </label><ReferenceNavigationControls {...(!touchedFields.has(choice.id) && references && requiredFields.includes(choice.id) ? references.requiredFields?.find(value => value.id === choice.id) : choice)} label={choice.name}/></div>)}
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
