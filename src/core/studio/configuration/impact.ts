import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { checksum } from "../registry/contracts";
import { versionedFieldPayloadSchema, type VersionedFieldPayload } from "../fields/required-contract";
import { whereUsedConfigurationInTransaction } from "./usage";

const meaning = (payload: VersionedFieldPayload) => checksum({ ...payload, field: { ...payload.field, label: "", help: "" } });

/** Caller already holds the common entity lock and its original Serializable
 * publication/activation transaction. Retained dependency paths count even when
 * intermediate metadata is inactive or retired. Cosmetic field labels/help may
 * evolve; an active design's generation/constraints/security may not drift.
 */
export async function assertFieldConfigurationCompatibilityInTransaction(session: Session, transaction: Prisma.TransactionClient,
  definitionId: string, candidate: VersionedFieldPayload) {
  const usage = await whereUsedConfigurationInTransaction(session, transaction, { definitionId, limit: 50 });
  // The usage helper traverses and seals the full bounded graph before slicing.
  let page = usage;
  let active = page.usages.some(value => value.active);
  while (!active && page.next) {
    page = await whereUsedConfigurationInTransaction(session, transaction, { definitionId, limit: 50, cursor: page.next });
    active = page.usages.some(value => value.active);
  }
  if (!active) return;
  const definition = await transaction.studioDefinition.findFirst({ where: { id: definitionId, organisationId: session.organisationId,
    kind: "customField", retiredAt: null }, include: { activeVersion: true } });
  const version = definition?.activeVersion;
  if (!version || definition.activeVersionId !== version.id || version.organisationId !== session.organisationId
    || version.definitionId !== definitionId || checksum(version.compiledPlan) !== version.checksum)
    throw new Error("DEPENDENCY_BROKEN: an active design's field metadata is unavailable.");
  const current = versionedFieldPayloadSchema.parse(version.payload);
  if (meaning(current) !== meaning(candidate))
    throw new Error("CONFIGURATION_IN_USE: update or remove the active screen and record designs that use this field before changing its structure or security.");
}
