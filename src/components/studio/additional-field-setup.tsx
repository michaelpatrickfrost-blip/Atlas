'use client';

import { useState } from 'react';
import { inputClass } from '@/components/ui/service-fields';
import { additionalFieldTypeCatalogue } from '@/core/studio/authoring/field-setup-contract';

export type AdditionalFieldSetupProps = {
  fieldTypes: readonly { id: string; name: string; settings: readonly string[]; initialValue: string }[];
  referenceTargets: readonly { id: string; name: string }[];
};
const lines = (value: string) => value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
const codes = (value: string) => value.split(/[\n,]/).map(value => value.trim().toUpperCase()).filter(Boolean);
export function AdditionalFieldSetup({ fieldTypes, referenceTargets }: AdditionalFieldSetupProps) {
  const types = fieldTypes.filter(value => additionalFieldTypeCatalogue.some(type => type.id === value.id) && (value.id !== 'reference' || referenceTargets.length));
  const [selected, setSelected] = useState(types[0]?.id ?? '');
  const selectedType = types.find(type => type.id === selected);
  return <div className="space-y-5">
    <label className="grid gap-2 text-sm font-medium">Display name<input name="label" className={inputClass} required maxLength={100}/></label>
    <label className="grid gap-2 text-sm font-medium">Helpful description<textarea name="help" className={inputClass} rows={3} maxLength={500}/></label>
    <label className="grid gap-2 text-sm font-medium">What kind of detail?<select name="type" className={inputClass} required value={selected} onChange={event => setSelected(event.target.value)}>
      {!types.length && <option value="">No field types are available</option>}{types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
    </select></label>
    {selectedType && <TypeControls key={selected} type={selectedType} referenceTargets={referenceTargets}/>}
    <p className="text-xs leading-5 text-slate-500">New fields start optional. Choose which details your business requires in its record setup after publishing the field.</p>
  </div>;
}
function TypeControls({ type, referenceTargets }: { type: AdditionalFieldSetupProps['fieldTypes'][number]; referenceTargets: AdditionalFieldSetupProps['referenceTargets'] }) {
  const [defaults, setDefaults] = useState(false), [choiceText, setChoiceText] = useState(''), [currencyText, setCurrencyText] = useState('GBP'), [countryText, setCountryText] = useState('GB');
  const has = (setting: string) => type.settings.includes(setting);
  const number = (setting: string, title: string, value?: number, decimal = false) => has(setting) && <label className="grid gap-2 text-sm font-medium">{title}<input className={inputClass} name={`setting.${setting}`} type={decimal ? 'text' : 'number'} inputMode={decimal ? 'decimal' : 'numeric'} step={decimal ? undefined : 1} defaultValue={value}/></label>;
  const settings = <>
    {number('minLength', 'Minimum characters', 0)}{number('maxLength', 'Maximum characters', 200)}
    {has('multiline') && <label className="flex gap-2 text-sm"><input type="checkbox" name="setting.multiline"/>Allow more than one line</label>}
    {has('characters') && <label className="grid gap-2 text-sm font-medium">Allowed characters<select name="setting.characters" className={inputClass}>
      <option value="any">Any characters</option><option value="letters">Letters only</option><option value="letters_numbers">Letters and numbers</option><option value="numbers">Numbers only</option><option value="letters_numbers_spaces_dashes">Letters, numbers, spaces and dashes</option>
    </select></label>}
    {number('min', type.id === 'duration' ? 'Shortest duration (seconds)' : 'Smallest value', undefined, type.id === 'decimal' || type.id === 'money')}
    {number('max', type.id === 'duration' ? 'Longest duration (seconds)' : 'Largest value', undefined, type.id === 'decimal' || type.id === 'money')}
    {number('precision', 'Maximum total digits', 28)}{number('scale', 'Maximum decimal places', 10)}
    {has('currencies') && <label className="grid gap-2 text-sm font-medium">Allowed currencies<input name="setting.currencies" aria-label="Allowed currencies" className={inputClass} value={currencyText} onChange={event => setCurrencyText(event.target.value)} required/><span className="text-xs font-normal text-slate-500">Currency codes separated by commas, for example GBP, EUR.</span></label>}
    {has('countries') && <label className="grid gap-2 text-sm font-medium">Allowed countries<input name="setting.countries" aria-label="Allowed countries" className={inputClass} value={countryText} onChange={event => setCountryText(event.target.value)} required/><span className="text-xs font-normal text-slate-500">Country codes separated by commas, for example GB, IE.</span></label>}
    {has('choices') && <label className="grid gap-2 text-sm font-medium">Available choices<textarea name="setting.choices" aria-label="Available choices" className={inputClass} value={choiceText} onChange={event => setChoiceText(event.target.value)} required rows={4}/><span className="text-xs font-normal text-slate-500">One choice per line.</span></label>}
    {number('maxSelections', 'Maximum choices a person can select', 30)}
    {has('entityId') && <label className="grid gap-2 text-sm font-medium">Which records can be linked?<select name="setting.entityId" className={inputClass} required>{referenceTargets.map(target => <option key={target.id} value={target.id}>{target.name}</option>)}</select></label>}
    {has('allowHttp') && <label className="flex gap-2 text-sm"><input type="checkbox" name="setting.allowHttp"/>Also allow web addresses without secure HTTPS</label>}
  </>;
  const scalarType = type.id === 'date' ? 'date' : type.id === 'datetime' ? 'datetime-local' : type.id === 'email' ? 'email' : type.id === 'url' ? 'url' : type.id === 'phone' ? 'tel' : type.id === 'integer' || type.id === 'duration' ? 'number' : 'text';
  return <>
    {!!type.settings.length && <fieldset className="grid gap-4 rounded-2xl border border-slate-200 p-4"><legend className="px-1 text-sm font-semibold">Field settings</legend>{settings}</fieldset>}
    {type.id === 'reference' ? <p className="text-xs leading-5 text-slate-500">People choose a linked record when they complete this field. A starting record needs an approved record picker.</p>
      : <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-4"><legend className="px-1 text-sm font-semibold">Optional starting value</legend>
        <label className="flex gap-2 text-sm"><input name="initialValueEnabled" type="checkbox" checked={defaults} onChange={event => setDefaults(event.target.checked)}/>Start new records with a value</label>
        <p className="text-xs leading-5 text-slate-500">This is a suggestion for new records. It does not replace existing saved values or the app&apos;s required-field rules.</p>
        {defaults && (type.id === 'boolean' ? <label className="grid gap-2 text-sm font-medium">Starting value<select name="initialValue" className={inputClass}><option value="false">No</option><option value="true">Yes</option></select></label>
          : type.id === 'multi_enum' ? <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">Starting choices</legend>
            {lines(choiceText).map((label, index) => <label key={`${index}:${label}`} className="flex gap-2 text-sm"><input name="initialValue" type="checkbox" value={index}/>{label}</label>)}
            {!lines(choiceText).length && <p className="text-xs text-slate-500">Add your available choices above first.</p>}
          </fieldset>
          : type.id === 'enum' ? <label className="grid gap-2 text-sm font-medium">Starting choice<select name="initialValue" aria-label="Starting choice" className={inputClass} required>
            {lines(choiceText).map((label, index) => <option key={`${index}:${label}`} value={index}>{label}</option>)}
          </select><span className="text-xs font-normal text-slate-500">Add your available choices above first.</span></label>
          : type.id === 'money' ? <><label className="grid gap-2 text-sm font-medium">Starting amount<input name="initialValue.amount" className={inputClass} inputMode="decimal" required/></label>
            <label className="grid gap-2 text-sm font-medium">Starting currency<select name="initialValue.currency" className={inputClass} required>{codes(currencyText).map(code => <option key={code} value={code}>{code}</option>)}</select></label></>
          : type.id === 'address' ? <>{[['line1', 'Address line 1'], ['line2', 'Address line 2'], ['city', 'Town or city'], ['region', 'Region'], ['postalCode', 'Postcode']].map(([id, label]) =>
            <label key={id} className="grid gap-2 text-sm font-medium">{label}<input name={`initialValue.${id}`} className={inputClass} required={id === 'line1' || id === 'city'}/></label>)}
            <label className="grid gap-2 text-sm font-medium">Country<select name="initialValue.country" className={inputClass} required>{codes(countryText).map(code => <option key={code} value={code}>{code}</option>)}</select></label></>
          : <label className="grid gap-2 text-sm font-medium">{type.id === 'duration' ? 'Starting duration (seconds)' : type.id === 'datetime' ? 'Starting date and time (UTC)' : type.id === 'phone' ? 'Starting phone number (including country code)' : 'Starting value'}
            {type.id === 'string' && has('multiline') ? <textarea name="initialValue" className={inputClass} rows={3}/> : <input name="initialValue" className={inputClass} type={scalarType} step={scalarType === 'number' ? 1 : undefined} required={type.id !== 'string'} inputMode={type.id === 'decimal' ? 'decimal' : undefined}/>}
          </label>)}
      </fieldset>}
  </>;
}
