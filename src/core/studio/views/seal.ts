import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { sessionAuthorityStamp } from "@/core/auth/session";
import { inspectViewVersionPin, sealedConfigurationVersionSelection } from "../configuration/pins";
import type { FieldRuntimeAuthority } from "../fields/runtime-authority";
import { viewPayloadSchema, viewVersionReferenceSchema } from "./schema";
import { materialiseCompiledView } from "./definition-compiler";

function broken(): never { throw new Error("DEPENDENCY_BROKEN: the published business view is unavailable or incompatible."); }
export { inspectViewVersionPin, inspectRetainedViewVersionPin } from "../configuration/pins";
export async function loadSealedViewVersion(session: Session, tx: Prisma.TransactionClient, input: unknown) {
  const pin = viewVersionReferenceSchema.parse(input);
  const version = await tx.studioDefinitionVersion.findFirst({ where: { id: pin.versionId, definitionId: pin.definitionId,
    organisationId: session.organisationId }, select: sealedConfigurationVersionSelection });
  if (!version) broken();
  inspectViewVersionPin(session.organisationId, pin, version);
  return version;
}
/** Current genuine metadata reconstruction, not a business Read/Manage grant.
 * Pure owner validation checks all exact current contract/module/support policy
 * before the complete compiled seal comparison. No query/provider executes. */
export async function inspectPublishedViewInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const stamp = sessionAuthorityStamp(authority.session);
  if (!stamp || stamp !== authority.stamp || stamp.userId !== authority.session.userId
    || stamp.organisationId !== authority.session.organisationId || stamp.membershipId !== authority.session.membershipId)
    throw new Error("FORBIDDEN: genuine current view metadata authority is required.");
  const pin = viewVersionReferenceSchema.parse(input), version = await loadSealedViewVersion(authority.session, authority.transaction, pin);
  const payload = viewPayloadSchema.parse(version.payload);
  const compiled = await authority.registry.reconstructViewSourceMetadataInTransaction(
    { session: authority.session, transaction: authority.transaction }, payload.sourceView, payload.content);
  const materialised = materialiseCompiledView(payload, compiled);
  if (materialised.checksum !== pin.checksum) broken();
  return { version, plan: materialised.plan };
}
