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

const MAX_PDF = 10 * 1024 * 1024;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sha = (value: Buffer | string) => crypto.createHash("sha256").update(value).digest("hex");
const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const paragraphs = (value: string) => value.split(/\n{2,}/).map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br/>")}</p>`).join("");

async function nextReference(organisationId: string, prefix: string) {
  const seq = await db.contractDocument.count({ where: { organisationId } });
  return `${prefix}-${String(seq + 1).padStart(5, "0")}`;
}

/** An uploaded PDF, checked by size and by its first bytes rather than by the name. */
async function readPdf(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || !value.size) return null;
  if (value.size > MAX_PDF) throw new Error("The PDF is larger than 10 MB. Reduce it and try again.");
  const bytes = Buffer.from(await value.arrayBuffer());
  if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") throw new Error("Upload a PDF file. Word documents need saving as PDF first.");
  return { bytes, name: value.name.replace(/[^\w .()-]/g, "_").slice(0, 150) || "document.pdf" };
}

export async function createContract(f: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.contractManage);
  const partyId = text(f, "partyId", 100) || null;
  if (partyId && !(await db.party.findFirst({ where: { id: partyId, organisationId: session.organisationId }, select: { id: true } }))) throw new Error("Choose a customer from your records.");
  const pdf = await readPdf(f.get("file"));
  // Typed terms are stored as escaped paragraphs; raw HTML is never accepted, because the signer's page is public.
  const bodyHtml = text(f, "body", 50000) ? paragraphs(text(f, "body", 50000)) : "";
  if (!pdf && !bodyHtml) throw new Error("Upload the contract as a PDF, or type its terms.");
  const reference = await nextReference(session.organisationId, "CON");
  const contract = await db.contractDocument.create({ data: {
    organisationId: session.organisationId, reference, title: text(f, "title", 300, true), bodyHtml, message: text(f, "message", 2000), partyId, contactId: text(f, "contactId", 100) || null, quoteId: text(f, "quoteId", 100) || null, orderId: text(f, "orderId", 100) || null,
    tokenHash: hashToken(reference + crypto.randomUUID()), contentHash: sha(pdf ? pdf.bytes : bodyHtml), createdBy: session.userId,
    ...(pdf ? { fileName: pdf.name, fileType: "application/pdf", fileSize: pdf.bytes.length, fileContent: pdf.bytes } : {}),
  } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "contract.created", entityType: "ContractDocument", entityId: contract.id, after: { reference, title: contract.title, file: pdf?.name ?? null, contentHash: contract.contentHash } });
  return { id: contract.id };
}

/** A fresh link for the document. Any earlier link stops working, so only the latest one can be used. */
const VALID_DAYS = [7, 14, 30, 60, 90];
const validFor = (value: unknown) => (VALID_DAYS.includes(Number(value)) ? Number(value) : 30);

async function issue(contractId: string, organisationId: string, signerEmail: string | null, days = 30) {
  const token = newToken(20);
  await db.contractDocument.update({ where: { id: contractId }, data: { tokenHash: hashToken(token), status: "SENT", sentAt: new Date(), expiresAt: new Date(Date.now() + days * 86400000), viewedAt: null, ...(signerEmail ? { signerEmail } : {}) } });
  const { publicBaseUrl } = await import("@/core/email/render");
  void organisationId;
  return `${publicBaseUrl()}/sign/${token}`;
}

