'use client';

import { useState } from 'react';
import { inputClass } from '@/components/ui/service-fields';
import { additionalFieldTypeCatalogue, type AdditionalFieldSetup } from '@/core/studio/authoring/field-setup-contract';

export type AdditionalFieldSetupProps = {
  fieldTypes: readonly { id: string; name: string; settings: readonly string[]; initialValue: string }[];
  referenceTargets: readonly { id: string; name: string }[];
  initial?: AdditionalFieldSetup;
  storageRulesEditable?: boolean;
};
const lines = (value: string) => value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
const codes = (value: string) => value.split(/[\n,]/).map(value => value.trim().toUpperCase()).filter(Boolean);
export function AdditionalFieldSetup({ fieldTypes, referenceTargets, initial, storageRulesEditable = true }: AdditionalFieldSetupProps) {
  const types = fieldTypes.filter(value => additionalFieldTypeCatalogue.some(type => type.id === value.id) && (value.id !== 'reference' || referenceTargets.length));
  const [selected, setSelected] = useState(initial?.type ?? types[0]?.id ?? '');
  const selectedType = types.find(type => type.id === selected);
  return <div className="space-y-5">
    <label className="grid gap-2 text-sm font-medium">Display name<input name="label" defaultValue={initial?.label} className={inputClass} required maxLength={100}/></label>
    <label className="grid gap-2 text-sm font-medium">Helpful description<textarea name="help" defaultValue={initial?.help} className={inputClass} rows={3} maxLength={500}/></label>
    <label className="grid gap-2 text-sm font-medium">What kind of detail?<select name="type" className={inputClass} required value={selected} onChange={event => setSelected(event.target.value)}>
      {!types.length && <option value="">No field types are available</option>}{types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
    </select></label>
    {selectedType && <TypeControls key={selected} type={selectedType} referenceTargets={referenceTargets} initial={initial?.type === selected ? initial : undefined} storageRulesEditable={storageRulesEditable} retainedIndex={initial?.indexed ?? false} retainedUnique={initial?.unique ?? false}/>}
    <p className="text-xs leading-5 text-slate-500">{initial ? 'Existing business rules stay in place. Changing these settings does not remove required-field rules.' : 'New fields start optional. Choose which details your business requires in its record setup after publishing the field.'}</p>
  </div>;
}
function TypeControls({ type, referenceTargets, initial, storageRulesEditable, retainedIndex, retainedUnique }: { type: AdditionalFieldSetupProps['fieldTypes'][number]; referenceTargets: AdditionalFieldSetupProps['referenceTargets']; initial?: AdditionalFieldSetup; storageRulesEditable: boolean; retainedIndex: boolean; retainedUnique: boolean }) {
  const values: Readonly<Record<string, unknown>> = initial?.settings ?? {}, starting = initial?.initialValue;
  const [searchable, setSearchable] = useState(initial?.indexed === true), [unique, setUnique] = useState(initial?.unique === true);
  const listValue = (key: string, separator: string, fallback: string) => Array.isArray(values[key]) ? values[key].filter(value => typeof value === 'string').join(separator) : fallback;
  const [defaults, setDefaults] = useState(initial !== undefined && starting !== undefined), [choiceText, setChoiceText] = useState(listValue('choices', '\n', '')), [currencyText, setCurrencyText] = useState(listValue('currencies', ', ', 'GBP')), [countryText, setCountryText] = useState(listValue('countries', ', ', 'GB'));
  const objectValue = (key: string) => typeof starting === 'object' && starting !== null && !Array.isArray(starting) && key in starting ? String(Object.entries(starting).find(([name]) => name === key)?.[1] ?? '') : '';
  const scalarValue = typeof starting === 'string' || typeof starting === 'number' ? String(starting) : '';
  const has = (setting: string) => type.settings.includes(setting);
  const number = (setting: string, title: string, value?: number, decimal = false) => has(setting) && <label className="grid gap-2 text-sm font-medium">{title}<input className={inputClass} name={`setting.${setting}`} type={decimal ? 'text' : 'number'} inputMode={decimal ? 'decimal' : 'numeric'} step={decimal ? undefined : 1} defaultValue={typeof values[setting] === 'string' || typeof values[setting] === 'number' ? values[setting] : value}/></label>;
  const settings = <>
    {number('minLength', 'Minimum characters', 0)}{number('maxLength', 'Maximum characters', 200)}
    {has('multiline') && <label className="flex gap-2 text-sm"><input type="checkbox" name="setting.multiline" defaultChecked={values.multiline === true}/>Allow more than one line</label>}
    {has('characters') && <label className="grid gap-2 text-sm font-medium">Allowed characters<select name="setting.characters" defaultValue={typeof values.characters === 'string' ? values.characters : 'any'} className={inputClass}>
      <option value="any">Any characters</option><option value="letters">Letters only</option><option value="letters_numbers">Letters and numbers</option><option value="numbers">Numbers only</option><option value="letters_numbers_spaces_dashes">Letters, numbers, spaces and dashes</option>
    </select></label>}
    {number('min', type.id === 'duration' ? 'Shortest duration (seconds)' : 'Smallest value', undefined, type.id === 'decimal' || type.id === 'money')}
    {number('max', type.id === 'duration' ? 'Longest duration (seconds)' : 'Largest value', undefined, type.id === 'decimal' || type.id === 'money')}
    {number('precision', 'Maximum total digits', 28)}{number('scale', 'Maximum decimal places', 10)}
    {has('currencies') && <label className="grid gap-2 text-sm font-medium">Allowed currencies<input name="setting.currencies" aria-label="Allowed currencies" className={inputClass} value={currencyText} onChange={event => setCurrencyText(event.target.value)} required/><span className="text-xs font-normal text-slate-500">Currency codes separated by commas, for example GBP, EUR.</span></label>}
    {has('countries') && <label className="grid gap-2 text-sm font-medium">Allowed countries<input name="setting.countries" aria-label="Allowed countries" className={inputClass} value={countryText} onChange={event => setCountryText(event.target.value)} required/><span className="text-xs font-normal text-slate-500">Country codes separated by commas, for example GB, IE.</span></label>}
    {has('choices') && <label className="grid gap-2 text-sm font-medium">Available choices<textarea name="setting.choices" aria-label="Available choices" className={inputClass} value={choiceText} onChange={event => setChoiceText(event.target.value)} required rows={4}/><span className="text-xs font-normal text-slate-500">One choice per line.</span></label>}
    {number('maxSelections', 'Maximum choices a person can select', 30)}
    {has('entityId') && <label className="grid gap-2 text-sm font-medium">Which records can be linked?<select name="setting.entityId" defaultValue={typeof values.entityId === 'string' ? values.entityId : undefined} className={inputClass} required>{referenceTargets.map(target => <option key={target.id} value={target.id}>{target.name}</option>)}</select></label>}
    {has('allowHttp') && <label className="flex gap-2 text-sm"><input type="checkbox" name="setting.allowHttp" defaultChecked={values.allowHttp === true}/>Also allow web addresses without secure HTTPS</label>}
  </>;
  const scalarType = type.id === 'date' ? 'date' : type.id === 'datetime' ? 'datetime-local' : type.id === 'email' ? 'email' : type.id === 'url' ? 'url' : type.id === 'phone' ? 'tel' : type.id === 'integer' || type.id === 'duration' ? 'number' : 'text';
  return <>
    <fieldset className="space-y-2 rounded-2xl border border-slate-200 p-4"><legend className="px-1 text-sm font-semibold">Finding records</legend>
      {storageRulesEditable && !['multi_enum', 'address'].includes(type.id) ? <><input type="hidden" name="indexed" value={searchable ? 'on' : 'off'}/><label className="flex gap-2 text-sm"><input type="checkbox" checked={searchable} onChange={event => setSearchable(event.target.checked)}/>Make this detail available in search</label></>
        : <><input type="hidden" name="indexed" value={!storageRulesEditable && retainedIndex ? 'on' : 'off'}/><p className="text-sm text-slate-600">{storageRulesEditable ? 'Addresses and multiple-choice details cannot be used for this search.' : retainedIndex ? 'This detail is available in search.' : 'This detail is not included in additional-detail search.'}</p></>}
      {storageRulesEditable && !['multi_enum', 'address'].includes(type.id) ? <><input type="hidden" name="unique" value={unique ? 'on' : 'off'}/><label className="flex gap-2 text-sm"><input type="checkbox" checked={unique} onChange={event => setUnique(event.target.checked)}/>Prevent duplicate values</label></>
        : <><input type="hidden" name="unique" value={!storageRulesEditable && retainedUnique ? 'on' : 'off'}/>{!storageRulesEditable && <p className="text-sm text-slate-600">{retainedUnique ? 'Duplicate values are prevented.' : 'The same value can be used on more than one record.'}</p>}</>}
      <p className="text-xs leading-5 text-slate-500">{storageRulesEditable ? 'Choose before publishing. Duplicate checks apply to supplied values; empty details can stay empty. People still need permission to read the detail and its records.' : 'Published search and duplicate-value settings stay in place while other settings are reviewed.'}</p>
    </fieldset>
    {!!type.settings.length && <fieldset className="grid gap-4 rounded-2xl border border-slate-200 p-4"><legend className="px-1 text-sm font-semibold">Field settings</legend>{settings}</fieldset>}
    {type.id === 'reference' ? <p className="text-xs leading-5 text-slate-500">People choose a linked record when they complete this field. A starting record needs an approved record picker.</p>
      : <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-4"><legend className="px-1 text-sm font-semibold">Optional starting value</legend>
        <label className="flex gap-2 text-sm"><input name="initialValueEnabled" type="checkbox" checked={defaults} onChange={event => setDefaults(event.target.checked)}/>Start new records with a value</label>
        <p className="text-xs leading-5 text-slate-500">This is a suggestion for new records. It does not replace existing saved values or the app&apos;s required-field rules.</p>
        {defaults && (type.id === 'boolean' ? <label className="grid gap-2 text-sm font-medium">Starting value<select name="initialValue" defaultValue={starting === true ? 'true' : 'false'} className={inputClass}><option value="false">No</option><option value="true">Yes</option></select></label>
          : type.id === 'multi_enum' ? <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">Starting choices</legend>
            {lines(choiceText).map((label, index) => <label key={`${index}:${label}`} className="flex gap-2 text-sm"><input name="initialValue" type="checkbox" value={index} defaultChecked={Array.isArray(starting) && starting.includes(index)}/>{label}</label>)}
            {!lines(choiceText).length && <p className="text-xs text-slate-500">Add your available choices above first.</p>}
          </fieldset>
          : type.id === 'enum' ? <label className="grid gap-2 text-sm font-medium">Starting choice<select name="initialValue" aria-label="Starting choice" defaultValue={typeof starting === 'number' ? starting : undefined} className={inputClass} required>
            {lines(choiceText).map((label, index) => <option key={`${index}:${label}`} value={index}>{label}</option>)}
          </select><span className="text-xs font-normal text-slate-500">Add your available choices above first.</span></label>
          : type.id === 'money' ? <><label className="grid gap-2 text-sm font-medium">Starting amount<input name="initialValue.amount" defaultValue={objectValue('amount')} className={inputClass} inputMode="decimal" required/></label>
            <label className="grid gap-2 text-sm font-medium">Starting currency<select name="initialValue.currency" defaultValue={objectValue('currency') || undefined} className={inputClass} required>{codes(currencyText).map(code => <option key={code} value={code}>{code}</option>)}</select></label></>
          : type.id === 'address' ? <>{[['line1', 'Address line 1'], ['line2', 'Address line 2'], ['city', 'Town or city'], ['region', 'Region'], ['postalCode', 'Postcode']].map(([id, label]) =>
            <label key={id} className="grid gap-2 text-sm font-medium">{label}<input name={`initialValue.${id}`} defaultValue={objectValue(id)} className={inputClass} required={id === 'line1' || id === 'city'}/></label>)}
            <label className="grid gap-2 text-sm font-medium">Country<select name="initialValue.country" defaultValue={objectValue('country') || undefined} className={inputClass} required>{codes(countryText).map(code => <option key={code} value={code}>{code}</option>)}</select></label></>
          : <label className="grid gap-2 text-sm font-medium">{type.id === 'duration' ? 'Starting duration (seconds)' : type.id === 'datetime' ? 'Starting date and time (UTC)' : type.id === 'phone' ? 'Starting phone number (including country code)' : 'Starting value'}
            {type.id === 'string' && has('multiline') ? <textarea name="initialValue" defaultValue={scalarValue} className={inputClass} rows={3}/> : <input name="initialValue" defaultValue={type.id === 'datetime' ? scalarValue.replace(/Z$/, '') : scalarValue} className={inputClass} type={scalarType} step={scalarType === 'number' ? 1 : scalarType === 'datetime-local' ? 0.001 : undefined} required={type.id !== 'string'} inputMode={type.id === 'decimal' ? 'decimal' : undefined}/>}
          </label>)}
      </fieldset>}
  </>;
}
