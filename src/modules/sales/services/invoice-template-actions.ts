"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { normaliseBlocks, presetBlocks, type InvoiceTemplateKind } from "../domain/invoice-templates";

function kindOf(value: FormDataEntryValue | null): InvoiceTemplateKind {
  return value === "EXPORT" ? "EXPORT" : "DOMESTIC";
}

export async function saveInvoiceTemplate(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "sales.quote.create");
  await assertModuleEnabled(session, "sales");
  const id = String(form.get("id") ?? "");
  const kind = kindOf(form.get("kind"));
  const preset = form.get("preset") === "yes";
  const name = (preset ? (kind === "EXPORT" ? "Export proforma" : "Domestic invoice") : String(form.get("name") ?? "").trim()).slice(0, 80);
  if (!name) throw new Error("Name the template.");
  const blocks = normaliseBlocks(kind, preset ? presetBlocks(kind) : form.getAll("blocks").map(String));
  const exporterEori = kind === "EXPORT" ? String(form.get("exporterEori") ?? "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 20) || null : null;
  if (exporterEori && !/^[A-Z0-9]{4,20}$/.test(exporterEori)) throw new Error("Exporter EORI uses letters and numbers.");
  const footer = String(form.get("footer") ?? "").trim().slice(0, 500) || null;
  const data = { name, kind, blocks, exporterEori, footer };
  if (id) {
    const current = await db.invoiceDocumentTemplate.findFirstOrThrow({ where: { id, organisationId: session.organisationId } });
    if (await db.invoiceDocumentTemplate.findFirst({ where: { organisationId: session.organisationId, name, NOT: { id: current.id } } })) throw new Error("A template already uses that name.");
    await db.invoiceDocumentTemplate.update({ where: { id: current.id }, data });
  } else {
    if (await db.invoiceDocumentTemplate.findFirst({ where: { organisationId: session.organisationId, name } })) throw new Error("A template already uses that name.");
    await db.invoiceDocumentTemplate.create({ data: { ...data, organisationId: session.organisationId } });
  }
  revalidatePath("/sales/templates");
}

export async function retireInvoiceTemplate(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "sales.quote.create");
  await assertModuleEnabled(session, "sales");
  const id = String(form.get("id") ?? "");
  await db.invoiceDocumentTemplate.updateMany({ where: { id, organisationId: session.organisationId }, data: { active: false } });
  revalidatePath("/sales/templates");
}

export async function attachCustomerInvoiceTemplate(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.commercialManage);
  const partyId = String(form.get("partyId") ?? "");
  const templateId = String(form.get("templateId") ?? "");
  const party = await db.party.findFirstOrThrow({ where: { id: partyId, organisationId: session.organisationId }, include: { addresses: true } });
  const template = await db.invoiceDocumentTemplate.findFirstOrThrow({ where: { id: templateId, organisationId: session.organisationId, active: true } });
  const address = (field: string) => {
    const id = String(form.get(field) ?? "");
    if (!id) return null;
    if (!party.addresses.some((row) => row.id === id && row.active)) throw new Error("Choose an address on this customer account.");
    return id;
  };
  const buyerEori = String(form.get("buyerEori") ?? "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 20) || null;
  if (buyerEori && !/^[A-Z0-9]{4,20}$/.test(buyerEori)) throw new Error("Buyer EORI uses letters and numbers.");
  const isDefault = form.get("isDefault") === "on" || !(await db.customerInvoiceTemplate.count({ where: { partyId, organisationId: session.organisationId } }));
  const data = {
    invoiceAddressId: address("invoiceAddressId"), deliveryAddressId: address("deliveryAddressId"), notifyAddressId: address("notifyAddressId"),
    buyerEori, buyerVat: String(form.get("buyerVat") ?? "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 40) || null,
    marks: String(form.get("marks") ?? "").trim().slice(0, 500) || null, isDefault,
  };
  await db.$transaction(async (tx) => {
    if (isDefault) await tx.customerInvoiceTemplate.updateMany({ where: { partyId, organisationId: session.organisationId }, data: { isDefault: false } });
    await tx.customerInvoiceTemplate.upsert({
      where: { partyId_templateId: { partyId, templateId } },
      create: { ...data, organisationId: session.organisationId, partyId, templateId },
      update: data,
    });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "customer.invoice_template", entityType: "Party", entityId: partyId, after: { template: template.name, kind: template.kind } } });
  });
  revalidatePath(`/customers/${partyId}`);
  revalidatePath("/sales/templates");
}

export async function detachCustomerInvoiceTemplate(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.commercialManage);
  const partyId = String(form.get("partyId") ?? "");
  const id = String(form.get("id") ?? "");
  await db.party.findFirstOrThrow({ where: { id: partyId, organisationId: session.organisationId } });
  const row = await db.customerInvoiceTemplate.findFirst({ where: { id, partyId, organisationId: session.organisationId } });
  if (!row) return;
  if (await db.salesOrder.count({ where: { invoiceAssignmentId: row.id, commercialStatus: { notIn: ["CANCELLED", "CLOSED"] } } })) throw new Error("This template is on an open sale. Finish or change that sale first.");
  await db.customerInvoiceTemplate.delete({ where: { id: row.id } });
  revalidatePath(`/customers/${partyId}`);
}
