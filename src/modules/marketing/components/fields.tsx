export const fieldClass = 'mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-atlas-blue)]';

export function Field({ name, label, type = 'text', value = '', required = true }: { name: string; label: string; type?: string; value?: string; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-[var(--color-ink)]">
      {label}
      <input className={fieldClass} name={name} type={type} defaultValue={value} required={required} />
    </label>
  );
}

export function Area({ name, label, required = true }: { name: string; label: string; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-[var(--color-ink)]">
      {label}
      <textarea className={fieldClass} name={name} required={required} rows={3} />
    </label>
  );
}

export function Choice({ name, label, options, optional = false, value }: { name: string; label: string; options: { value: string; label: string }[]; optional?: boolean; value?: string }) {
  return (
    <label className="block text-sm font-medium text-[var(--color-ink)]">
      {label}
      <select className={fieldClass} name={name} required={!optional} defaultValue={value}>
        {optional && <option value="">None</option>}
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
