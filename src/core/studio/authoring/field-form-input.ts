import { additionalFieldSetupSchema, additionalFieldTypeCatalogue, type AdditionalFieldSetup } from './field-setup-contract';

/** Friendly form decoding only. The owning service independently chooses current
 * field/target permissions, identities and storage. No posted metadata is authority. */
export function readAdditionalFieldSetup(form: FormData): AdditionalFieldSetup {
  const text = (name: string) => {
    const values = form.getAll(name);
    if (values.length > 1 || values.some(value => typeof value !== 'string')) throw new Error('Enter each setting once.');
    return values.length ? String(values[0]) : '';
  };
  const type = text('type'), descriptor = additionalFieldTypeCatalogue.find(value => value.id === type);
  if (!descriptor) throw new Error('Choose an available kind of detail.');
  for (const name of form.keys()) if (name.startsWith('setting.') && !descriptor.settings.some(value => `setting.${value}` === name))
    throw new Error('This setting does not belong to the selected kind of detail.');
  const integer = (name: string) => {
    const value = text(name);
    if (!/^-?(?:0|[1-9]\d*)$/.test(value)) throw new Error('Enter a whole number.');
    return Number(value);
  };
  const list = (name: string) => text(name).split(/[\n,]/).map(value => value.trim()).filter(Boolean);
  const choices = () => text('setting.choices').split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  const settings: Record<string, unknown> = {};
  for (const setting of descriptor.settings) {
    const name = `setting.${setting}`, value = text(name);
    if (setting === 'multiline' || setting === 'allowHttp') { if (value && value !== 'on') throw new Error('Choose a valid setting.'); settings[setting] = value === 'on'; }
    else if (setting === 'choices') settings[setting] = choices();
    else if (setting === 'currencies' || setting === 'countries') settings[setting] = list(name).map(value => value.toUpperCase());
    else if (['minLength', 'maxLength', 'precision', 'scale', 'maxSelections'].includes(setting) || (['min', 'max'].includes(setting) && (type === 'integer' || type === 'duration'))) {
      if (value) settings[setting] = integer(name);
    } else if (value) settings[setting] = value;
  }
  const enabled = text('initialValueEnabled');
  if (enabled && enabled !== 'on') throw new Error('Choose whether this field has a starting value.');
  let initialValue: unknown;
  if (enabled === 'on') {
    if (type === 'reference') throw new Error('Choose linked-record starting values through an approved record picker.');
    if (type === 'integer' || type === 'duration' || type === 'enum') initialValue = integer('initialValue');
    else if (type === 'boolean') {
      const value = text('initialValue'); if (value !== 'true' && value !== 'false') throw new Error('Choose Yes or No.'); initialValue = value === 'true';
    } else if (type === 'multi_enum') initialValue = form.getAll('initialValue').map(value => {
      if (typeof value !== 'string' || !/^(?:0|[1-9]\d*)$/.test(value)) throw new Error('Choose available starting options.'); return Number(value);
    });
    else if (type === 'money') initialValue = { amount: text('initialValue.amount'), currency: text('initialValue.currency').toUpperCase() };
    else if (type === 'address') initialValue = { line1: text('initialValue.line1'), line2: text('initialValue.line2'), city: text('initialValue.city'),
      region: text('initialValue.region'), postalCode: text('initialValue.postalCode'), country: text('initialValue.country').toUpperCase() };
    else if (type === 'datetime') {
      const value = text('initialValue'); initialValue = /^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?$/.test(value) ? `${value}${value.length === 16 ? ':00.000' : ''}Z` : value;
    } else initialValue = text('initialValue');
  }
  return additionalFieldSetupSchema.parse({ label: text('label'), help: text('help'), type, settings,
    ...(enabled === 'on' ? { initialValue } : {}) });
}
