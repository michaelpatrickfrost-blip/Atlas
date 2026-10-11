"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { withFormFeedback } from "@/core/shared/form-feedback";
import { refresh, revalidatePath } from "next/cache";
import { parseTicketRecordTypeForm, reassignTicketRecordType } from "./record-types";

export async function changeTicketBusinessType(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "tickets.ticket.manage");
  return withFormFeedback(async () => {
    const request = parseTicketRecordTypeForm(form);
    await reassignTicketRecordType(session, request);
    revalidatePath(`/tickets/${request.recordId}`);
    refresh();
  });
}
