"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { withFormFeedback } from "@/core/shared/form-feedback";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseTicketRecordTypeForm, reassignTicketRecordType } from "./record-types";

export async function changeTicketBusinessType(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "tickets.ticket.manage");
  return withFormFeedback(async () => {
    const request = parseTicketRecordTypeForm(form);
    await reassignTicketRecordType(session, request);
    revalidatePath(`/tickets/${request.recordId}`);
    // A different type may select a different retained Page. Return to the
    // complete native record so its newly resolved business-layout link is used;
    // refreshing the old layout address would assert the obsolete selection.
    redirect(`/tickets/${encodeURIComponent(request.recordId)}`);
  });
}