/** Sends (or re-sends) the sign link by email. */
export async function sendContract(f: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.contractManage);
  const id = text(f, "id", 60, true);
  const contract = await db.contractDocument.findFirst({ where: { id, organisationId: session.organisationId }, select: { id: true, title: true, kind: true, status: true, partyId: true, contactId: true, signerEmail: true, quoteId: true } });
  if (!contract) throw new Error("That document no longer exists.");
  if (contract.status === "SIGNED") throw new Error("This document is already signed.");
  const to = (text(f, "to", 200) || contract.signerEmail || "").toLowerCase();
  if (!EMAIL.test(to)) throw new Error("Enter the signer's email address.");
  const link = await issue(contract.id, session.organisationId, to, validFor(f.get("validDays")));
  const quote = contract.kind === "QUOTE";
  const result = await sendEmail({ organisationId: session.organisationId, to, subject: quote ? `${contract.title} for your approval` : `${contract.title} for your signature`, accountId: text(f, "accountId", 60) || undefined, actorUserId: session.userId, context: { contract: { title: contract.title, link } },
    blocks: [{ id: "h", type: "heading", text: quote ? "Your quotation is ready" : "Please review and sign" }, { id: "t", type: "text", text: quote ? `${session.organisationName} has sent you ${contract.title}. Open it to see the prices, then approve it online. It takes a minute and needs no account.` : `${session.organisationName} has sent you "${contract.title}" to read and sign online. It takes a minute and needs no account.` }, { id: "b", type: "button", label: quote ? "View and approve" : "Review and sign", url: link }] as never,
    partyId: contract.partyId ?? undefined, contactId: contract.contactId ?? undefined, entityType: "contract", entityId: contract.id });
  if (result.status !== "SENT") throw new Error(result.error ?? "Could not send.");
  await emit(DOMAIN_EVENTS.contractSent, { organisationId: session.organisationId, contractId: contract.id, partyId: contract.partyId });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "contract.sent", entityType: "ContractDocument", entityId: contract.id, after: { to } });
}

/** A link to copy and send yourself (text, WhatsApp, your own email). Shown once; making another cancels it. */
export async function shareContractLink(contractId: string, validDays = 30) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.contractManage);
  const contract = await db.contractDocument.findFirst({ where: { id: contractId, organisationId: session.organisationId }, select: { id: true, status: true } });
  if (!contract) throw new Error("That document no longer exists.");
  if (contract.status === "SIGNED") throw new Error("This document is already signed.");
  const link = await issue(contract.id, session.organisationId, null, validFor(validDays));
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "contract.link_issued", entityType: "ContractDocument", entityId: contract.id });
  return { link };
}

export async function deleteContract(f: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.contractManage);
  const id = text(f, "id", 60, true);
  const contract = await db.contractDocument.findFirst({ where: { id, organisationId: session.organisationId }, select: { status: true, reference: true } });
  if (!contract) return;
  if (contract.status === "SIGNED") throw new Error("A signed document is a record and cannot be deleted.");
  await db.contractDocument.delete({ where: { id } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "contract.deleted", entityType: "ContractDocument", entityId: id, before: { reference: contract.reference, status: contract.status } });
}

async function caller() {
  const { headers } = await import("next/headers");
  const list = await headers();
  return { ip: (list.get("x-forwarded-for") ?? "").split(",")[0].trim().slice(0, 60) || null, agent: (list.get("user-agent") ?? "").slice(0, 300) || null };
}

/** Public: the recipient signs with no Atlas login. The token is the only credential. */
export async function signContract(token: string, signerName: string, signatureImage?: string) {
  const contract = await db.contractDocument.findFirst({ where: { tokenHash: hashToken(token), status: { in: ["SENT", "VIEWED"] } }, select: { id: true, organisationId: true, title: true, kind: true, partyId: true, quoteId: true, expiresAt: true, contentHash: true, reference: true } });
  if (!contract) throw new Error("This link is no longer valid.");
  if (contract.expiresAt && contract.expiresAt < new Date()) throw new Error("This link has expired. Ask the sender for a new one.");
  const name = String(signerName ?? "").trim().slice(0, 200);
  if (name.length < 2) throw new Error("Enter your full name to sign.");
  const drawn = typeof signatureImage === "string" && signatureImage.startsWith("data:image/png;base64,") && signatureImage.length < 400_000 ? signatureImage : null;
  const { ip, agent } = await caller(), signedAt = new Date();
  await db.contractDocument.update({ where: { id: contract.id }, data: { status: "SIGNED", signedAt, signerName: name, signerIp: ip, signerUserAgent: agent, signatureImage: drawn } });
  await writeAudit({ organisationId: contract.organisationId, action: contract.kind === "QUOTE" ? "quote.approved_by_customer" : "contract.signed", entityType: "ContractDocument", entityId: contract.id, after: { signerName: name, signedAt, ip, userAgent: agent, contentHash: contract.contentHash, drawnSignature: !!drawn } });
  await emit(DOMAIN_EVENTS.contractSigned, { organisationId: contract.organisationId, contractId: contract.id, partyId: contract.partyId });
  if (contract.quoteId) {
    const changed = await db.quote.updateMany({ where: { id: contract.quoteId, organisationId: contract.organisationId, status: { in: ["DRAFT", "SENT"] } }, data: { status: "ACCEPTED" } });
    if (changed.count) await writeAudit({ organisationId: contract.organisationId, action: "quote.accepted", entityType: "Quote", entityId: contract.quoteId, after: { by: name, via: contract.reference } });
    await emit(DOMAIN_EVENTS.salesQuoteAccepted ?? "sales.quote.accepted", { organisationId: contract.organisationId, quoteId: contract.quoteId });
  }
  return { title: contract.title, reference: contract.reference, signedAt: signedAt.toISOString() };
}

