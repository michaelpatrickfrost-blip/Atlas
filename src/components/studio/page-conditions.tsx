'use client';
import type { VisibilityPredicate } from '@/core/studio/pages/schema';
import { Button } from '@/components/ui/button';
import { inputClass } from '@/components/ui/service-fields';
import { conditionFromRules, editableRules, factRule, firstConditionRule, hasConditionChoices, recordTypeRule, type PageEditorConditions } from './page-conditions-model';

/** Approved labels/scalar choices only. This edits metadata; the owning runtime
 * independently checks current grants and facts before selecting a live layout. */
export function PageConditionControls({ value, catalog, change, required = false }: { value?: VisibilityPredicate; catalog: PageEditorConditions; change: (value: VisibilityPredicate | undefined) => void; required?: boolean }) {
  const simple = editableRules(value, catalog), usable = catalog.facts.filter(fact => fact.choices.length), types = catalog.recordTypes ?? [], available = hasConditionChoices(catalog), rules = simple?.rules ?? [];
  const replace = () => { if (available) change(firstConditionRule(catalog)); };
  if (!simple) return <div className="space-y-3 rounded-xl border p-3"><p className="text-xs leading-5">This saved rule uses advanced conditions. It is kept exactly as saved.</p><Button type="button" disabled={!available} onClick={replace}>Replace with a simple condition</Button>{!required && <Button type="button" variant="ghost" onClick={() => change(undefined)}>Show always instead</Button>}</div>;
  const update = (next: typeof rules, mode = simple.mode) => change(conditionFromRules(mode, next));
  return <div className="space-y-3 rounded-xl border p-3">
    {!required && <label className="block space-y-1 text-xs"><span>Show this item</span><select className={inputClass} value={rules.length ? 'when' : 'always'} onChange={event => event.target.value === 'always' ? change(undefined) : replace()}><option value="always">Always</option><option value="when" disabled={!available}>When conditions match</option></select></label>}
    {rules.length > 1 && <label className="block space-y-1 text-xs"><span>Match conditions</span><select className={inputClass} value={simple.mode} onChange={event => update(rules, event.target.value === 'any' ? 'any' : 'all')}><option value="all">All conditions</option><option value="any">Any condition</option></select></label>}
    {rules.map((rule, index) => {
      const fact = rule.kind === 'fact' ? usable.find(value => value.id === rule.factId)! : null;
      const setRule = (next: typeof rule) => update(rules.map((value, i) => i === index ? next : value));
      return <div key={index} className="space-y-2 border-t pt-3"><label className="block space-y-1 text-xs"><span>Business detail {index + 1}</span><select className={inputClass} value={rule.kind === 'recordType' ? '__record_type__' : rule.factId} onChange={event => setRule(event.target.value === '__record_type__' ? recordTypeRule(catalog) : factRule(catalog, event.target.value))}>{usable.map(value => <option key={value.id} value={value.id}>{value.label}</option>)}{types.length > 0 && <option value="__record_type__">Business record type</option>}</select></label>
        <label className="block space-y-1 text-xs"><span>Is equal to {index + 1}</span>{rule.kind === 'recordType' ? <select className={inputClass} value={types.findIndex(type => type.id === rule.definitionId)} onChange={event => { const type = types[Number(event.target.value)]; if (type) setRule(recordTypeRule(catalog, type.id)); }}>{types.map((type, i) => <option key={type.id} value={i}>{type.label}</option>)}</select> : <select className={inputClass} value={fact!.choices.findIndex(choice => choice.value === rule.values[0])} onChange={event => setRule(factRule(catalog, fact!.id, Number(event.target.value)))}>{fact!.choices.map((choice, i) => <option key={i} value={i}>{choice.label}</option>)}</select>}</label>
        <Button type="button" variant="ghost" disabled={required && rules.length === 1} onClick={() => update(rules.filter((_, i) => i !== index))}>Remove condition {index + 1}</Button></div>;
    })}
    <Button type="button" disabled={!available || rules.length >= 8} onClick={() => update([...rules, firstConditionRule(catalog)])}>Add condition</Button>
    <p className="text-xs leading-5 text-[var(--color-ink-muted)]">Visibility changes presentation. Required details and business permissions still apply.</p>
  </div>;
}
