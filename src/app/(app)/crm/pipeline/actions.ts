"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { createOpportunity } from "@/modules/crm/services/opportunities";
import { convertProspect } from "@/modules/crm/services/prospects";

/** Add a deal to the pipeline for an existing customer or straight from a prospect. */
export async function addDealAction(form: FormData) {
  const session = await requireSession();
  const [kind, id] = String(form.get("for") ?? "").split(":");
  if (!id || (kind !== "party" && kind !== "prospect")) throw new Error("Choose who the deal is for.");
  const value = String(form.get("valueAmount") ?? "").trim(), valueAmount = value ? Math.round(Number(value) * 100) : 0;
  if (!Number.isSafeInteger(valueAmount) || valueAmount < 0) throw new Error("Enter a value of zero or more.");
  const typed = String(form.get("name") ?? "").trim();
  if (kind === "prospect") {
    const prospect = await db.prospect.findFirst({ where: { id, organisationId: session.organisationId }, select: { companyName: true, estimatedValueAmount: true } });
    if (!prospect) throw new Error("This prospect no longer exists.");
    await convertProspect(id, { opportunityName: typed || `${prospect.companyName} — new business`, valueAmount: value ? valueAmount : prospect.estimatedValueAmount ?? 0 });
  } else {
    const party = await db.party.findFirst({ where: { id, organisationId: session.organisationId }, select: { name: true } });
    if (!party) throw new Error("This customer no longer exists.");
    const close = String(form.get("expectedCloseDate") ?? "");
    const expectedCloseDate = close ? new Date(`${close}T00:00:00Z`) : undefined;
    if (expectedCloseDate && Number.isNaN(expectedCloseDate.getTime())) throw new Error("Enter a valid date.");
    await createOpportunity({ partyId: id, name: typed || `${party.name} — new business`, valueAmount, pipelineId: String(form.get("pipelineId") ?? "") || undefined, expectedCloseDate });
  }
  revalidatePath("/crm/pipeline");
  revalidatePath("/crm/prospect");
}
