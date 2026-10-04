"use server";

import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { hashToken, newToken } from "@/core/security/secrets";
import { sendEmail } from "@/core/email/send";
import { emit, DOMAIN_EVENTS } from "@/core/events/bus";
import { writeAudit } from "@/core/audit/log";
import crypto from "node:crypto";

const text = (f: FormData, k: string, max = 4000, required = false) => { const v = String(f.get(k) ?? "").trim(); if (v.length > max || (required && !v)) throw new Error(`Please enter ${k}.`); return v; };

export async function createContract(f: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.contractManage);
  const partyId = text(f, "partyId", 100) || null;
  const seq = await db.contractDocument.count({ where: { organisationId: session.organisationId } });
  const reference = `CON-${String(seq + 1).padStart(5, "0")}`;
  const bodyHtml = text(f, "bodyHtml", 100000, true);
  const contract = await db.contractDocument.create({ data: { organisationId: session.organisationId, reference, title: text(f, "title", 300, true), bodyHtml, partyId, contactId: text(f, "contactId", 100) || null, quoteId: text(f, "quoteId", 100) || null, orderId: text(f, "orderId", 100) || null, tokenHash: hashToken(reference + crypto.randomUUID()), contentHash: crypto.createHash("sha256").update(bodyHtml).digest("hex"), createdBy: session.userId } });
  return { id: contract.id };
}

/** Sends (or re-sends) the sign link. Issues a fresh token each send so an old email can't be reused after re-issue. */
export async function sendContract(f: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.contractManage);
  const id = text(f, "id", 60, true);
  const contract = await db.contractDocument.findFirst({ where: { id, organisationId: session.organisationId } });
  if (!contract) throw new Error("That contract no longer exists.");
  const to = text(f, "to", 200, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error("Enter a valid email address.");
  const token = newToken(20);
  const expiresAt = new Date(Date.now() + 30 * 86400000);
  await db.contractDocument.update({ where: { id }, data: { tokenHash: hashToken(token), status: "SENT", sentAt: new Date(), expiresAt, signerEmail: to } });
  const { publicBaseUrl } = await import("@/core/email/render");
  const link = `${publicBaseUrl()}/sign/${token}`;
  const result = await sendEmail({ organisationId: session.organisationId, to, subject: `${contract.title} for your signature`, accountId: text(f, "accountId", 60) || undefined, actorUserId: session.userId, context: { contract: { title: contract.title, link } }, blocks: [{ id: "h", type: "heading", text: "Please review and sign" }, { id: "t", type: "text", text: `${session.organisationName} has sent you "${contract.title}" to sign.` }, { id: "b", type: "button", label: "Review and sign", url: link }] as never, partyId: contract.partyId ?? undefined, contactId: contract.contactId ?? undefined, entityType: "contract", entityId: contract.id });
  if (result.status !== "SENT") throw new Error(result.error ?? "Could not send.");
  await emit(DOMAIN_EVENTS.contractSent, { organisationId: session.organisationId, contractId: contract.id, partyId: contract.partyId });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "contract.sent", entityType: "ContractDocument", entityId: contract.id, after: { to } });
}

/** Public: the recipient signs with no Atlas login. The token is the only credential. */
export async function signContract(token: string, signerName: string) {
  const contract = await db.contractDocument.findFirst({ where: { tokenHash: hashToken(token), status: { in: ["SENT", "VIEWED"] } } });
  if (!contract) throw new Error("This sign link is no longer valid.");
  if (contract.expiresAt && contract.expiresAt < new Date()) throw new Error("This sign link has expired.");
  if (!signerName.trim()) throw new Error("Enter your name to sign.");
  await db.contractDocument.update({ where: { id: contract.id }, data: { status: "SIGNED", signedAt: new Date(), signerName: signerName.trim().slice(0, 200) } });
  await emit(DOMAIN_EVENTS.contractSigned, { organisationId: contract.organisationId, contractId: contract.id, partyId: contract.partyId });
  await writeAudit({ organisationId: contract.organisationId, action: "contract.signed", entityType: "ContractDocument", entityId: contract.id, after: { signerName } });
  if (contract.quoteId) await emit(DOMAIN_EVENTS.salesQuoteAccepted ?? "sales.quote.accepted", { organisationId: contract.organisationId, quoteId: contract.quoteId });
  return { title: contract.title };
}

export async function declineContract(token: string, reason: string) {
  const contract = await db.contractDocument.findFirst({ where: { tokenHash: hashToken(token), status: { in: ["SENT", "VIEWED"] } } });
  if (!contract) return;
  await db.contractDocument.update({ where: { id: contract.id }, data: { status: "DECLINED", declinedReason: reason.slice(0, 1000) } });
  await emit(DOMAIN_EVENTS.contractDeclined, { organisationId: contract.organisationId, contractId: contract.id, partyId: contract.partyId });
}

export async function loadPublicContract(token: string) {
  const contract = await db.contractDocument.findFirst({ where: { tokenHash: hashToken(token) } });
  if (!contract) return null;
  if (contract.status === "SENT") await db.contractDocument.update({ where: { id: contract.id }, data: { status: "VIEWED", viewedAt: contract.viewedAt ?? new Date() } });
  return contract;
}
