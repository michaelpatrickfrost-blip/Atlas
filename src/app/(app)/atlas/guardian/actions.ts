"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { GUARDIAN_CAPABILITY, ISSUE_STATES } from "@/core/guardian/report";
import { queueSweep } from "@/core/guardian/store";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function requestGuardianSweep() {
  const session = await requireSession();
  assertCapability(session, GUARDIAN_CAPABILITY);
  await queueSweep(session.userId);
  revalidatePath("/atlas/guardian");
  redirect("/atlas/guardian?queued=1");
}
export async function updateGuardianIssue(form: FormData) {
  const session = await requireSession();
  assertCapability(session, GUARDIAN_CAPABILITY);
  const input = z.object({ id: z.string().min(1).max(100), status: z.enum(ISSUE_STATES), resolution: z.string().trim().max(4000), verifiedRevision: z.string().trim().max(80) }).parse(Object.fromEntries(form));
  if (input.status === "NEEDS_AI" && !input.resolution) throw new Error("Record the blocker and next action before requesting AI repair.");
  if (input.status === "FIXED" && (!input.resolution || !input.verifiedRevision)) throw new Error("Record the successful reproduction check and deployed revision before marking fixed.");
  await db.guardianIssue.update({ where: { id: input.id }, data: { status: input.status, resolution: input.resolution, verifiedRevision: input.verifiedRevision, reviewedBy: session.userId } });
  revalidatePath("/atlas/guardian");
  redirect(`/atlas/guardian/${input.id}`);
}
