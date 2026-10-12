"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { searchTicketAdditionalDetails, searchTicketAdditionalDetailReferences } from "./field-search";

export async function findTicketsByAdditionalDetail(input: unknown) {
  const session = await requireSession();
  assertCapability(session, "tickets.ticket.read");
  return searchTicketAdditionalDetails(session, input);
}
export async function findTicketAdditionalDetailReferences(input: unknown) {
  const session = await requireSession();
  assertCapability(session, "tickets.ticket.read");
  return searchTicketAdditionalDetailReferences(session, input);
}
