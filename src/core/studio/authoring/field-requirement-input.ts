import { z } from 'zod';
import { requiredFactLiteralSchema } from '../fields/required-contract';
const choiceId = z.string().min(1).max(100).regex(/^(?:native:[a-z][a-z0-9_]*|field:[a-f0-9-]{36})$/);
const source = { choiceId };
export const friendlyRequiredPredicateSchema = z.discriminatedUnion('operator', [
  z.strictObject({ ...source, operator: z.literal('present') }),
  z.strictObject({ ...source, operator: z.literal('absent') }),
  z.strictObject({ ...source, operator: z.literal('equals'), value: requiredFactLiteralSchema }),
  z.strictObject({ ...source, operator: z.literal('not_equals'), value: requiredFactLiteralSchema }),
  z.strictObject({ ...source, operator: z.literal('contains'), optionId: z.string().regex(/^[a-z][a-z0-9_]*$/).max(64) }),
]);
export const additionalFieldRequirementSchema = z.strictObject({ always: z.boolean(),
  when: z.strictObject({ match: z.enum(['all', 'any']), conditions: z.array(friendlyRequiredPredicateSchema).min(1).max(20) }).nullable(),
});
export const readAdditionalFieldRequirementSchema = z.strictObject({ definitionId: z.uuid().transform(value => value.toLowerCase()) });
export const saveAdditionalFieldRequirementSchema = readAdditionalFieldRequirementSchema.extend({
  revision: z.number().int().nonnegative().max(2147483646), requirement: additionalFieldRequirementSchema,
});
export type AdditionalFieldRequirement = z.infer<typeof additionalFieldRequirementSchema>;
export type FriendlyRequiredPredicate = z.infer<typeof friendlyRequiredPredicateSchema>;
export type FieldRequirementChoice = {
  id: string; label: string; type: string;
  operators: readonly FriendlyRequiredPredicate['operator'][];
  options?: readonly { value: string; label: string }[];
  currencies?: readonly string[];
};
/** Presentation catalogue only. The server reloads actual approved sources/pins
 * and validates every operator/literal; these DTOs never supply authority. */
export type AdditionalFieldRequirementEditor = {
  definitionId: string; revision: number; initial: AdditionalFieldRequirement;
  choices: FieldRequirementChoice[]; editable: boolean; reason: string | null;
};

/** Active source identity is reloaded server-side; a client pin is only a CAS
 * expectation, never field/tenant/owner authority. */
export const saveAdditionalFieldRequirementEvolutionSchema = saveAdditionalFieldRequirementSchema.extend({
  definitionRevision: z.number().int().nonnegative().max(2147483646),
  sourceVersionId: readAdditionalFieldRequirementSchema.shape.definitionId,
});
export type AdditionalFieldRequirementEvolutionEditor = AdditionalFieldRequirementEditor & {
  definitionRevision: number; sourceVersionId: string;
};
