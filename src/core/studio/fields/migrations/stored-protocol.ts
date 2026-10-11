import { z } from "zod";
import type { StudioFieldMigrationPreparation, StudioFieldMigrationReview } from "@/generated/prisma/client";
import { sealFieldMigrationIntent, readSealedFieldMigrationReview, FieldMigrationReviewError } from "./contracts";
import { sealRequiredFieldMigrationIntent, readSealedRequiredFieldMigrationReview } from "./required-contracts";

const header = z.object({ schemaVersion: z.union([z.literal(1), z.literal(2)]) });
function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
function version(input: unknown) {
  const result = header.safeParse(input);
  if (!result.success) throw new FieldMigrationReviewError("REVIEW_INVALID");
  return result.data.schemaVersion;
}

/** Integrity/tenant identity only, for a row loaded by the server. Format comes
 * from the actual stored JSON, never a request override or fallback. Full closed
 * version parsers still reject defaults/extra fields; hashes grant no native,
 * metadata, cohort, publication or execution authority. Each service must also
 * explicitly support this format before resolving principal or reading values. */
export function readStoredFieldMigrationIntent(row: Pick<StudioFieldMigrationPreparation, "id" | "organisationId" | "intent" | "intentChecksum">,
  authenticatedOrganisationId: string) {
  if (row.organisationId !== authenticatedOrganisationId) changed();
  const sealed = version(row.intent) === 1 ? sealFieldMigrationIntent(row.intent) : sealRequiredFieldMigrationIntent(row.intent);
  if (sealed.intent.organisationId !== authenticatedOrganisationId || sealed.intent.id !== row.id || sealed.checksum !== row.intentChecksum) changed();
  return sealed;
}

/** Retained review integrity only. No migration to a new protocol and no new
 * permission from a saved checksum. The caller still proves fresh server state. */
export function readStoredFieldMigrationReview(row: Pick<StudioFieldMigrationReview, "id" | "organisationId" | "definitionId" | "review" | "checksum">,
  authenticatedOrganisationId: string) {
  if (row.organisationId !== authenticatedOrganisationId) changed();
  const packet = { review: row.review, checksum: row.checksum };
  const sealed = version(row.review) === 1 ? readSealedFieldMigrationReview(packet) : readSealedRequiredFieldMigrationReview(packet);
  if (sealed.review.id !== row.id || sealed.review.organisationId !== authenticatedOrganisationId || sealed.review.definitionId !== row.definitionId) changed();
  return sealed;
}
