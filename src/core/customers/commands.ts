"use server";

import {assertRecordCreationAllowed} from "@/core/policies/record-creation";
import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { writeAudit } from "@/core/audit/log";
import { writeActivity } from "@/core/activity/log";
import { emit, DOMAIN_EVENTS } from "@/core/events/bus";
import { parseHashtags } from "@/core/shared/hashtags";
import { nextCustomerCode } from "@/core/customers/code";
import { normalizeTaxNumber } from "@/core/customers/tax";
import { maskBankAccount } from "@/core/customers/bank";
import type {
  PartyKind,
  AddressType,
  ContactRole,
  PaymentMethod,
  DirectDebitScheme,
} from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";

// ---------- Identity / quick create ----------

export type QuickCreateInput = {
  name: string;
  parentPartyId?: string;
  hierarchyRole?: "GROUP"|"CUSTOMER"|"BRANCH"|"DELIVERY";
  customerGroup?: string;
  kind: PartyKind;
  country?: string;
  contactFirstName: string;
  contactSurname: string;
  contactEmail?: string;
  contactPhone?: string;
  accountManagerUserId?: string;
};

export async function createCustomer(input: QuickCreateInput) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.create);
  await assertRecordCreationAllowed(session.organisationId,"customers");

  if(!input.name.trim()||input.name.length>200)throw new Error("Enter a customer name up to 200 characters.");
  if(input.hierarchyRole&&!['GROUP','CUSTOMER','BRANCH','DELIVERY'].includes(input.hierarchyRole))throw new Error('Invalid account level.');
  if(input.parentPartyId)await db.party.findFirstOrThrow({where:{id:input.parentPartyId,organisationId:session.organisationId}});
  const customerCode = await nextCustomerCode(session.organisationId);

  const party = await db.party.create({
    data: {
      organisationId: session.organisationId,
      kind: input.kind,
      name: input.name.trim(),
      parentPartyId:input.parentPartyId||null,
      hierarchyRole:input.hierarchyRole??"CUSTOMER",
      customerGroup:input.customerGroup?.trim().slice(0,100)||null,
      customerCode,
      status: "PROSPECT",
      countryOfRegistration: input.country,
      accountManagerUserId: input.accountManagerUserId,
      relationshipStartDate: new Date(),
      contacts: {
        create: input.contactFirstName?.trim()||input.contactSurname?.trim() ? [
          {
            firstName: input.contactFirstName,
            surname: input.contactSurname,
            email: input.contactEmail,
            phone: input.contactPhone,
            isPrimary: true,
            roles: ["PRIMARY"],
          },
        ]:[],
      },
      creditProfile: { create: {} },
    },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.created",
    entityType: "Party",
    entityId: party.id,
    after: { name: party.name, customerCode: party.customerCode },
  });
  await writeActivity({
    organisationId: session.organisationId,
    type: DOMAIN_EVENTS.customerCreated,
    summary: `${party.name} added as a customer`,
    entityType: "Party",
    entityId: party.id,
    partyId: party.id,
  });
  await emit(DOMAIN_EVENTS.customerCreated, { partyId: party.id, organisationId: session.organisationId });

  revalidatePath("/customers");
  return party;
}

export async function updateCustomerStatus(partyId: string, status: "PROSPECT" | "ACTIVE" | "ON_HOLD" | "INACTIVE" | "CLOSED") {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.edit);

  const before = await db.party.findFirstOrThrow({ where: { id: partyId, organisationId: session.organisationId } });
  const after = await db.party.update({ where: { id: partyId }, data: { status } });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.status_changed",
    entityType: "Party",
    entityId: partyId,
    before: { status: before.status },
    after: { status: after.status },
  });
  if (status === "ACTIVE") await emit(DOMAIN_EVENTS.customerActivated, { partyId, organisationId: session.organisationId });

  revalidatePath(`/customers/${partyId}`);
}

export async function archiveCustomer(partyId: string) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.edit);

  const customer = await db.party.findFirstOrThrow({ where: { id: partyId, organisationId: session.organisationId } });

  const after = await db.party.update({ where: { id: partyId }, data: { archived: true } });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.archived",
    entityType: "Party",
    entityId: partyId,
    before: { archived: customer.archived },
    after: { archived: after.archived },
  });

  revalidatePath(`/customers/${partyId}`);
  revalidatePath("/customers");
}

