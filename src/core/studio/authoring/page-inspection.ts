import { z } from "zod";
import { assertCapability } from "@/core/permissions/check";
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from "../fields/runtime-authority";
import { STUDIO_CAPABILITIES as CAP } from "../permissions";
import { pagePayloadSchema } from "../pages/schema";
import { compileStructuredPage } from "../pages/definition-compiler";

const revision = z.number().int().nonnegative().max(2147483646);
const request = z.strictObject({ definitionId: z.uuid(), revision, definitionRevision: revision, payload: pagePayloadSchema });

/** Unsaved metadata inspection only. The original compiler checks actual owner,
 * all used source/field/View rights, exact pins, types and budgets. No provider,
 * draft validation write, Audit, publication or business-record read is needed.
 * A successful check is never a saved-head publication approval. */
export async function inspectPageDraftInTransaction(supplied: FieldRuntimeAuthority, input: unknown) {
  assertCapability(supplied.session, CAP.edit);
  const value = request.parse(input);
  const authority = await fieldRuntimeAuthorityInTransaction(supplied.session, supplied.transaction);
  assertCapability(authority.session, CAP.edit);
  const draft = await authority.transaction.studioDraft.findFirst({ where: { definitionId: value.definitionId,
    organisationId: authority.session.organisationId, revision: value.revision,
    definition: { kind: "page", retiredAt: null, revision: value.definitionRevision } },
    select: { definitionId: true, organisationId: true, revision: true, payload: true,
      definition: { select: { id: true, organisationId: true, revision: true, kind: true, retiredAt: true } } } });
  if (!draft || draft.definitionId !== value.definitionId || draft.organisationId !== authority.session.organisationId
    || draft.revision !== value.revision || draft.definition.id !== value.definitionId
    || draft.definition.organisationId !== authority.session.organisationId || draft.definition.revision !== value.definitionRevision
    || draft.definition.kind !== "page" || draft.definition.retiredAt !== null)
    throw new Error("CONFLICT: the saved screen changed. Your draft is kept; compare it before saving.");
  const previous = pagePayloadSchema.parse(draft.payload);
  if (value.payload.entity.id !== previous.entity.id)
    throw new Error("Choose a new screen to design a different business area.");
  const compiled = await compileStructuredPage(authority, value.payload);
  return { revision: value.revision, definitionRevision: value.definitionRevision,
    payload: compiled.payload, warnings: compiled.warnings };
}