export async function declineContract(token: string, reason: string) {
  const contract = await db.contractDocument.findFirst({ where: { tokenHash: hashToken(token), status: { in: ["SENT", "VIEWED"] } }, select: { id: true, organisationId: true, partyId: true, quoteId: true, kind: true } });
  if (!contract) return;
  const why = String(reason ?? "").trim().slice(0, 1000) || "No reason given";
  const { ip, agent } = await caller();
  await db.contractDocument.update({ where: { id: contract.id }, data: { status: "DECLINED", declinedReason: why, signerIp: ip, signerUserAgent: agent } });
  await writeAudit({ organisationId: contract.organisationId, action: contract.kind === "QUOTE" ? "quote.declined_by_customer" : "contract.declined", entityType: "ContractDocument", entityId: contract.id, after: { reason: why, ip } });
  if (contract.quoteId) await db.quote.updateMany({ where: { id: contract.quoteId, organisationId: contract.organisationId, status: { in: ["DRAFT", "SENT"] } }, data: { status: "DECLINED" } });
  await emit(DOMAIN_EVENTS.contractDeclined, { organisationId: contract.organisationId, contractId: contract.id, partyId: contract.partyId });
}

const PUBLIC = { id: true, organisationId: true, reference: true, title: true, kind: true, message: true, bodyHtml: true, status: true, expiresAt: true, sentAt: true, viewedAt: true, signedAt: true, signerName: true, declinedReason: true, contentHash: true, fileName: true, fileSize: true, quoteId: true } as const;

/** Public: what the signer may see. Opening it for the first time is recorded. The file itself is served separately. */
export async function loadPublicContract(token: string) {
  const contract = await db.contractDocument.findFirst({ where: { tokenHash: hashToken(token) }, select: PUBLIC });
  if (!contract) return null;
  if (contract.status === "SENT") {
    const { ip } = await caller(), viewedAt = new Date();
    await db.contractDocument.update({ where: { id: contract.id }, data: { status: "VIEWED", viewedAt } });
    await writeAudit({ organisationId: contract.organisationId, action: "contract.viewed", entityType: "ContractDocument", entityId: contract.id, after: { viewedAt, ip } });
    return { ...contract, status: "VIEWED", viewedAt };
  }
  return contract;
}

/** Public: the PDF behind a valid link. */
export async function loadPublicContractFile(token: string) {
  const contract = await db.contractDocument.findFirst({ where: { tokenHash: hashToken(token) }, select: { fileContent: true, fileName: true, fileType: true, expiresAt: true, status: true } });
  if (!contract?.fileContent) return null;
  if (contract.status !== "SIGNED" && contract.expiresAt && contract.expiresAt < new Date()) return null;
  return { bytes: Buffer.from(contract.fileContent), name: contract.fileName ?? "document.pdf", type: contract.fileType ?? "application/pdf" };
}
