import { versionedFieldPayloadSchema } from '../fields/required-contract';
import { additionalFieldSetupSchema, type AdditionalFieldSetup } from './field-setup-contract';

export type AdditionalFieldSetupProjection = { kind: 'editable'; initial: AdditionalFieldSetup } | { kind: 'read_only'; reason: string };
const readOnly = (reason: string): AdditionalFieldSetupProjection => ({ kind: 'read_only', reason });
/** Pure friendly metadata projection, not an authorisation. Caller first checks
 * genuine current field/default access and NEVER-published status. Unsupported
 * settings return an explicit reason; they are never guessed or silently erased. */
export function projectAdditionalFieldSetup(input: unknown, referenceTargets: readonly { id: string }[]): AdditionalFieldSetupProjection {
  const parsed = versionedFieldPayloadSchema.safeParse(input);
  if (!parsed.success) return readOnly('These saved rules need their existing reviewed field editor.');
  if (parsed.data.schemaVersion !== 1) return readOnly('Conditional rules stay in the existing reviewed field workflow. You can keep using this field without changing its rules.');
  const { field, entity } = parsed.data, storage = field.storage, defaultValue = field.defaultValue;
  let settings: Record<string, unknown> = {}, initialValue: unknown = defaultValue?.value;
  switch (storage.type) {
    case 'string': {
      let characters = 'any';
      if (storage.pattern) {
        const classes = { letters: 'A-Za-z', letters_numbers: 'A-Za-z0-9', numbers: '0-9', letters_numbers_spaces_dashes: 'A-Za-z0-9 _-' } as const;
        const supported = Object.entries(classes).find(([, value]) => storage.pattern === `^[${value}]{${storage.minLength},${storage.maxLength}}$`);
        if (!supported) return readOnly('This field has character rules that the simple settings cannot represent. Its saved rules are kept.');
        characters = supported[0];
      }
      settings = { minLength: storage.minLength, maxLength: storage.maxLength, multiline: storage.multiline, characters }; break;
    }
    case 'integer': case 'duration': settings = { ...(storage.min !== undefined ? { min: storage.min } : {}), ...(storage.max !== undefined ? { max: storage.max } : {}) }; break;
    case 'decimal': case 'money': settings = { precision: storage.precision, scale: storage.scale, ...(storage.min !== undefined ? { min: storage.min } : {}),
      ...(storage.max !== undefined ? { max: storage.max } : {}), ...(storage.type === 'money' ? { currencies: storage.currencies } : {}) }; break;
    case 'boolean': case 'date': case 'datetime': case 'email': case 'phone': break;
    case 'url': {
      const protocols = new Set(storage.protocols);
      if (!protocols.has('https') || protocols.size !== storage.protocols.length) return readOnly('These web-address rules need the existing field editor. Its saved rules are kept.');
      settings = { allowHttp: protocols.has('http') }; break;
    }
    case 'enum': case 'multi_enum': {
      if (storage.options.some(option => option.retired)) return readOnly('This field retains previous choices. Use its existing reviewed choice workflow so history is kept.');
      settings = { choices: storage.options.map(option => option.label), ...(storage.type === 'multi_enum' ? { maxSelections: storage.maxSelections } : {}) };
      const index = (id: string) => storage.options.findIndex(option => option.id === id);
      if (defaultValue?.type === 'enum') initialValue = index(defaultValue.value);
      if (defaultValue?.type === 'multi_enum') initialValue = defaultValue.value.map(index).sort((left, right) => left - right);
      if ((typeof initialValue === 'number' && initialValue < 0) || (Array.isArray(initialValue) && initialValue.some(value => typeof value !== 'number' || value < 0)))
        return readOnly('A saved starting choice is unavailable. Restore it before changing these settings.');
      break;
    }
    case 'reference': {
      if (defaultValue) return readOnly('This field has a saved starting record. Its settings stay unchanged until an approved record picker can preserve that choice.');
      const target = storage.entity;
      if (!referenceTargets.some(value => value.id === target.id) || target.id !== entity.id || target.version !== entity.version
        || target.schemaHash !== entity.schemaHash || target.contractHash !== entity.contractHash)
        return readOnly('The saved linked-record choice is unavailable or uses a different approved version. Its settings are kept.');
      settings = { entityId: target.id }; break;
    }
    case 'address': settings = { countries: storage.countries }; break;
  }
  const friendly = additionalFieldSetupSchema.safeParse({ label: field.label, help: field.help, type: storage.type, settings,
    ...(defaultValue !== undefined ? { initialValue } : {}) });
  return friendly.success ? { kind: 'editable', initial: friendly.data } : readOnly('These saved settings cannot be represented safely by the simple editor. Its rules are kept.');
}
