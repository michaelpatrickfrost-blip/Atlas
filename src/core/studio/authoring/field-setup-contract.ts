import { z } from "zod";
import { addressValueSchema } from "../fields/value-contract";

const label = z.string().trim().min(1).max(100);
const common = { label, help: z.string().max(500).default("") };
const integer = z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER);
const decimal = z.string().regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/).max(40);
const numberBounds = { min: integer.optional(), max: integer.optional() };
const decimalSettings = { precision: z.number().int().min(1).max(28).default(28),
  scale: z.number().int().min(0).max(10).default(10), min: decimal.optional(), max: decimal.optional() };
const distinct = (values: readonly string[]) => new Set(values).size === values.length;
const currencies = z.array(z.string().regex(/^[A-Z]{3}$/)).min(1).max(30).refine(distinct, "Choose each currency once.");
const countries = z.array(z.string().regex(/^[A-Z]{2}$/)).min(1).max(250).refine(distinct, "Choose each country once.");
const choices = z.array(label).min(1).max(200).refine(values => distinct(values.map(value => value.toLowerCase())), "Give each choice a different label.");
const choiceIndex = z.number().int().min(0).max(199);
export const friendlyTextCharactersSchema = z.enum(["any", "letters", "letters_numbers", "numbers", "letters_numbers_spaces_dashes"]);
const referenceId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);

/** Browser-safe friendly inputs. Exact storage/registry/choice identities and
 * security policy are server-owned; no nested raw storage or arbitrary pattern.
 * initialValue is a literal of the chosen type, with choice indexes for choices.
 * Omission means no default; null never silently installs/removes one. */
export const additionalFieldSetupSchema = z.discriminatedUnion("type", [
  z.strictObject({ ...common, type: z.literal("string"), settings: z.strictObject({ minLength: z.number().int().min(0).max(4000).default(0),
    maxLength: z.number().int().min(1).max(4000).default(200), multiline: z.boolean().default(false),
    characters: friendlyTextCharactersSchema.default("any") }).prefault({}), initialValue: z.string().max(4000).optional() }),
  z.strictObject({ ...common, type: z.literal("integer"), settings: z.strictObject(numberBounds).prefault({}), initialValue: integer.optional() }),
  z.strictObject({ ...common, type: z.literal("decimal"), settings: z.strictObject(decimalSettings).prefault({}), initialValue: decimal.optional() }),
  z.strictObject({ ...common, type: z.literal("money"), settings: z.strictObject({ ...decimalSettings, currencies }),
    initialValue: z.strictObject({ amount: decimal, currency: z.string().regex(/^[A-Z]{3}$/) }).optional() }),
  z.strictObject({ ...common, type: z.literal("boolean"), settings: z.strictObject({}).prefault({}), initialValue: z.boolean().optional() }),
  z.strictObject({ ...common, type: z.literal("date"), settings: z.strictObject({}).prefault({}), initialValue: z.iso.date().optional() }),
  z.strictObject({ ...common, type: z.literal("datetime"), settings: z.strictObject({}).prefault({}), initialValue: z.iso.datetime().max(40).optional() }),
  z.strictObject({ ...common, type: z.literal("duration"), settings: z.strictObject({ min: integer.nonnegative().optional(), max: integer.nonnegative().optional() }).prefault({}),
    initialValue: integer.nonnegative().optional() }),
  z.strictObject({ ...common, type: z.literal("email"), settings: z.strictObject({}).prefault({}), initialValue: z.email().max(320).optional() }),
  z.strictObject({ ...common, type: z.literal("url"), settings: z.strictObject({ allowHttp: z.boolean().default(false) }).prefault({}), initialValue: z.url().max(2000).optional() }),
  z.strictObject({ ...common, type: z.literal("phone"), settings: z.strictObject({}).prefault({}), initialValue: z.string().regex(/^\+[1-9]\d{6,14}$/).optional() }),
  z.strictObject({ ...common, type: z.literal("enum"), settings: z.strictObject({ choices }), initialValue: choiceIndex.optional() }),
  z.strictObject({ ...common, type: z.literal("multi_enum"), settings: z.strictObject({ choices, maxSelections: z.number().int().min(1).max(200).default(30) }),
    initialValue: z.array(choiceIndex).max(200).refine(values => new Set(values).size === values.length, "Choose each default once.").optional() }),
  z.strictObject({ ...common, type: z.literal("reference"), settings: z.strictObject({ entityId: z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/) }), initialValue: referenceId.optional() }),
  z.strictObject({ ...common, type: z.literal("address"), settings: z.strictObject({ countries }), initialValue: addressValueSchema.optional() }),
]);
export type AdditionalFieldSetup = z.infer<typeof additionalFieldSetupSchema>;

/** Descriptive UI controls only, never an approval or runtime security grant. */
export const additionalFieldTypeCatalogue = [
  { id: "string", name: "Text", settings: ["minLength", "maxLength", "multiline", "characters"], initialValue: "text" },
  { id: "integer", name: "Whole number", settings: ["min", "max"], initialValue: "integer" },
  { id: "decimal", name: "Decimal number", settings: ["precision", "scale", "min", "max"], initialValue: "decimal_text" },
  { id: "money", name: "Money", settings: ["currencies", "precision", "scale", "min", "max"], initialValue: "amount_and_currency" },
  { id: "boolean", name: "Yes or no", settings: [], initialValue: "boolean" },
  { id: "date", name: "Date", settings: [], initialValue: "date" },
  { id: "datetime", name: "Date and time", settings: [], initialValue: "utc_datetime" },
  { id: "duration", name: "Duration", settings: ["min", "max"], initialValue: "seconds" },
  { id: "email", name: "Email address", settings: [], initialValue: "email" },
  { id: "url", name: "Web address", settings: ["allowHttp"], initialValue: "url" },
  { id: "phone", name: "Phone number", settings: [], initialValue: "international_phone" },
  { id: "enum", name: "Choose one", settings: ["choices"], initialValue: "choice_index" },
  { id: "multi_enum", name: "Choose several", settings: ["choices", "maxSelections"], initialValue: "choice_indexes" },
  { id: "reference", name: "Linked record", settings: ["entityId"], initialValue: "record_id" },
  { id: "address", name: "Address", settings: ["countries"], initialValue: "address" },
] as const;
