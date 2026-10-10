import { z } from "zod";
import { canonicalJson } from "../../registry/contracts";
import { FieldMigrationReviewError } from "./contracts";
import { fieldMigrationCutoverPinSchema } from "./cutover-contract";
import { fieldMigrationExecutionPinSchema } from "./execution-contract";
import { readFieldMigrationCutoverIdentity } from "./cutover-receipt";
import { readFieldMigrationSettlementPin } from "./settlement-contract";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const publicationIdentity = fieldMigrationExecutionPinSchema.shape.publication;
const publicationSchema = z.strictObject({ ...publicationIdentity.shape, state: z.enum(["CUTOVER", "ROLLED_BACK", "COMPLETED"]),
  revision: z.number().int().nonnegative().max(2147483647) });
const receiptIdentity = z.strictObject({ preparationId: z.uuid(), organisationId: z.string(), definitionId: z.uuid(), sourceVersionId: z.uuid(),
  targetVersionId: z.uuid(), pin: fieldMigrationCutoverPinSchema, pinChecksum: digest, createdBy: z.string() });
const receiptSchema = z.strictObject({ ...receiptIdentity.shape, state: z.enum(["ACTIVATED", "ROLLED_BACK", "FINALIZED"]),
  revision: z.number().int().min(0).max(1), settlementPin: z.unknown(), settlementChecksum: digest.nullable(),
  settledBy: z.string().min(1).max(100).nullable(), settledAt: z.iso.datetime().nullable() });
function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }

/** Closed server projections of actual retained rows. Identity/pairing only;
 * neither today's active version nor current actor access is inferred from history.
 * In particular, terminal receipts remain valid after later legitimate editing. */
export function readFieldMigrationSettlementReceipt(storedReview: unknown, serverExecution: unknown, serverPublication: unknown, serverReceipt: unknown) {
  const publication = publicationSchema.parse(serverPublication), receipt = receiptSchema.parse(serverReceipt);
  if (canonicalJson(publication) !== canonicalJson(serverPublication) || canonicalJson(receipt) !== canonicalJson(serverReceipt)) changed();
  const original = receiptIdentity.parse(Object.fromEntries(Object.entries(receipt).filter(([key]) => key in receiptIdentity.shape)));
  const published = publicationIdentity.parse(Object.fromEntries(Object.entries(publication).filter(([key]) => key in publicationIdentity.shape)));
  const retained = readFieldMigrationCutoverIdentity(storedReview, serverExecution, published, original);
  if (receipt.state === "ACTIVATED") {
    if (receipt.revision !== 0 || publication.state !== "CUTOVER" || publication.revision !== retained.pin.publication.revision + 1
      || receipt.settlementPin !== null || receipt.settlementChecksum !== null || receipt.settledBy !== null || receipt.settledAt !== null) changed();
    return { retained, settlement: null, state: receipt.state };
  }
  if (receipt.revision !== 1 || publication.state !== (receipt.state === "ROLLED_BACK" ? "ROLLED_BACK" : "COMPLETED")
    || receipt.settlementPin === null || receipt.settlementChecksum === null || receipt.settledBy === null || receipt.settledAt === null) changed();
  const settlement = readFieldMigrationSettlementPin(retained, { pin: receipt.settlementPin, checksum: receipt.settlementChecksum });
  if (settlement.pin.disposition !== receipt.state || receipt.settledBy !== settlement.pin.principal.userId
    || publication.revision !== settlement.pin.publicationRevision + 1) changed();
  return { retained, settlement, state: receipt.state };
}