export async function unarchiveCustomer(partyId: string) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.edit);

  const customer = await db.party.findFirstOrThrow({ where: { id: partyId, organisationId: session.organisationId } });

  const after = await db.party.update({ where: { id: partyId }, data: { archived: false } });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.unarchived",
    entityType: "Party",
    entityId: partyId,
    before: { archived: customer.archived },
    after: { archived: after.archived },
  });

  revalidatePath(`/customers/${partyId}`);
  revalidatePath("/customers");
}

export async function deleteCustomer(partyId: string) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.edit);

  const customer = await db.party.findFirstOrThrow({ where: { id: partyId, organisationId: session.organisationId } });
  if (customer.status === "CLOSED") throw new Error("This customer is already closed.");

  try {
    await db.party.delete({ where: { id: partyId, organisationId: session.organisationId } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2003") {
      throw error;
    }

    const after = await db.party.update({ where: { id: partyId }, data: { status: "CLOSED" } });

    await writeAudit({
      organisationId: session.organisationId,
      actorUserId: session.userId,
      action: "customer.deleted",
      entityType: "Party",
      entityId: partyId,
      before: { status: customer.status, name: customer.name },
      after: { status: after.status },
    });

    revalidatePath(`/customers`);
    return;
  }

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.deleted",
    entityType: "Party",
    entityId: partyId,
    before: { status: customer.status, name: customer.name },
    after: { status: "DELETED" },
  });

  revalidatePath(`/customers`);
}

// ---------- People & Places ----------

export type CreateContactInput = {
  partyId: string;
  firstName: string;
  surname: string;
  jobTitle?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  roles: ContactRole[];
  isPrimary?: boolean;
};

export async function createContact(input: CreateContactInput) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.contactsManage);

  await assertOwnedByOrg(session.organisationId, input.partyId);

  if (input.isPrimary) {
    await db.contact.updateMany({ where: { partyId: input.partyId }, data: { isPrimary: false } });
  }

  const contact = await db.contact.create({
    data: {
      partyId: input.partyId,
      firstName: input.firstName,
      surname: input.surname,
      jobTitle: input.jobTitle,
      department: input.department,
      email: input.email,
      phone: input.phone,
      mobile: input.mobile,
      roles: input.roles,
      isPrimary: input.isPrimary ?? false,
    },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.contact.created",
    entityType: "Contact",
    entityId: contact.id,
    after: { firstName: contact.firstName, surname: contact.surname },
  });
  await emit(DOMAIN_EVENTS.customerContactCreated, { contactId: contact.id, partyId: input.partyId });

  revalidatePath(`/customers/${input.partyId}`);
  return contact;
}

export type UpdateContactInput = {
  contactId: string;
  partyId: string;
  title?: string;
  firstName: string;
  surname: string;
  preferredName?: string;
  jobTitle?: string;
  department?: string;
  email?: string;
  alternativeEmail?: string;
  phone?: string;
  mobile?: string;
  preferredContactMethod?: "EMAIL" | "PHONE" | "MOBILE";
  notes?: string;
  status?: "ACTIVE" | "INACTIVE";
  roles: ContactRole[];
  isPrimary?: boolean;
};

export async function updateContact(input: UpdateContactInput) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.contactsManage);

  await assertOwnedByOrg(session.organisationId, input.partyId);
  const before = await db.contact.findFirstOrThrow({ where: { id: input.contactId, partyId: input.partyId } });

  if (input.isPrimary) {
    await db.contact.updateMany({ where: { partyId: input.partyId, id: { not: input.contactId } }, data: { isPrimary: false } });
  }

  const contact = await db.contact.update({
    where: { id: input.contactId },
    data: {
      title: input.title,
      firstName: input.firstName,
      surname: input.surname,
      preferredName: input.preferredName,
      jobTitle: input.jobTitle,
      department: input.department,
      email: input.email,
      alternativeEmail: input.alternativeEmail,
      phone: input.phone,
      mobile: input.mobile,
      preferredContactMethod: input.preferredContactMethod,
      notes: input.notes,
      status: input.status,
      roles: input.roles,
      isPrimary: input.isPrimary ?? false,
    },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.contact.updated",
    entityType: "Contact",
    entityId: contact.id,
    before: { firstName: before.firstName, surname: before.surname, jobTitle: before.jobTitle },
    after: { firstName: contact.firstName, surname: contact.surname, jobTitle: contact.jobTitle },
  });

  revalidatePath(`/customers/${input.partyId}`);
  return contact;
}

