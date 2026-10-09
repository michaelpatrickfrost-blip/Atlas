"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { parseCsv } from "@/core/shared/csv";
import { revalidatePath } from "next/cache";
import { runConnectionImport } from "@/modules/connections/services/import";
import { importFingerprint, signReview, verifyReview } from "@/modules/connections/domain/review";

export type ConnectionResult = { error: string; message: string; token: string; preview: Record<string, string>[] };
export async function attachConnection(_previous: ConnectionResult, form: FormData): Promise<ConnectionResult> {
  const session = await requireSession();
  assertCapability(session, "atlas.companies.manage");
  try {
    const organisationId = String(form.get("organisationId") ?? "");
    const entity = String(form.get("entity") ?? "");
    if (!organisationId || organisationId.length > 64) throw new Error("Select the company to attach this file to.");
    const company = await db.organisation.findFirst({ where: { id: organisationId, kind: "CUSTOMER", archivedAt: null }, select: { id: true, name: true } });
    if (!company) throw new Error("This company is unavailable. Choose an unarchived customer company.");
    const mode = String(form.get("mode") ?? "preview");
    if (!["preview", "apply"].includes(mode)) throw new Error("Choose validate or attach.");
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > 2_000_000 || !file.name.toLowerCase().endsWith(".csv")) throw new Error("Upload a CSV file between 1 byte and 2 MB.");
    const content = await file.text();
    const importKey = importFingerprint(organisationId, entity, content);
    const applying = mode === "apply";
    if (applying) {
      verifyReview(String(form.get("token") ?? ""), importKey, session.userId);
      if (form.get("acknowledge") !== "yes") throw new Error("Confirm the selected company and import rules before attaching.");
    }
    const rows = parseCsv(content);
    const result = await runConnectionImport({ organisationId, entity, rows, actorUserId: session.userId, applying, fileName: file.name, importKey, customerStatusDefault: "ACTIVE" });
    if (applying) {
      revalidatePath("/atlas/connections");
      revalidatePath(`/atlas/${organisationId}/setup`);
      return { error: "", message: `Attached ${rows.length} rows to ${company.name}. The records are now available in their apps.`, token: "", preview: [] };
    }
    return { error: "", message: `${rows.length} rows validated for ${company.name}. Review the preview and rules, then attach.`, token: signReview(importKey, session.userId), preview: result.preview };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The file could not be attached. Try validating again.", message: "", token: "", preview: [] };
  }
}
