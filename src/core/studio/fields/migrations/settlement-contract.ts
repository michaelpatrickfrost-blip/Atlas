import { z } from "zod";
import { canonicalJson, checksum } from "../../registry/contracts";
import { fieldMigrationPrincipalSchema } from "../principal-contract";
import { FieldMigrationReviewError } from "./contracts";
import { fieldMigrationCutoverPinSchema } from "./cutover-contract";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const transitionRevision = z.number().int().nonnegative().max(2147483646);
const dispositionSchema = z.enum(["ROLLED_BACK", "FINALIZED"]);
const retainedIdentitySchema = z.strictObject({ pin: fieldMigrationCutoverPinSchema, checksum: digest });

/** Confirm an observed unchanged-data window. Tenant, principal, target, mode
 * and permissions are resolved by the owning server operation, never this input. */
export const fieldMigrationSettlementRequestSchema = z.strictObject({ preparationId: z.uuid(), cutoverChecksum: digest,
  cutoverRevision: z.literal(0), definitionRevision: transitionRevision, publicationRevision: transitionRevision });
export const fieldMigrationSettlementPinSchema = z.strictObject({ schemaVersion: z.literal(1), cutoverChecksum: digest,
  preparationId: z.uuid(), organisationId: z.string().min(1).max(100), definitionId: z.uuid(), sourceVersionId: z.uuid(), targetVersionId: z.uuid(),
  definitionRevision: transitionRevision, publicationRevision: transitionRevision,
  principal: fieldMigrationPrincipalSchema, disposition: dispositionSchema });
export type FieldMigrationSettlementPin = z.infer<typeof fieldMigrationSettlementPinSchema>;
const packetSchema = z.strictObject({ pin: fieldMigrationSettlementPinSchema, checksum: digest });

function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
function canonical<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.parse(input);
  if (canonicalJson(parsed) !== canonicalJson(input)) changed();
  return parsed;
}

/** Pure retained identity. Before changing a pointer, callers must inspect actual
 * locked receipt/state/configuration under current authority and prove unchanged
 * owner/private/native/source/target/field/reference coverage. A checksum or this
 * pin grants none of those permissions. Finalization only ends rollback eligibility;
 * it never grants ordinary value access or performs reverse conversion. */
export function createFieldMigrationSettlementPin(retainedCutover: unknown, serverPrincipal: unknown, disposition: z.infer<typeof dispositionSchema>) {
  const retained = canonical(retainedIdentitySchema, retainedCutover), cutover = retained.pin;
  const principal = canonical(fieldMigrationPrincipalSchema, serverPrincipal);
  if (retained.checksum !== checksum(cutover) || principal.organisationId !== cutover.publication.organisationId
    || cutover.source.versionId === cutover.publication.targetVersionId
    || cutover.publication.sourceGenerationId === cutover.publication.targetGenerationId) changed();
  const pin = fieldMigrationSettlementPinSchema.parse({ schemaVersion: 1, cutoverChecksum: retained.checksum,
    preparationId: cutover.publication.preparationId, organisationId: cutover.publication.organisationId, definitionId: cutover.publication.definitionId,
    sourceVersionId: cutover.source.versionId, targetVersionId: cutover.publication.targetVersionId,
    definitionRevision: cutover.definitionRevision + 1, publicationRevision: cutover.publication.revision + 1, principal, disposition });
  return { pin, checksum: checksum(pin) };
}

/** Historical integrity, independent of today's active pointer or actor grants.
 * The actual immutable settlement row/Audit remains the history authority. */
export function readFieldMigrationSettlementPin(retainedCutover: unknown, storedSettlement: unknown) {
  const stored = canonical(packetSchema, storedSettlement);
  const expected = createFieldMigrationSettlementPin(retainedCutover, stored.pin.principal, stored.pin.disposition);
  if (stored.checksum !== checksum(stored.pin) || canonicalJson(stored) !== canonicalJson(expected)) changed();
  return stored;
}

export function assertFieldMigrationSettlementConfirmation(input: unknown, serverSettlement: unknown) {
  const request = fieldMigrationSettlementRequestSchema.parse(input), stored = canonical(packetSchema, serverSettlement);
  if (stored.checksum !== checksum(stored.pin) || request.preparationId !== stored.pin.preparationId
    || request.cutoverChecksum !== stored.pin.cutoverChecksum || request.definitionRevision !== stored.pin.definitionRevision
    || request.publicationRevision !== stored.pin.publicationRevision) changed();
}

/** Intended metadata transition, not mutation/readiness authority or a claim
 * about the active version after later legitimate configuration changes. */
export function fieldMigrationSettlementTransition(input: unknown) {
  const pin = canonical(fieldMigrationSettlementPinSchema, input), rollback = pin.disposition === "ROLLED_BACK";
  return { cutover: { state: pin.disposition, revision: 1 as const },
    publication: { state: rollback ? "ROLLED_BACK" as const : "COMPLETED" as const, revision: pin.publicationRevision + 1 },
    definition: { versionId: rollback ? pin.sourceVersionId : pin.targetVersionId, revision: pin.definitionRevision + (rollback ? 1 : 0) } };
}
