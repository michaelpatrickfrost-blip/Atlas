"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession, type Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { formatMoney } from "@/core/shared/money";
import { sendEmail, type Attachment } from "@/core/email/send";
import { createContract, sendContract } from "@/core/contracts/actions";
import type { EmailBlock } from "@/core/email/blocks";

export type RecordKind = "quote" | "order" | "invoice" | "customer";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (form: FormData, name: string, max = 300) => String(form.get(name) ?? "").trim().slice(0, max);

/** The record an email is about, checked against the signed-in company. */
export async function loadEmailRecord(session: Session, kind: RecordKind, id: string) {
  const organisationId = session.organisationId;
  if (kind === "quote") {
    assertCapability(session, "sales.quote.read");
    const row = await db.quote.findFirst({ where: { id, organisationId }, select: { id: true, reference: true, partyId: true, totalAmount: true, totalCurrency: true, party: { select: { name: true } } } });
    return row && { entityType: "Quote", id: row.id, partyId: row.partyId, customer: row.party.name, reference: row.reference, label: "Quotation", total: formatMoney(row.totalAmount, row.totalCurrency), path: `/sales/quotes/${row.id}`, pdf: true };
  }
  if (kind === "order") {
    assertCapability(session, "sales.order.read");
    const row = await db.salesOrder.findFirst({ where: { id, organisationId }, select: { id: true, reference: true, partyId: true, grossAmount: true, currency: true, party: { select: { name: true } } } });
    return row && { entityType: "SalesOrder", id: row.id, partyId: row.partyId, customer: row.party.name, reference: row.reference, label: "Order acknowledgement", total: formatMoney(row.grossAmount, row.currency), path: `/sales/orders/${row.id}`, pdf: true };
  }
  if (kind === "invoice") {
    assertCapability(session, "finance.overview.read");
    const row = await db.financeDocument.findFirst({ where: { id, organisationId }, select: { id: true, reference: true, kind: true, partyId: true, gross: true, currency: true, party: { select: { name: true } } } });
    const labels: Record<string, string> = { AR_INVOICE: "Invoice", AR_CREDIT: "Credit note", AR_DEBIT: "Debit note", PO: "Purchase order" };
    return row && row.partyId && { entityType: "FinanceDocument", id: row.id, partyId: row.partyId, customer: row.party?.name ?? "", reference: row.reference, label: labels[row.kind] ?? "Document", total: formatMoney(Number(row.gross), row.currency), path: `/finance/documents/${row.id}`, pdf: row.kind in { AR_INVOICE: 1, AR_CREDIT: 1, AR_DEBIT: 1 } };
  }
  assertCapability(session, "customers.read");
  const row = await db.party.findFirst({ where: { id, organisationId }, select: { id: true, name: true } });
  return row && { entityType: "Party", id: row.id, partyId: row.id, customer: row.name, reference: "", label: "", total: "", path: `/customers/${row.id}`, pdf: false };
}

async function pdfFor(kind: RecordKind, id: string, reference: string): Promise<Attachment> {
  const request = new Request("http://atlas.internal/pdf");
  const response = kind === "quote" ? await (await import("@/app/api/quotes/[quoteId]/pdf/route")).GET(request, { params: Promise.resolve({ quoteId: id }) })
    : kind === "order" ? await (await import("@/app/api/orders/[orderId]/pdf/route")).GET(request, { params: Promise.resolve({ orderId: id }) })
    : await (await import("@/app/api/finance/documents/[id]/pdf/route")).GET(request, { params: Promise.resolve({ id }) });
  if (!response.ok) throw new Error("The PDF could not be produced for this document.");
  return { name: `${reference.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`, contentBase64: Buffer.from(await response.arrayBuffer()).toString("base64"), contentType: "application/pdf" };
}

