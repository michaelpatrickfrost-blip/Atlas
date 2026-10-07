"use server";
import { assertModuleEnabled } from "@/core/modules/access";
import { z } from "zod";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { revalidatePath } from "next/cache";
export async function saveKnowledge(form: FormData) {
  const session = await requireSession();
  assertCapability(session, session.capabilities.has("service.queue.manage") ? "service.queue.manage" : "tickets.queue.manage");
  await assertModuleEnabled(session, session.capabilities.has("service.queue.manage") ? "service" : "tickets");
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const status = z.enum(["DRAFT", "PUBLISHED"]).parse(text("status") || "DRAFT");
  const queueId = text("queueId") || null;
  await db.$transaction(async tx => {
    if (queueId && !await tx.serviceQueueMember.findFirst({ where: { organisationId: session.organisationId, queueId, userId: session.userId } })) throw new Error("Team knowledge requires queue membership.");
    const previous = text("previousId") ? await tx.serviceKnowledge.findFirst({ where: { id: text("previousId"), organisationId: session.organisationId, status:{in:["DRAFT","PUBLISHED"]}, OR: [{ queueId: null }, { queueId, ownerUserId: session.userId }] } }) : null;
    if (text("previousId") && !previous) throw new Error("Article unavailable.");
    const record = await tx.serviceKnowledge.create({ data: { organisationId: session.organisationId, title: z.string().min(1).max(250).parse(text("title")), category: text("category").slice(0, 100), content: z.string().min(1).max(30000).parse(text("content")), keywords: text("keywords").split(",").map(value => value.trim()).filter(Boolean).slice(0, 30), queueId, status, visibility: "INTERNAL", ownerUserId: session.userId, version: (previous?.version ?? 0) + 1, previousId: previous?.id, reviewedAt: status === "PUBLISHED" ? new Date() : null } });
    if (previous) await tx.serviceKnowledge.updateMany({ where: { id: previous.id, organisationId: session.organisationId, version: previous.version }, data: { status: "SUPERSEDED" } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "service.knowledge.saved", entityType: "ServiceKnowledge", entityId: record.id, after: { status, version: record.version, previousId: record.previousId } } });
  }, { isolationLevel: "Serializable" }); revalidatePath("/service", "layout"); revalidatePath("/tickets", "layout");
}