export async function deleteContact(contactId: string, partyId: string) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.contactsManage);

  await assertOwnedByOrg(session.organisationId, partyId);
  const contact = await db.contact.findFirstOrThrow({ where: { id: contactId, partyId } });

  try {
    await db.contact.delete({ where: { id: contactId } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2003") {
      throw error;
    }

    const after = await db.contact.update({ where: { id: contactId }, data: { status: "INACTIVE" } });
    await writeAudit({
      organisationId: session.organisationId,
      actorUserId: session.userId,
      action: "customer.contact.deactivated",
      entityType: "Contact",
      entityId: contactId,
      before: { firstName: contact.firstName, surname: contact.surname, status: contact.status },
      after: { status: after.status },
    });
    revalidatePath(`/customers/${partyId}`);
    return;
  }

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.contact.deleted",
    entityType: "Contact",
    entityId: contactId,
    before: { firstName: contact.firstName, surname: contact.surname },
  });

  revalidatePath(`/customers/${partyId}`);
}

export type CreateAddressInput = {
  partyId: string;
  type: AddressType;
  line1: string;
  label?: string;
  line2?: string;
  region?: string;
  telephone?: string;
  deliveryInstructions?: string;
  city?: string;
  postcode?: string;
  country?: string;
  isDefaultBilling?: boolean;
  isDefaultDelivery?: boolean;
};

export async function createAddress(input: CreateAddressInput) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.addressesManage);

  await assertOwnedByOrg(session.organisationId, input.partyId);

  if (input.isDefaultBilling) {
    await db.address.updateMany({ where: { partyId: input.partyId }, data: { isDefaultBilling: false } });
  }
  if (input.isDefaultDelivery) {
    await db.address.updateMany({ where: { partyId: input.partyId }, data: { isDefaultDelivery: false } });
  }

  const address = await db.address.create({
    data: {
      partyId: input.partyId,
      type: input.type,
      line1: input.line1,
      label: input.label,
      line2: input.line2,
      region: input.region,
      telephone: input.telephone,
      deliveryInstructions: input.deliveryInstructions,
      city: input.city,
      postcode: input.postcode,
      country: input.country,
      isDefaultBilling: input.isDefaultBilling ?? false,
      isDefaultDelivery: input.isDefaultDelivery ?? false,
    },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.address.created",
    entityType: "Address",
    entityId: address.id,
    after: { type: address.type, line1: address.line1 },
  });
  await emit(DOMAIN_EVENTS.customerAddressCreated, { addressId: address.id, partyId: input.partyId });

  revalidatePath(`/customers/${input.partyId}`);
  return address;
}

// ---------- Commercial ----------

export async function updateCommercialSettings(
  partyId: string,
  data: { accountManagerUserId?: string; territory?: string; customerGroup?: string; customerPoRequired?: boolean },
) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.commercialManage);
  await assertOwnedByOrg(session.organisationId, partyId);

  await db.party.update({
    where: { id: partyId },
    data: { accountManagerUserId: data.accountManagerUserId, territory: data.territory, customerGroup: data.customerGroup },
  });

  await db.customerCommercialSettings.upsert({
    where: { partyId },
    create: { partyId, customerPoRequired: data.customerPoRequired ?? false },
    update: { customerPoRequired: data.customerPoRequired },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.commercial_settings.updated",
    entityType: "Party",
    entityId: partyId,
    after: data,
  });

  revalidatePath(`/customers/${partyId}`);
}

// ---------- Credit ----------

export async function updateCreditLimit(partyId: string, creditLimitAmount: number, creditLimitCurrency = "GBP") {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.creditManage);
  await assertOwnedByOrg(session.organisationId, partyId);

  const before = await db.customerCreditProfile.findUnique({ where: { partyId } });

  const after = await db.customerCreditProfile.upsert({
    where: { partyId },
    create: { partyId, creditLimitAmount, creditLimitCurrency },
    update: { creditLimitAmount, creditLimitCurrency },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.credit_limit_changed",
    entityType: "Party",
    entityId: partyId,
    before: { creditLimitAmount: before?.creditLimitAmount ?? 0 },
    after: { creditLimitAmount: after.creditLimitAmount },
  });
  await emit(DOMAIN_EVENTS.customerCreditLimitChanged, { partyId, creditLimitAmount });

  revalidatePath(`/customers/${partyId}`);
}

