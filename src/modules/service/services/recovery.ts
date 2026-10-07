"use server";
import { z } from "zod";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { serviceCaseScope } from "@/core/permissions/service-access";
import { createApproval, decideApproval } from "@/core/approvals/service";
import { workNumber } from "@/core/service-work/engine";
import { revalidatePath } from "next/cache";
const field = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
export async function proposeRecovery(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "service.case.update");
  const caseId = field(form, "caseId");
  await db.$transaction(async tx => {
    const c = await tx.serviceCase.findFirst({ where: { AND: [serviceCaseScope(session), { id: caseId }] } });
    if (!c) throw new Error("Case unavailable.");
    const type = z.enum(["PERCENT", "FIXED"]).parse(field(form, "type"));
    const value = Number(field(form, "value"));
    if (!Number.isFinite(value) || value <= 0 || (type === "PERCENT" && value > 100)) throw new Error("Enter a valid benefit value.");
    if(type==="PERCENT"&&(!field(form,"maximum")||Number(field(form,"maximum"))<=0))throw new Error("Set a maximum value so the percentage benefit can follow an amount-based approval route.");
    const maximum = field(form,"maximum") ? Number(field(form,"maximum")) : null, minimumOrder = Number(field(form,"minimumOrder") || "0");
    if ((maximum !== null && (!Number.isFinite(maximum) || maximum <= 0)) || !Number.isFinite(minimumOrder) || minimumOrder < 0 || [value,maximum ?? 0,minimumOrder].some(n => !Number.isSafeInteger(Math.round(n * 100)))) throw new Error("Use valid monetary limits.");
    const expiresAt = new Date(field(form, "expiresAt"));
    if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date()) throw new Error("Choose a future expiry date.");
    const limit = Number(field(form, "usageLimit") || "1");
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new Error("Choose a usage limit from 1 to 100.");
    const reason = z.string().min(5).max(4000).parse(field(form, "reason"));
    const currency=z.enum(["GBP","EUR","USD","CAD","AUD","CHF"]).parse(field(form,"currency")||"GBP");
    if([value,maximum??0,minimumOrder].some(n=>Math.round(n*100)>2147483647))throw new Error("Benefit exceeds the supported monetary limit.");
    const eligibleProductIds=[...new Set(form.getAll("eligibleProductId").map(String))], excludedProductIds=[...new Set(form.getAll("excludedProductId").map(String))];
    if(eligibleProductIds.some(id=>excludedProductIds.includes(id)))throw new Error("A product cannot be both eligible and excluded.");
    const productIds=[...eligibleProductIds,...excludedProductIds];
    if(productIds.length>100 || (productIds.length && await tx.product.count({where:{organisationId:session.organisationId,id:{in:productIds}}})!==productIds.length))throw new Error("Choose available company products.");
    const record = await tx.serviceRecovery.create({ data: { organisationId: session.organisationId, caseId, partyId: c.partyId, number: await workNumber(tx, session.organisationId, "REC"), type, value: Math.round(value * 100), maximum: maximum === null ? null : Math.round(maximum * 100), minimumOrder: Math.round(minimumOrder * 100), currency, eligibleProductIds, excludedProductIds, expiresAt, usageLimit: limit, reason, creatorUserId: session.userId } });
    const approval = await createApproval(tx, session, { subjectType: "SERVICE_RECOVERY", subjectId: record.id, subjectVersion: 1, amount: BigInt(record.maximum ?? (type === "FIXED" ? record.value : 0)), currency: record.currency, context: { partyId: c.partyId, category: type, department: "Customer Service" } });
    await tx.serviceRecovery.update({ where: { id: record.id }, data: { approvalId: approval.id, status: "AWAITING_APPROVAL" } });
    await tx.serviceEntry.create({ data: { organisationId: session.organisationId, caseId, kind: "RECOVERY_PROPOSED", body: `${record.number}: ${type === "PERCENT" ? `${value}%` : `${record.currency} ${value}`} next-order benefit submitted for independent approval.`, visibility: "INTERNAL", authorUserId: session.userId } });
  }, { isolationLevel: "Serializable" }); revalidatePath("/service", "layout");
}
export async function decideRecovery(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "service.case.approve");
  await db.$transaction(async tx => {
    const record = await tx.serviceRecovery.findFirst({ where: { id: field(form, "recoveryId"), organisationId: session.organisationId, case: serviceCaseScope(session), status: "AWAITING_APPROVAL" } });
    if (!record?.approvalId) throw new Error("Recovery unavailable.");
    const decision = z.enum(["APPROVED", "REJECTED", "INFORMATION"]).parse(field(form, "decision"));
    const approval = await decideApproval(tx, session, record.approvalId, decision, z.string().min(1).max(4000).parse(field(form, "reason")));
    const changed = await tx.serviceRecovery.updateMany({ where: { id: record.id, organisationId: session.organisationId, version: Number(form.get("version")) }, data: { status: approval.status === "PENDING" ? "AWAITING_APPROVAL" : approval.status, version: { increment: 1 } } });
    if (!changed.count) throw new Error("Recovery changed. Refresh before deciding.");
    await tx.serviceEntry.create({ data: { organisationId: session.organisationId, caseId: record.caseId, kind: "RECOVERY_DECIDED", visibility: "INTERNAL", authorUserId: session.userId, body: `${record.number}: ${approval.status}. ${field(form, "reason")}` } });
  }, { isolationLevel: "Serializable" }); revalidatePath("/service", "layout");
}
export async function saveServiceApprovalRoute(form: FormData) {
  const session = await requireSession();
  assertCapability(session, session.capabilities.has("tickets.queue.manage") ? "tickets.queue.manage" : "service.queue.manage");
  const subjectType = z.enum(["SERVICE_TICKET", "SERVICE_RECOVERY"]).parse(field(form, "subjectType"));
  const approverUserId = field(form, "approverUserId"), currency = z.string().regex(/^[A-Z]{3}$/).parse(field(form, "currency") || "GBP");
  await db.$transaction(async tx => {
    const membership = await tx.membership.findFirst({ where: { organisationId: session.organisationId, userId: approverUserId, active: true }, include: { roles: { include: { role: true } } } });
    const capabilities = new Set([...(membership?.roles.flatMap(role => role.role.capabilities) ?? []), ...(membership?.grantedCapabilities ?? [])]);
    for (const denied of membership?.deniedCapabilities ?? []) capabilities.delete(denied);
    if (!capabilities.has(subjectType === "SERVICE_TICKET" ? "tickets.ticket.manage" : "service.case.approve")) throw new Error("Choose a colleague with permission to approve this work.");
    if(await tx.approvalPolicy.findFirst({where:{organisationId:session.organisationId,subjectType,currency,active:true}}))throw new Error("An approval route already exists for this currency. Manage existing policies in Approvals.");
    await tx.approvalPolicy.create({ data: { organisationId: session.organisationId, subjectType, name: `${subjectType === "SERVICE_TICKET" ? "Ticket" : "Service recovery"} approval`, currency, minAmount: 0n, maxAmount: null, conditions: {}, stages: [[approverUserId]] } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "service.approval_route.created", entityType: "ApprovalPolicy", entityId: subjectType, after: { approverUserId, currency } } });
  }); revalidatePath("/tickets", "layout"); revalidatePath("/service", "layout");
}
