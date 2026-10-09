"use server";
import { studioActionContext } from "@/core/studio/definitions/admin";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { createDraft, updateDraft, validateDraft, publishDraft, activateVersion, getDefinition } from "@/core/studio/definitions/service";
import { compareDraftPayloads } from "@/core/studio/definitions/diff";
import type { DraftSaveResult } from "@/modules/studio/draft-editor";
import { kernelPayloadSchema } from "@/core/studio/compiler/kernel";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const text = (form: FormData, key: string) => String(form.get(key) ?? "");
const number = (form: FormData, key: string) => Number(text(form, key));
function payload(form: FormData) {
  return kernelPayloadSchema.parse({ schemaVersion: 1, description: text(form, "description"), references: form.getAll("reference").map(raw => JSON.parse(String(raw))) });
}
export async function create(form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  const session = await studioActionContext(actor,text(form,"organisationId"));
  const definition = await createDraft(session, { key: text(form, "key"), name: text(form, "name"), kind: "capabilitySet", payload: { schemaVersion: 1, description: text(form, "description"), references: [] } });
  const root = actor.capabilities.has("atlas.staff.manage") ? `/atlas/studio/${session.organisationId}` : "/studio";
  revalidatePath(root);
  redirect(`${root}/${definition.id}`);
}
export async function save(form: FormData): Promise<DraftSaveResult> {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  const session = await studioActionContext(actor,text(form,"organisationId"));
  const id = text(form, "id");
  const submitted = payload(form);
  try {
    await updateDraft(session, { definitionId: id, revision: number(form, "revision"), payload: submitted });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.startsWith("CONFLICT:")) throw error;
    const current = await getDefinition(session,id);
    return { ok:false, message:error.message, differences:current?.draft ? compareDraftPayloads(current.draft.payload,submitted) : [] };
  }
  revalidatePath(actor.capabilities.has("atlas.staff.manage") ? `/atlas/studio/${session.organisationId}/${id}` : `/studio/${id}`);
  return { ok:true,message:"Draft saved. Validate the saved draft before publishing." };
}
export async function validate(form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  const session = await studioActionContext(actor,text(form,"organisationId"));
  const id = text(form, "id");
  await validateDraft(session, id, number(form, "revision"));
  revalidatePath(actor.capabilities.has("atlas.staff.manage") ? `/atlas/studio/${session.organisationId}/${id}` : `/studio/${id}`);
}
export async function publish(form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  const session = await studioActionContext(actor,text(form,"organisationId"));
  const id = text(form, "id");
  await publishDraft(session, { definitionId: id, revision: number(form, "revision"), acknowledgeWarnings: form.get("acknowledgeWarnings") === "on" });
  revalidatePath(actor.capabilities.has("atlas.staff.manage") ? `/atlas/studio/${session.organisationId}/${id}` : `/studio/${id}`); revalidatePath(actor.capabilities.has("atlas.staff.manage") ? `/atlas/studio/${session.organisationId}` : "/studio");
}
export async function activate(form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.publish);
  const session = await studioActionContext(actor,text(form,"organisationId"));
  const id = text(form, "id");
  await activateVersion(session, { definitionId: id, versionId: text(form, "versionId"), revision: number(form, "revision") });
  revalidatePath(actor.capabilities.has("atlas.staff.manage") ? `/atlas/studio/${session.organisationId}/${id}` : `/studio/${id}`); revalidatePath(actor.capabilities.has("atlas.staff.manage") ? `/atlas/studio/${session.organisationId}` : "/studio");
}
