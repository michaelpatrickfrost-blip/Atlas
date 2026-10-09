"use server";

import { revalidatePath } from "next/cache";
import {
  createContact,
  updateContact,
  deleteContact,
  createAddress,
  createTaxRegistration,
  markTaxRegistrationManuallyVerified,
  createBankAccount,
  createDirectDebitMandate,
  cancelDirectDebitMandate,
  updateCreditLimit,
  setCreditHold,
  createNote,
  updateCustomerStatus,
  archiveCustomer,
  unarchiveCustomer,
  deleteCustomer,
} from "@/core/customers/commands";
import { redirect } from "next/navigation";
import type { AddressType, ContactPreferredMethod, ContactRole, ContactStatus, DirectDebitScheme } from "@/generated/prisma/client";

/** Thin FormData -> typed-command adapters so record-page forms can post
 *  directly to server actions without a client-side state layer. */

export async function createContactFormAction(partyId: string, formData: FormData) {
  await createContact({
    partyId,
    firstName: String(formData.get("firstName")),
    surname: String(formData.get("surname")),
    jobTitle: String(formData.get("jobTitle") || "") || undefined,
    department: String(formData.get("department") || "") || undefined,
    email: String(formData.get("email") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
    mobile: String(formData.get("mobile") || "") || undefined,
    roles: (formData.getAll("roles") as ContactRole[]).length > 0 ? (formData.getAll("roles") as ContactRole[]) : ["OTHER"],
    isPrimary: formData.get("isPrimary") === "on",
  });
}

export async function updateContactFormAction(contactId: string, partyId: string, formData: FormData) {
  await updateContact({
    contactId,
    partyId,
    title: String(formData.get("title") || "") || undefined,
    firstName: String(formData.get("firstName")),
    surname: String(formData.get("surname")),
    preferredName: String(formData.get("preferredName") || "") || undefined,
    jobTitle: String(formData.get("jobTitle") || "") || undefined,
    department: String(formData.get("department") || "") || undefined,
    email: String(formData.get("email") || "") || undefined,
    alternativeEmail: String(formData.get("alternativeEmail") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
    mobile: String(formData.get("mobile") || "") || undefined,
    preferredContactMethod: (String(formData.get("preferredContactMethod") || "") || undefined) as ContactPreferredMethod | undefined,
    notes: String(formData.get("notes") || "") || undefined,
    status: (String(formData.get("status") || "ACTIVE") as ContactStatus),
    roles: (formData.getAll("roles") as ContactRole[]).length > 0 ? (formData.getAll("roles") as ContactRole[]) : ["OTHER"],
    isPrimary: formData.get("isPrimary") === "on",
  });
}

export async function deleteContactFormAction(contactId: string, partyId: string) {
  await deleteContact(contactId, partyId);
}

export async function createAddressFormAction(partyId: string, formData: FormData) {
  await createAddress({
    partyId,
    type: (formData.get("type") as AddressType) ?? "OTHER",
    line1: String(formData.get("line1")),
    label: String(formData.get("label") || "") || undefined,
    line2: String(formData.get("line2") || "") || undefined,
    region: String(formData.get("region") || "") || undefined,
    telephone: String(formData.get("telephone") || "") || undefined,
    deliveryInstructions: String(formData.get("deliveryInstructions") || "") || undefined,
    city: String(formData.get("city") || "") || undefined,
    postcode: String(formData.get("postcode") || "") || undefined,
    country: String(formData.get("country") || "") || undefined,
    isDefaultBilling: formData.get("isDefaultBilling") === "on",
    isDefaultDelivery: formData.get("isDefaultDelivery") === "on",
  });
}

export async function createTaxRegistrationFormAction(partyId: string, formData: FormData) {
  await createTaxRegistration({
    partyId,
    jurisdiction: String(formData.get("jurisdiction")),
    registrationType: String(formData.get("registrationType")),
    number: String(formData.get("number")),
  });
}

export async function markTaxVerifiedFormAction(registrationId: string, partyId: string) {
  await markTaxRegistrationManuallyVerified(registrationId, partyId);
}

export async function createBankAccountFormAction(partyId: string, formData: FormData) {
  await createBankAccount({
    partyId,
    accountHolder: String(formData.get("accountHolder")),
    bankName: String(formData.get("bankName") || "") || undefined,
    country: String(formData.get("country") || "GB"),
    currency: String(formData.get("currency") || "GBP"),
    sortCode: String(formData.get("sortCode") || "") || undefined,
    accountNumber: String(formData.get("accountNumber") || "") || undefined,
    iban: String(formData.get("iban") || "") || undefined,
    bic: String(formData.get("bic") || "") || undefined,
  });
}

export async function createDirectDebitFormAction(partyId: string, formData: FormData) {
  await createDirectDebitMandate({
    partyId,
    bankAccountId: String(formData.get("bankAccountId")),
    scheme: (formData.get("scheme") as DirectDebitScheme) ?? "BACS",
    mandateReference: String(formData.get("mandateReference")),
  });
}

export async function cancelDirectDebitFormAction(mandateId: string, partyId: string) {
  await cancelDirectDebitMandate(mandateId, partyId, "Cancelled by user");
}

export async function updateCreditLimitFormAction(partyId: string, formData: FormData) {
  const pounds = Number(formData.get("limit") || 0);
  await updateCreditLimit(partyId, Math.round(pounds * 100), String(formData.get("currency") || "GBP"));
}

export async function toggleCreditHoldFormAction(partyId: string, onHold: boolean, formData: FormData) {
  await setCreditHold(partyId, onHold, String(formData.get("reason") || "") || undefined);
}

export async function createNoteFormAction(partyId: string, formData: FormData) {
  await createNote(partyId, String(formData.get("body") ?? ""), formData.get("pinned") === "on", formData.get("restricted") === "on");
}

export async function updateStatusFormAction(partyId: string, formData: FormData) {
  await updateCustomerStatus(partyId, formData.get("status") as never);
  revalidatePath(`/customers/${partyId}`);
}

export async function archiveCustomerFormAction(partyId: string) {
  await archiveCustomer(partyId);
}

export async function unarchiveCustomerFormAction(partyId: string) {
  await unarchiveCustomer(partyId);
}

export async function deleteCustomerFormAction(partyId: string) {
  await deleteCustomer(partyId);
  redirect('/customers');
}
