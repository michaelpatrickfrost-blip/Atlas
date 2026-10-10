import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { writeAudit } from "@/core/audit/log";
import { STUDIO_CAPABILITIES } from "../../permissions";
import { studioRegistry } from "../../registry/runtime";
import { checksum } from "../../registry/contracts";
import { compileCustomField } from "../../compiler/fields";
import { publishCompiledDefinitionInTransaction } from "../../definitions/publication";
import { assertFieldBinding, fieldDefinitionKey } from "../binding";
import { sealFieldMigrationIntent, readSealedFieldMigrationReview, FieldMigrationReviewError } from "./contracts";
import { withFieldMigrationAuthority } from "./authority";
import { inspectFieldMigrationReview } from "./inspection";
import { reviewedFieldPublicationPin, assertFieldMigrationPublicationReady } from "./publication-contract";

const requestSchema = z.strictObject({ preparationId: z.uuid(), revision: z.number().int().nonnegative().max(2147483647),
  reviewChecksum: z.string().regex(/^[a-f0-9]{64}$/), acknowledgeWarnings: z.boolean(), acknowledgeLoss: z.boolean() });
const targetSelect = { id: true, organisationId: true, definitionId: true, version: true, payload: true, compiledPlan: true, checksum: true } as const;
function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }

/** Internal exact reviewed publication. No public client hook, target values,
 * automatic activation or domain writes. Source remains active and readable.
 */
export async function publishReviewedFieldMigration(session: Session, input: unknown) {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  await assertModuleEnabled(session, "studio");
  const request = requestSchema.parse(input), scope = { id: request.preparationId, organisationId: session.organisationId };
  const initial = await db.studioFieldMigrationPreparation.findFirst({ where: scope });
  if (!initial) changed();
  const pinned = sealFieldMigrationIntent(initial.intent), intent = pinned.intent;
  if (pinned.checksum !== initial.intentChecksum || intent.id !== initial.id || intent.organisationId !== session.organisationId) changed();
  return withFieldMigrationAuthority(session, intent.principal, async ({ session: fresh, transaction: tx, company }) => {
    await tx.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id=${request.preparationId}::uuid AND "organisationId"=${fresh.organisationId} FOR UPDATE`;
    const preparation = await tx.studioFieldMigrationPreparation.findFirst({ where: scope, include: { review: true } });
    if (!preparation?.review || preparation.state !== "REVIEWED" || preparation.revision !== request.revision
      || preparation.intentChecksum !== pinned.checksum || checksum(preparation.intent) !== pinned.checksum) changed();
    const stored = readSealedFieldMigrationReview({ review: preparation.review.review, checksum: preparation.review.checksum });
    if (request.reviewChecksum !== stored.checksum) changed();
    const publicationScope = { preparationId: preparation.id, organisationId: fresh.organisationId, definitionId: intent.definitionId };
    await tx.$queryRaw`SELECT "preparationId" FROM studio_field_migration_publications WHERE "preparationId"=${preparation.id}::uuid AND "organisationId"=${fresh.organisationId} FOR UPDATE`;
    const existing = await tx.studioFieldMigrationPublication.findFirst({ where: publicationScope });
    if (existing && existing.state !== "PUBLISHED") changed();
    const registry = studioRegistry();
    const inspected = await inspectFieldMigrationReview({ session: fresh, transaction: tx }, registry, company, intent, existing ? "publication" : "preparation");
    if (inspected.checksum !== stored.checksum) changed();
    assertFieldMigrationPublicationReady(inspected.review, request.acknowledgeLoss);
    if (existing) {
      const target = await tx.studioDefinitionVersion.findFirst({ where: { id: existing.targetVersionId, organisationId: fresh.organisationId, definitionId: intent.definitionId }, select: targetSelect });
      if (!target) changed();
      const pin = reviewedFieldPublicationPin(stored, target, fresh.userId, request.acknowledgeLoss);
      if (Object.entries(pin).some(([key, value]) => existing[key as keyof typeof pin] !== value)) changed();
      return { id: preparation.id, state: "PUBLISHED" as const, publicationRevision: existing.revision, preparationRevision: preparation.revision,
        targetVersionId: existing.targetVersionId, sourceVersionId: intent.source.versionId, reviewChecksum: stored.checksum, replayed: true };
    }
    await tx.$queryRaw`SELECT d.id FROM studio_definitions d JOIN studio_drafts draft ON draft."definitionId"=d.id AND draft."organisationId"=d."organisationId"
      WHERE d.id=${intent.definitionId}::uuid AND d."organisationId"=${fresh.organisationId} FOR UPDATE OF d,draft`;
    const draft = await tx.studioDraft.findFirst({ where: { id: intent.target.draftId, definitionId: intent.definitionId, organisationId: fresh.organisationId,
      revision: intent.target.draftRevision, definition: { kind: "customField", revision: intent.definitionRevision, activeVersionId: intent.source.versionId, retiredAt: null } },
      include: { definition: true, baseVersion: { select: { version: true } } } });
    if (!draft) changed();
    const compiled = await compileCustomField(fresh, draft.payload, registry);
    if (compiled.checksum !== intent.target.compiledChecksum) changed();
    if (compiled.warnings.length && !request.acknowledgeWarnings) throw new Error("Acknowledge publication warnings first.");
    const published = await publishCompiledDefinitionInTransaction(tx, fresh, draft, draft.revision, compiled,
      async (bindingTx, actor, definitionId, key, versionId, payload) => {
        if (definitionId !== intent.definitionId || key !== fieldDefinitionKey(payload) || checksum(payload) !== checksum(intent.target.payload)) changed();
        const binding = await bindingTx.studioFieldBinding.findFirst({ where: { definitionId, organisationId: actor.organisationId, entityId: payload.entity.id, fieldKey: payload.field.key } });
        if (!binding) changed();
        await assertFieldBinding(bindingTx, actor, definitionId, intent.source.payload);
        await bindingTx.studioFieldGeneration.create({ data: { id: payload.storageGeneration, definitionId, organisationId: actor.organisationId,
          entityId: payload.entity.id, valueType: payload.field.storage.type, originVersionId: versionId } });
      });
    const pin = reviewedFieldPublicationPin(stored, published.version, fresh.userId, request.acknowledgeLoss);
    const publication = await tx.studioFieldMigrationPublication.create({ data: pin, select: { revision: true } });
    await writeAudit({ organisationId: fresh.organisationId, actorUserId: fresh.userId, action: "studio.field.migration.published",
      entityType: "StudioFieldMigrationPublication", entityId: preparation.id,
      after: { reviewChecksum: pin.reviewChecksum, sourceVersionId: intent.source.versionId, targetVersionId: pin.targetVersionId,
        sourceGenerationId: pin.sourceGenerationId, targetGenerationId: pin.targetGenerationId, acknowledgedLoss: pin.acknowledgedLoss, revision: publication.revision } }, tx);
    return { id: preparation.id, state: "PUBLISHED" as const, publicationRevision: publication.revision, preparationRevision: preparation.revision,
      targetVersionId: pin.targetVersionId, sourceVersionId: intent.source.versionId, reviewChecksum: pin.reviewChecksum, replayed: false };
  });
}