export async function setCreditHold(partyId: string, onHold: boolean, reason?: string) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.creditManage);
  await assertOwnedByOrg(session.organisationId, partyId);

  await db.customerCreditProfile.upsert({
    where: { partyId },
    create: { partyId, onHold, holdReason: reason, holdDate: onHold ? new Date() : null, holdSetByUserId: session.userId },
    update: { onHold, holdReason: onHold ? reason : null, holdDate: onHold ? new Date() : null, holdSetByUserId: session.userId },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: onHold ? "customer.credit_hold.placed" : "customer.credit_hold.released",
    entityType: "Party",
    entityId: partyId,
    after: { onHold, reason },
  });
  if (onHold) {
    await emit(DOMAIN_EVENTS.customerOnHold, { partyId });
    await writeActivity({
      organisationId: session.organisationId,
      type: DOMAIN_EVENTS.customerOnHold,
      summary: `Credit hold placed${reason ? ` — ${reason}` : ""}`,
      entityType: "Party",
      entityId: partyId,
      partyId,
    });
  }

  revalidatePath(`/customers/${partyId}`);
}

export async function setPaymentTerm(partyId: string, paymentTermId: string | null, paymentMethod?: PaymentMethod) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.creditManage);
  await assertOwnedByOrg(session.organisationId, partyId);

  await db.customerCreditProfile.upsert({
    where: { partyId },
    create: { partyId, paymentTermId, paymentMethod },
    update: { paymentTermId, paymentMethod },
  });

  revalidatePath(`/customers/${partyId}`);
}

// ---------- Tax ----------

export type CreateTaxRegistrationInput = {
  partyId: string;
  jurisdiction: string;
  registrationType: string;
  number: string;
};

export async function createTaxRegistration(input: CreateTaxRegistrationInput) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.taxManage);
  await assertOwnedByOrg(session.organisationId, input.partyId);

  const registration = await db.taxRegistration.create({
    data: {
      partyId: input.partyId,
      jurisdiction: input.jurisdiction,
      registrationType: input.registrationType,
      number: input.number,
      normalizedNumber: normalizeTaxNumber(input.number),
    },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.tax_registration.added",
    entityType: "TaxRegistration",
    entityId: registration.id,
    after: { jurisdiction: registration.jurisdiction, registrationType: registration.registrationType },
  });
  await emit(DOMAIN_EVENTS.customerTaxRegistrationAdded, { registrationId: registration.id, partyId: input.partyId });

  revalidatePath(`/customers/${input.partyId}`);
  return registration;
}

/** Records that a staff member manually confirmed this registration — honest
 *  about the source (§20). Never claims an automated verification that didn't
 *  happen; see docs/CUSTOMER_MASTER.md §VAT for the integration boundary a
 *  future validation service would fill. */
export async function markTaxRegistrationManuallyVerified(registrationId: string, partyId: string) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.taxManage);
  await assertOwnedByOrg(session.organisationId, partyId);

  await db.taxRegistration.update({
    where: { id: registrationId },
    data: { validationStatus: "MANUALLY_VERIFIED", validationDate: new Date(), validationSource: "manual" },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.tax_registration.manually_verified",
    entityType: "TaxRegistration",
    entityId: registrationId,
  });
  await emit(DOMAIN_EVENTS.customerTaxRegistrationVerified, { registrationId, partyId, source: "manual" });

  revalidatePath(`/customers/${partyId}`);
}

// ---------- Bank & Direct Debit ----------

export type CreateBankAccountInput = {
  partyId: string;
  accountHolder: string;
  bankName?: string;
  country: string;
  currency: string;
  sortCode?: string;
  accountNumber?: string;
  iban?: string;
  bic?: string;
};

export async function createBankAccount(input: CreateBankAccountInput) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.bankManage);
  await assertOwnedByOrg(session.organisationId, input.partyId);

  const account = await db.bankAccount.create({
    data: {
      partyId: input.partyId,
      accountHolder: input.accountHolder,
      bankName: input.bankName,
      country: input.country,
      currency: input.currency,
      sortCode: input.sortCode,
      accountNumber: input.accountNumber,
      iban: input.iban,
      bic: input.bic,
    },
  });

  // Never record raw account numbers in audit text — note only that a bank
  // account was added (§39).
  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.bank_account.added",
    entityType: "BankAccount",
    entityId: account.id,
    after: { bankName: account.bankName, country: account.country },
  });
  await emit(DOMAIN_EVENTS.customerBankAccountAdded, { bankAccountId: account.id, partyId: input.partyId });

  revalidatePath(`/customers/${input.partyId}`);
  return maskBankAccount(account);
}

