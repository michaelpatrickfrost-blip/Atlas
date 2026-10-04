"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { parseCsv } from "@/core/shared/csv";
import { runSetupImport } from "@/core/setup/apply-import";
import { revalidatePath } from "next/cache";

export type CsvImportResult = { error: string; message: string; preview: Record<string, string>[] };

export async function importSalescsv(_state: CsvImportResult, form: FormData): Promise<CsvImportResult> {
  const session = await requireSession();
  const entity = String(form.get("entity"));

  if (entity === "orders") {
    assertCapability(session, "sales.order.create");
  } else if (entity === "quotes") {
    assertCapability(session, "sales.quote.create");
  } else {
    return { error: "Invalid entity type", message: "", preview: [] };
  }

  try {
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 2_000_000) throw new Error("Choose a CSV file smaller than 2 MB.");

    const rows = parseCsv(await file.text());
    if (rows.length > 500) throw new Error("Maximum 500 rows per import.");

    const applying = form.get("mode") === "apply";
    const entityType = entity === "orders" ? "sales-orders" : "sales-quotes";

    const result = await runSetupImport({
      organisationId: session.organisationId,
      actorUserId: session.userId,
      entity: entityType,
      rows,
      applying,
      fileName: file.name,
    });

    if (applying) {
      revalidatePath("/sales/orders");
      revalidatePath("/sales/quotes");
      revalidatePath("/sales/documents");
      return { error: "", message: `Imported ${rows.length} ${entity}.`, preview: [] };
    }

    return { error: "", message: `${rows.length} valid rows. Review the first 10 below, then import.`, preview: result.preview };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Import failed.", message: "", preview: [] };
  }
}