export async function sendRecordEmailAction(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.emailSend);
  const kind = text(form, "kind", 20) as RecordKind;
  if (!["quote", "order", "invoice", "customer"].includes(kind)) throw new Error("This record cannot be emailed.");
  const record = await loadEmailRecord(session, kind, text(form, "recordId", 60));
  if (!record) throw new Error("This record no longer exists.");
  const to = text(form, "to", 200).toLowerCase(), cc = text(form, "cc", 600).split(/[,;\s]+/).map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (!EMAIL.test(to)) throw new Error("Enter the recipient's email address.");
  if (cc.some((value) => !EMAIL.test(value)) || cc.length > 10) throw new Error("Check the copy addresses: up to ten valid emails, separated by commas.");
  const subject = text(form, "subject", 300), message = String(form.get("message") ?? "").trim().slice(0, 10000);
  if (!subject) throw new Error("Add a subject.");
  if (!message) throw new Error("Write a message.");
  const contact = await db.contact.findFirst({ where: { partyId: record.partyId, party: { organisationId: session.organisationId }, email: { equals: to, mode: "insensitive" } }, select: { id: true, firstName: true, surname: true } });
  const blocks: EmailBlock[] = [{ id: "m", type: "text", text: message }];
  if (record.reference) blocks.push({ id: "d", type: "details", rows: [[record.label, record.reference], ["Total", record.total]] });
  const attachments = record.pdf && form.get("attachPdf") === "on" ? [await pdfFor(kind, record.id, record.reference)] : [];
  const result = await sendEmail({
    organisationId: session.organisationId, actorUserId: session.userId, accountId: text(form, "accountId", 60) || undefined, to, toName: contact ? `${contact.firstName} ${contact.surname}` : undefined, cc, subject, blocks, attachments,
    context: { customer: { name: record.customer }, contact: { firstName: contact?.firstName ?? "", name: contact ? `${contact.firstName} ${contact.surname}` : "", email: to } },
    partyId: record.partyId, contactId: contact?.id, entityType: record.entityType, entityId: record.id,
  });
  revalidatePath(record.path);
  if (result.status !== "SENT" && result.status !== "QUEUED") throw new Error(result.error ? `Not sent: ${result.error}` : "The email could not be sent.");
}

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Creates a contract for the record (uploaded PDF or typed terms) and emails the signing link in one step. */
export async function sendRecordContractAction(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.contractManage);
  const kind = text(form, "kind", 20) as RecordKind;
  if (!["quote", "order", "customer"].includes(kind)) throw new Error("A contract cannot be sent from this record.");
  const record = await loadEmailRecord(session, kind, text(form, "recordId", 60));
  if (!record) throw new Error("This record no longer exists.");
  const to = text(form, "to", 200).toLowerCase(), title = text(form, "title", 300);
  if (to && !EMAIL.test(to)) throw new Error("Enter the signer's email address.");
  if (!title) throw new Error("Give the document a title.");
  const draft = new FormData();
  draft.set("title", title);
  draft.set("body", String(form.get("body") ?? ""));
  draft.set("message", String(form.get("message") ?? ""));
  const file = form.get("file");
  if (file instanceof File && file.size) draft.set("file", file);
  draft.set("partyId", record.partyId);
  if (kind === "quote") draft.set("quoteId", record.id);
  if (kind === "order") draft.set("orderId", record.id);
  const contract = await createContract(draft);
  if (to) {
    const send = new FormData();
    send.set("id", contract.id); send.set("to", to); send.set("accountId", text(form, "accountId", 60)); send.set("validDays", text(form, "validDays", 3));
    await sendContract(send);
  }
  revalidatePath(record.path);
  revalidatePath("/sales/contracts");
}

/** Sends a quotation for the customer to approve online. The customer sees the PDF exactly as it stands now. */
export async function sendQuoteForApprovalAction(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.contractManage);
  const record = await loadEmailRecord(session, "quote", text(form, "recordId", 60));
  if (!record) throw new Error("This quotation no longer exists.");
  const quote = await db.quote.findFirst({ where: { id: record.id, organisationId: session.organisationId }, select: { status: true, _count: { select: { lines: true } } } });
  if (!quote) throw new Error("This quotation no longer exists.");
  if (quote.status === "ACCEPTED") throw new Error("This quotation has already been accepted.");
  if (!quote._count.lines) throw new Error("Add at least one line before sending the quotation.");
  const to = text(form, "to", 200).toLowerCase();
  if (to && !EMAIL.test(to)) throw new Error("Enter the customer's email address.");
  const pdf = await pdfFor("quote", record.id, record.reference), bytes = Buffer.from(pdf.contentBase64, "base64");
  const { createHash, randomUUID } = await import("node:crypto");
  const { hashToken } = await import("@/core/security/secrets");
  const reference = `APP-${String((await db.contractDocument.count({ where: { organisationId: session.organisationId } })) + 1).padStart(5, "0")}`;
  await db.contractDocument.updateMany({ where: { organisationId: session.organisationId, quoteId: record.id, kind: "QUOTE", status: { in: ["DRAFT", "SENT", "VIEWED"] } }, data: { status: "SUPERSEDED", tokenHash: hashToken(randomUUID()) } });
  const contract = await db.contractDocument.create({ data: { organisationId: session.organisationId, reference, kind: "QUOTE", title: `Quotation ${record.reference}`, bodyHtml: "", message: String(form.get("message") ?? "").trim().slice(0, 2000), partyId: record.partyId, quoteId: record.id, tokenHash: hashToken(reference + randomUUID()), contentHash: createHash("sha256").update(bytes).digest("hex"), fileName: pdf.name, fileType: "application/pdf", fileSize: bytes.length, fileContent: bytes, createdBy: session.userId } });
  if (to) {
    const send = new FormData();
    send.set("id", contract.id); send.set("to", to); send.set("accountId", text(form, "accountId", 60)); send.set("validDays", text(form, "validDays", 3));
    await sendContract(send);
  }
  if (quote.status === "DRAFT" && to) await db.quote.updateMany({ where: { id: record.id, organisationId: session.organisationId, status: "DRAFT" }, data: { status: "SENT" } });
  revalidatePath(record.path);
  revalidatePath("/sales/contracts");
}
