"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { findPossibleDuplicates, type DuplicateCandidate } from "@/core/customers/duplicate-detection";
import { createCustomer, type QuickCreateInput } from "@/core/customers/commands";

export async function checkForDuplicatesAction(input: {
  name: string;
  registrationNumber?: string;
  taxNumber?: string;
  email?: string;
}): Promise<DuplicateCandidate[]> {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.create);
  if (!input.name.trim()) return [];
  return findPossibleDuplicates(session.organisationId, input);
}

export async function createCustomerAction(input: QuickCreateInput) {
  const session=await requireSession();
  assertCapability(session,CUSTOMER_CAPABILITIES.create);
  const customer = await createCustomer(input);
  redirect(`/customers/${customer.id}`);
}
