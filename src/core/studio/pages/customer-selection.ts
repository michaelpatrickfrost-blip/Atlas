import { sessionAuthorityStamp } from "@/core/auth/session";
import { referenceSchema } from "../compiler/reference";
import type { FieldRuntimeAuthority } from "../fields/runtime-authority";
import type { ContractReference } from "../registry/types";
import type { PageReadAnchor, PageReadRequest } from "./owner-contract";
import type { PageDisplayModel } from "./render-model";

/** Internal server selection, constructed only after the original active-pointer
 * or canonical profile-selected retained Page loader and shared data reader.
 * Never accept this object from a browser or serialise its live authority. */
export type CustomerPageSelection = {
  authority: FieldRuntimeAuthority;
  view: { definitionId: string; definitionRevision: number; versionId: string; model: PageDisplayModel };
  sourcePage: ContractReference;
  request: PageReadRequest;
  formFactor: PageDisplayModel["formFactor"];
  componentId: string;
  /** Record-default loader binds the same fresh native revision/full owner CAS
   * anchor used to resolve the canonical profile. Legacy active pages omit it. */
  expectedAnchor?: PageReadAnchor;
};
function unavailable(): never { throw new Error("NOT_FOUND: this business screen is unavailable."); }
function genuine(selection: CustomerPageSelection) {
  const { authority } = selection, stamp = sessionAuthorityStamp(authority.session);
  if (!stamp || stamp !== authority.stamp || stamp.organisationId !== authority.session.organisationId
    || stamp.userId !== authority.session.userId || stamp.membershipId !== authority.session.membershipId)
    throw new Error("FORBIDDEN: current authenticated business access is required.");
}
function visible(selection: CustomerPageSelection) {
  genuine(selection);
  const matches = selection.view.model.sections.flatMap(section => section.components).filter(value => value.id === selection.componentId);
  if (matches.length !== 1) unavailable();
  return matches[0];
}
async function owner(selection: CustomerPageSelection) {
  const { authority, sourcePage, request, expectedAnchor } = selection;
  const result = await authority.registry.authorisePageRead({ session: authority.session, transaction: authority.transaction }, sourcePage, request);
  if (result.anchor.kind !== request.kind || result.anchor.organisationId !== authority.session.organisationId
    || (request.kind === "record" && (result.anchor.kind !== "record" || result.anchor.recordId !== request.recordId))) unavailable();
  if (expectedAnchor && (result.anchor.kind !== expectedAnchor.kind || result.anchor.organisationId !== expectedAnchor.organisationId
    || (expectedAnchor.kind === "record" && (result.anchor.kind !== "record" || result.anchor.recordId !== expectedAnchor.recordId
      || result.anchor.revision !== expectedAnchor.revision || result.anchor.nativeRevision !== expectedAnchor.nativeRevision))))
    throw new Error("CONFLICT: this record's business layout changed. Refresh before using its buttons.");
  return result;
}

/** Shared visible read-only command seam. This prepares metadata only; the
 * native owning endpoint must bind input and repeat its domain access checks. */
export async function prepareVisibleCustomerAction(selection: CustomerPageSelection) {
  const component = visible(selection);
  if (component.type !== "action") unavailable();
  const { authority, view, sourcePage, formFactor } = selection, owning = await owner(selection);
  const command = await authority.registry.resolve(authority.session, component.command);
  const approval = owning.policy.commands.find(value => value.command.id === command.id && value.command.version === command.version);
  if (command.kind !== "command" || command.ownerModuleId !== owning.source.ownerModuleId || !approval
    || !approval.formFactors.includes(formFactor) || (approval.confirmation === "required" && !component.confirm)
    || command.details.sideEffect !== "none") unavailable();
  return { authority, definitionId: view.definitionId, definitionRevision: view.definitionRevision, versionId: view.versionId,
    sourcePage, ownerModuleId: owning.source.ownerModuleId, anchor: owning.anchor,
    component: { id: component.id, confirm: component.confirm, preview: component.preview },
    command: referenceSchema.parse({ id: command.id, version: command.version, schemaHash: command.schemaHash, contractHash: command.contractHash }) };
}

/** Shared registered native form seam. The original owner still constructs the
 * complete current manifest and executes its existing domain action. */
export async function prepareVisibleCustomerSurface(selection: CustomerPageSelection) {
  const component = visible(selection);
  if (component.type !== "surface" || !component.surface) unavailable();
  const { authority, request, formFactor } = selection, owning = await owner(selection);
  const surface = await authority.registry.resolve(authority.session, component.surface);
  const approval = owning.policy.surfaces.find(value => value.surface.id === surface.id && value.surface.version === surface.version);
  if (surface.kind !== "surface" || surface.ownerModuleId !== owning.source.ownerModuleId || !approval
    || approval.family !== component.family || !approval.formFactors.includes(formFactor)
    || owning.anchor.kind !== "record" || request.kind !== "record" || owning.anchor.recordId !== request.recordId
    || owning.anchor.organisationId !== authority.session.organisationId) unavailable();
  return { authority, anchor: owning.anchor, surface: referenceSchema.parse({ id: surface.id, version: surface.version,
    schemaHash: surface.schemaHash, contractHash: surface.contractHash }), ownerModuleId: owning.source.ownerModuleId };
}
