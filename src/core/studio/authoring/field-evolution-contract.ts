import { z } from "zod";
import { additionalFieldSetupSchema } from "./field-setup-contract";

const revision = z.number().int().nonnegative().max(2147483646);
const uuid = z.uuid().transform(value => value.toLowerCase());
const choiceIndex = z.number().int().min(0).max(199);

/** Friendly conversion choices only. The server resolves target choice ordinals
 * into the exact saved option IDs before the existing migration services seal
 * an intent. No arbitrary expression, currency inference or local timezone. */
export const friendlyFieldConversionSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("same_type") }),
  z.strictObject({ kind: z.literal("integer_to_decimal") }),
  z.strictObject({ kind: z.literal("string_to_enum"), mapping: z.array(z.strictObject({
    from: z.string().min(1).max(4000), toChoice: choiceIndex,
  })).max(1000).refine(rows => new Set(rows.map(row => row.from)).size === rows.length, "Map each existing text once."),
    unmapped: z.enum(["reject", "empty"]) }),
  z.strictObject({ kind: z.literal("date_to_datetime"), timezone: z.literal("UTC"), time: z.literal("start_of_day") }),
  z.strictObject({ kind: z.literal("datetime_to_date"), timezone: z.literal("UTC"), loss: z.enum(["reject", "allow_time_loss"]) }),
]);
export type FriendlyFieldConversion = z.infer<typeof friendlyFieldConversionSchema>;

/** No client field key, generation, grant, source hash or raw option identity.
 * Explicit source ordinals distinguish a rename/reorder from a new choice;
 * omitted previous choices are retained as retired by the server. */
export const additionalFieldEvolutionDraftSchema = z.strictObject({
  definitionId: uuid, revision, definitionRevision: revision, sourceVersionId: uuid,
  setup: additionalFieldSetupSchema, conversion: friendlyFieldConversionSchema,
  choiceSourceIndexes: z.array(choiceIndex.nullable()).min(1).max(200).optional(),
}).superRefine((value, ctx) => {
  const indexes = value.choiceSourceIndexes;
  if (!indexes) return;
  if (!(value.setup.type === "enum" || value.setup.type === "multi_enum")
    || indexes.length !== value.setup.settings.choices.length || value.conversion.kind !== "same_type")
    ctx.addIssue({ code: "custom", message: "Match each choice to its previous choice or choose New choice." });
  const retained = indexes.filter(index => index !== null);
  if (new Set(retained).size !== retained.length)
    ctx.addIssue({ code: "custom", message: "Use each previous choice once." });
});
export type AdditionalFieldEvolutionDraft = z.infer<typeof additionalFieldEvolutionDraftSchema>;
