"use server";

import { createAddress } from "@/core/customers/commands";

/** Add a delivery address to a customer from the order or quotation form. Returns it so the form can select it. */
export async function addDeliveryAddress(partyId: string, input: { label: string; line1: string; line2: string; city: string; region: string; postcode: string; country: string; telephone: string; deliveryInstructions: string; makeDefault: boolean }) {
  const clean = (value: string, max = 200) => String(value ?? "").trim().slice(0, max) || undefined;
  const line1 = clean(input.line1);
  if (!partyId) throw new Error("Choose the customer first.");
  if (!line1) throw new Error("Enter the first line of the address.");
  const address = await createAddress({ partyId, type: "DELIVERY", line1, label: clean(input.label, 100), line2: clean(input.line2), city: clean(input.city, 100), region: clean(input.region, 100), postcode: clean(input.postcode, 20), country: clean(input.country, 60), telephone: clean(input.telephone, 40), deliveryInstructions: clean(input.deliveryInstructions, 1000), isDefaultDelivery: !!input.makeDefault });
  return { id: address.id, partyId, type: "DELIVERY", label: [address.label ?? address.line1, address.postcode].filter(Boolean).join(" · "), country: address.country, defaultBilling: false, defaultDelivery: address.isDefaultDelivery };
}

/** Set up an installer (or any customer a branch orders for) as its own customer record, linked to the
 * branch that is invoiced. Its delivery addresses then live on its own record. */
export async function addInstaller(invoiceAccountId: string, input: { name: string; contactFirstName: string; contactSurname: string; contactPhone: string; contactEmail: string }) {
  const { requireSession } = await import("@/core/auth/session");
  const { db } = await import("@/core/db/client");
  const { createCustomer } = await import("@/core/customers/commands");
  const session = await requireSession();
  const name = String(input.name ?? "").trim().slice(0, 200);
  if (!invoiceAccountId) throw new Error("Choose the customer being invoiced first.");
  if (!name) throw new Error("Enter the installer's name.");
  if (!(await db.party.findFirst({ where: { id: invoiceAccountId, organisationId: session.organisationId }, select: { id: true } }))) throw new Error("The invoice customer no longer exists.");
  const installer = await createCustomer({ name, kind: "COMPANY", customerGroup: "Installer", contactFirstName: String(input.contactFirstName ?? "").trim().slice(0, 100) || name, contactSurname: String(input.contactSurname ?? "").trim().slice(0, 100), contactPhone: String(input.contactPhone ?? "").trim().slice(0, 40) || undefined, contactEmail: String(input.contactEmail ?? "").trim().slice(0, 200) || undefined });
  await linkOrderedFor(session.organisationId, session.userId, installer.id, invoiceAccountId);
  return { id: installer.id, name: installer.name, code: installer.customerCode, parentId: null as string | null, currency: installer.preferredCurrency, defaultListId: null as string | null };
}

/** The installer (account) is supplied through the branch (trading account) that is invoiced. */
export async function linkOrderedFor(organisationId: string, userId: string, accountId: string, tradingAccountId: string) {
  const { db } = await import("@/core/db/client");
  const key = { organisationId, accountId, tradingAccountId };
  const before = await db.customerTradingLink.findUnique({ where: { organisationId_accountId_tradingAccountId: key } });
  if (before?.active) return;
  await db.$transaction([
    db.customerTradingLink.upsert({ where: { organisationId_accountId_tradingAccountId: key }, create: { ...key, notes: "Linked from a sales document" }, update: { active: true } }),
    db.auditEntry.create({ data: { organisationId, actorUserId: userId, action: "customer.trading_link.saved", entityType: "Party", entityId: accountId, after: { tradingAccountId, active: true, source: "sales document" } } }),
  ]);
}
