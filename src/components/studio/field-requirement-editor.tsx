'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { inputClass } from '@/components/ui/service-fields';
import type { RequiredFactLiteral } from '@/core/studio/fields/required-contract';
import type { AdditionalFieldRequirement, FieldRequirementChoice, FriendlyRequiredPredicate } from '@/core/studio/authoring/field-requirement-input';

export type FieldRequirementEditorProps = {
  value: AdditionalFieldRequirement; choices: readonly FieldRequirementChoice[];
  onChange(value: AdditionalFieldRequirement): void; disabled?: boolean; readOnlyReason?: string | null;
};
const labels = { present: 'Has a value', absent: 'Has no value', equals: 'Is', not_equals: 'Is not', contains: 'Includes choice' } as const;
function defaultLiteral(choice: FieldRequirementChoice): RequiredFactLiteral {
  if (choice.type === 'boolean') return { type: 'boolean', value: false };
  if (choice.type === 'integer' || choice.type === 'duration') return { type: choice.type, value: 0 };
  if (choice.type === 'money') return { type: 'money', value: { amount: '', currency: choice.currencies?.[0] ?? '' } };
  if (choice.type === 'enum') return { type: 'enum', value: choice.options?.[0]?.value ?? '' };
  switch (choice.type) {
    case 'decimal': case 'date': case 'datetime': case 'email': case 'phone': case 'url': return { type: choice.type, value: '' };
    default: return { type: 'string', value: '' };
  }
}
function makePredicate(choice: FieldRequirementChoice, operator: FriendlyRequiredPredicate['operator']): FriendlyRequiredPredicate {
  const choiceId = choice.id;
  if (operator === 'present' || operator === 'absent') return { choiceId, operator };
  if (operator === 'contains') return { choiceId, operator, optionId: choice.options?.[0]?.value ?? '' };
  return { choiceId, operator, value: defaultLiteral(choice) };
}
/** Presentation only: the server reloads approved metadata and uses the original
 * conditional compiler. A hidden field still follows all business requirements. */
