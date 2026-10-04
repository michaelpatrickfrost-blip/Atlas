"use server";
import { assertRecordCreationAllowed } from "@/core/policies/record-creation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { parseCsv } from "@/core/shared/csv";
import { runSetupImport } from "@/core/setup/apply-import";
import { revalidatePath } from "next/cache";

export type ImportResult = { error: string; message: string; preview: Record<string, string>[] };

function capability(entity: string) {
  const caps: Record<string, string> = { customers: "customers.create", products: "core.products.manage", prices: "core.pricing.manage" };
  if (!caps[entity]) throw new Error("Choose a supported import.");
  return caps[entity];
}

export async function importCsv(_state: ImportResult, form: FormData): Promise<ImportResult> {
  const session = await requireSession();
  const entity = String(form.get("entity"));
  assertCapability(session, capability(entity));
  try {
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 2_000_000) throw new Error("Choose a CSV file smaller than 2 MB.");
    const rows = parseCsv(await file.text());
    const priceListId = String(form.get("priceListId") ?? "");
    if (entity === "customers") await assertRecordCreationAllowed(session.organisationId, "customers");
    if (entity === "products") {
      const codes = await db.product.findMany({ where: { organisationId: session.organisationId, code: { in: rows.map((row) => row.code) } }, select: { code: true } });
      if (rows.some((row) => !codes.some((code) => code.code === row.code))) await assertRecordCreationAllowed(session.organisationId, "products");
    }
    const applying = form.get("mode") === "apply";
    const result = await runSetupImport({ organisationId: session.organisationId, actorUserId: session.userId, entity, rows, applying, fileName: file.name, priceListId, customerStatusDefault: "PROSPECT" });
    if (applying) {
      revalidatePath("/", "layout");
      return { error: "", message: `Imported ${rows.length} records.`, preview: [] };
    }
    return { error: "", message: `${rows.length} valid rows. Review the first 10 below, then import.`, preview: result.preview };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Import failed.", message: "", preview: [] };
  }
}
