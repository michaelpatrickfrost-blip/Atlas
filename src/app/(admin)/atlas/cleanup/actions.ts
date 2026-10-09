"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { CleanupValidationError, cleanupConfirmation, readCleanupSelection } from "@/core/admin/cleanup-input";
import { finishCompanyFileCleanup, wipeTestCompanies } from "@/core/admin/wipe-company";
export type CleanupResult = { error: string } | { runId: string; deleted: number; filesPending: number };

export async function deleteSelectedTestCompanies(form: FormData): Promise<CleanupResult> {
  const session = await requireSession();
  assertCapability(session, "atlas.companies.archive");
  try {
    const selection = readCleanupSelection(String(form.get("selectedCompanies") ?? ""));
    if (String(form.get("confirmation") ?? "").trim() !== cleanupConfirmation(selection.length) || form.get("acknowledge") !== "on") return { error: "Type the confirmation shown and acknowledge permanent deletion." };
    const user = await db.user.findUniqueOrThrow({ where: { id: session.userId }, select: { passwordHash: true } });
    if (!await bcrypt.compare(String(form.get("currentPassword") ?? ""), user.passwordHash)) return { error: "Your administrator password was not recognised. Use your own Atlas sign-in password." };
    const run = await wipeTestCompanies(selection.map(item => item.id), { actorUserId: session.userId, currentOrganisationId: session.organisationId, selection });
    revalidatePath("/", "layout");
    return { runId: run.id, deleted: selection.length, filesPending: run.remainingFileKeys.length };
  } catch (error) {
    if (error instanceof CleanupValidationError) return { error: error.message };
    console.error("Atlas company cleanup failed", error);
    return { error: "Cleanup could not finish. Refresh this page to check its status before trying again. The deletion transaction commits the whole selection or rolls back." };
  }
}
export async function retryCompanyFileCleanup(form: FormData): Promise<CleanupResult> {
  const session = await requireSession();
  assertCapability(session, "atlas.companies.archive");
  const runId = String(form.get("runId") ?? "");
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(runId)) return { error: "Choose a cleanup run from this page." };
  try {
    const run = await finishCompanyFileCleanup(runId);
    revalidatePath("/atlas/cleanup");
    return { runId: run.id, deleted: Array.isArray(run.companies) ? run.companies.length : 0, filesPending: run.remainingFileKeys.length };
  } catch {
    return { error: "Attachment cleanup is unavailable. The remaining files are recorded for another retry." };
  }
}