export function FieldRequirementEditor({ value, choices, onChange, disabled, readOnlyReason }: FieldRequirementEditorProps) {
  const blocked = !!disabled || !!readOnlyReason;
  const update = (index: number, predicate: FriendlyRequiredPredicate) => {
    if (value.when) onChange({ ...value, when: { ...value.when, conditions: value.when.conditions.map((item, i) => i === index ? predicate : item) } });
  };
  return <section aria-label="When this field is required" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
    <div><h3 className="text-base font-semibold">When is this detail needed?</h3><p className="mt-1 text-sm leading-6 text-slate-500">Set a clear rule for your team. Atlas checks it whenever a record is saved, even if this detail is hidden on a screen.</p></div>
    {readOnlyReason && <p role="status" className="rounded-2xl bg-amber-50 p-4 text-sm">{readOnlyReason}</p>}
    <fieldset disabled={blocked} className="space-y-4">
      <label className="flex gap-2 text-sm font-medium"><input type="checkbox" checked={value.always} onChange={event => onChange({ ...value, always: event.target.checked })}/>Always require this detail</label>
      <label className="flex gap-2 text-sm font-medium"><input type="checkbox" checked={value.when !== null} disabled={blocked || !choices.length} onChange={event => onChange({ ...value,
        when: event.target.checked ? { match: 'all', conditions: [makePredicate(choices[0], 'present')] } : null })}/>Also require it when a rule matches</label>
      {value.always && value.when && <p className="text-xs leading-5 text-slate-500">Always required remains in force. A condition adds a requirement; it never makes an always-required detail optional.</p>}
      {!choices.length && <p className="text-sm text-slate-500">No approved condition choices are currently available. Existing rules are kept.</p>}
      {value.when && <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
        <label className="grid gap-2 text-sm font-medium">Require this detail when<select className={inputClass} aria-label="Rule matching" value={value.when.match} onChange={event => value.when && onChange({ ...value, when: { ...value.when, match: event.target.value === 'any' ? 'any' : 'all' } })}>
          <option value="all">All conditions match</option><option value="any">Any condition matches</option>
        </select></label>
        {value.when.conditions.map((predicate, index) => {
          const choice = choices.find(item => item.id === predicate.choiceId);
          return <fieldset key={`${index}:${predicate.choiceId}`} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" aria-label={`Condition ${index + 1}`}>
            <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">Condition {index + 1}</span><Button type="button" variant="ghost" disabled={blocked || value.when!.conditions.length === 1} aria-label={`Remove condition ${index + 1}`} onClick={() => value.when && onChange({ ...value, when: { ...value.when, conditions: value.when.conditions.filter((_, i) => i !== index) } })}><Trash2 size={14}/></Button></div>
            <label className="grid gap-2 text-sm font-medium">Which detail?<select aria-label="Which detail?" className={inputClass} value={predicate.choiceId} onChange={event => { const next = choices.find(item => item.id === event.target.value); if (next) update(index, makePredicate(next, 'present')); }}>
              {!choice && <option value={predicate.choiceId}>Saved condition unavailable</option>}{choices.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select></label>
            {choice ? <><label className="grid gap-2 text-sm font-medium">Condition<select aria-label="Condition" className={inputClass} value={predicate.operator} onChange={event => { const operator = choice.operators.find(item => item === event.target.value); if (operator) update(index, makePredicate(choice, operator)); }}>{choice.operators.map(operator => <option key={operator} value={operator}>{labels[operator]}</option>)}</select></label>
              {predicate.operator === 'contains' && <label className="grid gap-2 text-sm font-medium">Choice<select aria-label="Choice" className={inputClass} required value={predicate.optionId} onChange={event => update(index, { ...predicate, optionId: event.target.value })}>{choice.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}
              {(predicate.operator === 'equals' || predicate.operator === 'not_equals') && <LiteralEditor key={`${choice.id}:${predicate.operator}`} choice={choice} value={predicate.value} onChange={next => update(index, { ...predicate, value: next })}/>}</>
              : <p className="text-xs text-amber-800">This saved condition cannot be changed through these choices. Its rule must be reviewed first.</p>}
          </fieldset>;
        })}
        <Button type="button" disabled={blocked || !choices.length || value.when.conditions.length >= 20} onClick={() => value.when && onChange({ ...value, when: { ...value.when, conditions: [...value.when.conditions, makePredicate(choices[0], 'present')] } })}><Plus size={15}/>Add condition</Button>
        <p className="text-xs leading-5 text-slate-500">Choose approved details from this business. Changes to published rules need a review of existing records before they go live.</p>
      </div>}
    </fieldset>
  </section>;
}
function LiteralEditor({ value, choice, onChange }: { value: RequiredFactLiteral; choice: FieldRequirementChoice; onChange(value: RequiredFactLiteral): void }) {
  if (value.type === 'boolean') return <label className="grid gap-2 text-sm font-medium">Value<select aria-label="Value" className={inputClass} value={String(value.value)} onChange={event => onChange({ type: 'boolean', value: event.target.value === 'true' })}><option value="false">No</option><option value="true">Yes</option></select></label>;
  if (value.type === 'enum') return <label className="grid gap-2 text-sm font-medium">Value<select aria-label="Value" className={inputClass} required value={value.value} onChange={event => onChange({ type: 'enum', value: event.target.value })}>{choice.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
  if (value.type === 'money') return <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Amount<input className={inputClass} required inputMode="decimal" value={value.value.amount} onChange={event => onChange({ type: 'money', value: { ...value.value, amount: event.target.value } })}/></label><label className="grid gap-2 text-sm font-medium">Currency<select aria-label="Currency" className={inputClass} value={value.value.currency} required onChange={event => onChange({ type: 'money', value: { ...value.value, currency: event.target.value } })}>{choice.currencies?.map(currency => <option key={currency} value={currency}>{currency}</option>)}</select></label></div>;
  if (value.type === 'integer' || value.type === 'duration') return <label className="grid gap-2 text-sm font-medium">{value.type === 'duration' ? 'Duration (seconds)' : 'Value'}<input type="number" step={1} className={inputClass} required value={Number.isFinite(value.value) ? value.value : ''} onChange={event => onChange({ type: value.type, value: event.target.value === '' ? Number.NaN : Number(event.target.value) })}/></label>;
  const type = value.type === 'date' ? 'date' : value.type === 'datetime' ? 'datetime-local' : value.type === 'email' ? 'email' : value.type === 'url' ? 'url' : value.type === 'phone' ? 'tel' : 'text';
  return <label className="grid gap-2 text-sm font-medium">{value.type === 'datetime' ? 'Date and time (UTC)' : value.type === 'phone' ? 'Phone number (including country code)' : 'Value'}<input className={inputClass} required type={type} inputMode={value.type === 'decimal' ? 'decimal' : undefined} value={value.type === 'datetime' ? value.value.replace(/Z$/, '') : value.value} onChange={event => onChange({ type: value.type, value: value.type === 'datetime' && event.target.value ? `${event.target.value}Z` : event.target.value })}/></label>;
}
