"use server";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { serviceCaseScope } from "@/core/permissions/service-access";
import { workScope } from "./access";
import { saveServiceFile, removeServiceFile } from "./files";
import { revalidatePath } from "next/cache";
export async function attachServiceFile(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  const caseId = String(form.get("caseId") ?? "") || null, workId = String(form.get("workId") ?? "") || null;
  if (!!caseId === !!workId) throw new Error("Choose one case or ticket.");
  if (caseId) {
    assertCapability(session, "service.case.update");
    if (!await db.serviceCase.findFirst({ where: { AND: [serviceCaseScope(session), { id: caseId }] } })) throw new Error("Case unavailable.");
  }
  if (workId) {
    const work = await db.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { id: workId }] } });
    if (!work) throw new Error("Work item unavailable.");
    assertCapability(session, work.kind === "TICKET" ? "tickets.ticket.reply" : "service.ticket.update");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new Error("Choose a file.");
  const saved = await saveServiceFile(file);
  try { await db.$transaction(async tx => {
    const attachment = await tx.serviceFile.create({ data: { ...saved, organisationId: session.organisationId, caseId, workId, visibility: "REQUESTER", actorUserId: session.userId } });
    if (caseId) await tx.serviceEntry.create({ data: { organisationId: session.organisationId, caseId, kind: "ATTACHMENT_ADDED", body: `Evidence: ${saved.name}`, visibility: "INTERNAL", authorUserId: session.userId } });
    if (workId) await tx.serviceWorkEntry.create({ data: { organisationId: session.organisationId, workId, kind: "ATTACHMENT_ADDED", body: `Evidence: ${saved.name}`, visibility: "REQUESTER", actorUserId: session.userId } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "service.evidence.added", entityType: "ServiceFile", entityId: attachment.id, after: { sha256: saved.sha256, caseId, workId } } });
  }); } catch (error) { await removeServiceFile(saved.storageKey); throw error; }
  revalidatePath("/service", "layout"); revalidatePath("/tickets", "layout");
}