/** Capability-gated, audited reveal of full bank details. Called on demand by
 *  the UI — full values are never embedded in the initial page payload (§23). */
export async function revealBankAccount(bankAccountId: string, partyId: string) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.bankReveal);
  await assertOwnedByOrg(session.organisationId, partyId);

  const account = await db.bankAccount.findFirstOrThrow({ where: { id: bankAccountId, partyId } });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.bank_account.revealed",
    entityType: "BankAccount",
    entityId: bankAccountId,
  });

  return account;
}

export type CreateDirectDebitInput = {
  partyId: string;
  bankAccountId: string;
  scheme: DirectDebitScheme;
  mandateReference: string;
};

export async function createDirectDebitMandate(input: CreateDirectDebitInput) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.bankManage);
  await assertOwnedByOrg(session.organisationId, input.partyId);

  const mandate = await db.directDebitMandate.create({
    data: {
      partyId: input.partyId,
      bankAccountId: input.bankAccountId,
      scheme: input.scheme,
      mandateReference: input.mandateReference,
      status: "ACTIVE",
      agreedDate: new Date(),
      effectiveDate: new Date(),
    },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.direct_debit.created",
    entityType: "DirectDebitMandate",
    entityId: mandate.id,
    after: { mandateReference: mandate.mandateReference, scheme: mandate.scheme },
  });
  await emit(DOMAIN_EVENTS.customerDirectDebitCreated, { mandateId: mandate.id, partyId: input.partyId });

  revalidatePath(`/customers/${input.partyId}`);
  return mandate;
}

export async function cancelDirectDebitMandate(mandateId: string, partyId: string, reason?: string) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.bankManage);
  await assertOwnedByOrg(session.organisationId, partyId);

  await db.directDebitMandate.update({
    where: { id: mandateId },
    data: { status: "CANCELLED", cancellationDate: new Date(), cancellationReason: reason },
  });

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.direct_debit.cancelled",
    entityType: "DirectDebitMandate",
    entityId: mandateId,
    after: { reason },
  });
  await emit(DOMAIN_EVENTS.customerDirectDebitCancelled, { mandateId, partyId });

  revalidatePath(`/customers/${partyId}`);
}

// ---------- Notes ----------

export async function createNote(partyId: string, body: string, pinned: boolean, restricted: boolean) {
  const session = await requireSession();
  assertCapability(session, restricted ? CUSTOMER_CAPABILITIES.restrictedNotesManage : CUSTOMER_CAPABILITIES.edit);
  await assertOwnedByOrg(session.organisationId, partyId);

  const note = await db.note.create({
    data: { partyId, body, pinned, restricted, authorUserId: session.userId },
  });

  revalidatePath(`/customers/${partyId}`);
  return note;
}

export async function saveCustomerHashtags(partyId: string, formData: FormData) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.edit);
  await assertOwnedByOrg(session.organisationId, partyId);
  const tags = parseHashtags(String(formData.get("tags") ?? ""));
  await db.party.updateMany({ where: { id: partyId, organisationId: session.organisationId }, data: { tags } });
  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: "customer.hashtags_updated",
    entityType: "Party",
    entityId: partyId,
    after: { tags },
  });
  revalidatePath(`/customers/${partyId}`);
  revalidatePath("/customers");
}

// ---------- Shared guard ----------

async function assertOwnedByOrg(organisationId: string, partyId: string) {
  const party = await db.party.findFirst({ where: { id: partyId, organisationId }, select: { id: true } });
  if (!party) throw new Error("NOT_FOUND: customer does not belong to this organisation");
}

// ---------- Edit details and addresses ----------

const field = (form: FormData, name: string, max = 200) => String(form.get(name) ?? "").trim().slice(0, max);
const ADDRESS_KINDS = ["REGISTERED", "BILLING", "DELIVERY", "SITE", "SERVICE", "OFFICE", "OTHER"];

/** The customer's own identity: names, registration, classification and account manager. */
export async function updateCustomerDetails(partyId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.edit);
  const before = await db.party.findFirst({ where: { id: partyId, organisationId: session.organisationId } });
  if (!before) throw new Error("This customer no longer exists.");
  const name = field(form, "name");
  if (!name) throw new Error("Enter the customer's name.");
  const currency = field(form, "preferredCurrency", 3).toUpperCase() || before.preferredCurrency;
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Currency is a three-letter code, for example GBP.");
  const website = field(form, "website", 300);
  if (website && !/^https?:\/\/\S+\.\S+$/i.test(website)) throw new Error("Enter the website with http:// or https://, or leave it blank.");
  const accountManagerUserId = field(form, "accountManagerUserId", 60) || null;
  if (accountManagerUserId && !(await db.membership.findFirst({ where: { organisationId: session.organisationId, userId: accountManagerUserId }, select: { id: true } }))) throw new Error("Choose an account manager from your team.");
  const started = field(form, "relationshipStartDate", 10);
  const relationshipStartDate = started ? new Date(`${started}T00:00:00Z`) : null;
  if (relationshipStartDate && Number.isNaN(relationshipStartDate.getTime())) throw new Error("Enter a valid date.");
  const data = {
    name, tradingName: field(form, "tradingName") || null, kind: (form.get("kind") === "PERSON" ? "PERSON" : "COMPANY") as PartyKind, customerGroup: field(form, "customerGroup", 100) || null, industry: field(form, "industry", 100) || null,
    website: website || null, registrationNumber: field(form, "registrationNumber", 60) || null, countryOfRegistration: field(form, "countryOfRegistration", 60) || null, territory: field(form, "territory", 100) || null,
    preferredLanguage: field(form, "preferredLanguage", 40) || null, preferredCurrency: currency, accountManagerUserId, relationshipStartDate,
  };
  await db.party.update({ where: { id: partyId }, data });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "customer.details_updated", entityType: "Party", entityId: partyId, before: { name: before.name, tradingName: before.tradingName, accountManagerUserId: before.accountManagerUserId, preferredCurrency: before.preferredCurrency }, after: { name, tradingName: data.tradingName, accountManagerUserId, preferredCurrency: currency } });
  revalidatePath(`/customers/${partyId}`);
  revalidatePath("/customers");
}

export async function updateAddress(addressId: string, partyId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.addressesManage);
  const before = await db.address.findFirst({ where: { id: addressId, partyId, party: { organisationId: session.organisationId } } });
  if (!before) throw new Error("This address no longer exists.");
  const type = field(form, "type", 20), line1 = field(form, "line1");
  if (!ADDRESS_KINDS.includes(type)) throw new Error("Choose the kind of address.");
  if (!line1) throw new Error("Enter the first line of the address.");
  const billing = form.get("isDefaultBilling") === "on", delivery = form.get("isDefaultDelivery") === "on";
  await db.$transaction(async (tx) => {
    if (billing) await tx.address.updateMany({ where: { partyId }, data: { isDefaultBilling: false } });
    if (delivery) await tx.address.updateMany({ where: { partyId }, data: { isDefaultDelivery: false } });
    await tx.address.update({ where: { id: addressId }, data: { type: type as AddressType, label: field(form, "label", 100) || null, line1, line2: field(form, "line2") || null, city: field(form, "city", 100) || null, region: field(form, "region", 100) || null, postcode: field(form, "postcode", 20) || null, country: field(form, "country", 60) || null, telephone: field(form, "telephone", 40) || null, deliveryInstructions: field(form, "deliveryInstructions", 1000) || null, isDefaultBilling: billing, isDefaultDelivery: delivery } });
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "customer.address.updated", entityType: "Address", entityId: addressId, before: { type: before.type, line1: before.line1, postcode: before.postcode }, after: { type, line1 } });
  revalidatePath(`/customers/${partyId}`);
}

/** Addresses are retired, not deleted: quotations and orders keep their own copy of the address they used. */
export async function archiveAddress(addressId: string, partyId: string) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.addressesManage);
  const changed = await db.address.updateMany({ where: { id: addressId, partyId, party: { organisationId: session.organisationId } }, data: { active: false, isDefaultBilling: false, isDefaultDelivery: false } });
  if (!changed.count) throw new Error("This address no longer exists.");
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "customer.address.archived", entityType: "Address", entityId: addressId });
  revalidatePath(`/customers/${partyId}`);
}
