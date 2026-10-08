import { db } from "@/core/db/client";
import type { Prisma, ManufacturingResourceType } from "@/generated/prisma/client";
import { runSetupImport, type SetupImportInput } from "@/core/setup/apply-import";
import { missingColumns, duplicateKeyIssue, rowIssue } from "@/core/setup/validate";
import { connectionTemplate } from "../domain/catalogue";
import { importSalesDrafts } from "@/modules/sales/services/connection-import";

type Tx = Prisma.TransactionClient;
const TYPES: string[] = ["MACHINE", "PRODUCTION_LINE", "LABOUR_TEAM", "WORKSTATION", "CELL", "SUBCONTRACT"];
async function manufacturing(tx: Tx, input: SetupImportInput) {
  const centres = await tx.manufacturingWorkCentre.findMany({ where: { organisationId: input.organisationId } });
  for (const [index, row] of input.rows.entries()) {
    if (!row.name || row.name.length > 120) throw new Error(rowIssue(index, "enter a name up to 120 characters."));
    if (input.entity === "work-centres") {
      if (!/^[A-Z0-9][A-Z0-9-]{0,30}$/.test(row.code)) throw new Error(rowIssue(index, "work centre code must use uppercase letters, numbers and hyphens (up to 31)."));
      if ((row.description ?? "").length > 2000) throw new Error(rowIssue(index, "description is too long."));
      if (input.applying) await tx.manufacturingWorkCentre.upsert({ where: { organisationId_code: { organisationId: input.organisationId, code: row.code } }, create: { organisationId: input.organisationId, code: row.code, name: row.name, description: row.description || null }, update: { name: row.name, description: row.description || null } });
    } else {
      const centre = centres.find(centre => centre.code === row.workCentreCode && centre.active);
      if (!centre) throw new Error(rowIssue(index, `active work centre ${row.workCentreCode} is missing. Import work centres first.`));
      if (!TYPES.includes(row.type)) throw new Error(rowIssue(index, "choose a supported resource type."));
      for (const key of ["nominalUnitsPerHour", "planningEfficiencyPercent"]) {
        const value = row[key];
        if (value && (!/^\d+(\.\d{1,4})?$/.test(value) || Number(value) <= 0 || Number(value) > (key === "planningEfficiencyPercent" ? 100 : 1_000_000))) throw new Error(rowIssue(index, `${key} must be positive and within the template's limits.`));
      }
      const matches = await tx.manufacturingResource.findMany({ where: { organisationId: input.organisationId, workCentreId: centre.id, name: row.name }, select: { id: true } });
      if (matches.length > 1) throw new Error(rowIssue(index, "more than one existing resource has this name. Rename them in Manufacturing first."));
      if (input.applying) {
        const data = { name: row.name, type: row.type as ManufacturingResourceType, ...(row.nominalUnitsPerHour ? { nominalUnitsPerHour: row.nominalUnitsPerHour } : {}), ...(row.planningEfficiencyPercent ? { planningEfficiencyPercent: row.planningEfficiencyPercent } : {}) };
        if (matches[0]) await tx.manufacturingResource.update({ where: { id: matches[0].id }, data });
        else await tx.manufacturingResource.create({ data: { organisationId: input.organisationId, workCentreId: centre.id, ...data } });
      }
    }
  }
}
export async function runConnectionImport(input: SetupImportInput) {
  const moduleFor: Record<string, string> = { products: "products", "price-lists": "pricing", prices: "pricing", "customer-commercial": "pricing", warehouses: "stock", locations: "stock", employees: "people", "work-centres": "manufacturing", machines: "manufacturing", "sales-orders": "sales", "sales-quotes": "sales" };
  input = { ...input, requiredModule: moduleFor[input.entity] };
  const template = connectionTemplate(input.entity);
  if (!template || !input.rows.length || input.rows.length > 500) throw new Error("Choose a template and upload between 1 and 500 records.");
  const missing = missingColumns(input.rows, template.required);
  if (missing) throw new Error(missing);
  for (const [index, row] of input.rows.entries()) {
    const blank = template.required.filter(key => !row[key]);
    if (blank.length) throw new Error(rowIssue(index, `complete required fields: ${blank.join(", ")}.`));
    const unknown = Object.keys(row).filter(key => !template.columns.includes(key));
    if (unknown.length) throw new Error(`Unknown columns: ${unknown.join(", ")}. Download the current template.`);
  }
  if (!["work-centres", "machines", "sales-orders", "sales-quotes"].includes(input.entity)) return runSetupImport(input);
  if (!input.entity.startsWith("sales-")) {
    const duplicate = duplicateKeyIssue(input.rows, row => input.entity === "machines" ? `${row.workCentreCode}|${row.name}` : row.code);
    if (duplicate) throw new Error(duplicate);
  }
  return db.$transaction(async tx => {
    const company = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM organisations WHERE id = ${input.organisationId} AND kind = 'CUSTOMER' AND "archivedAt" IS NULL FOR UPDATE`;
    if (!company.length) throw new Error("Choose an available customer company.");
    if (input.requiredModule && !await tx.moduleState.findFirst({ where: { organisationId: input.organisationId, moduleId: input.requiredModule, enabled: true, entitled: true } })) throw new Error(`Enable ${input.requiredModule} for this company in Atlas Admin before importing.`);
    if (input.applying && input.importKey && await tx.auditEntry.findFirst({ where: { organisationId: input.organisationId, entityType: "Import", entityId: input.importKey } })) throw new Error("This exact file was already attached to this company. Check import history.");
    const preview = input.entity.startsWith("sales-") ? await importSalesDrafts(tx, input) : (await manufacturing(tx, input), input.rows.slice(0, 10));
    if (input.applying) await tx.auditEntry.create({ data: { organisationId: input.organisationId, actorUserId: input.actorUserId, action: `import.${input.entity}`, entityType: "Import", entityId: input.importKey ?? crypto.randomUUID(), after: { rows: input.rows.length, fileName: input.fileName.slice(0, 120) } } });
    return { preview };
  }, { isolationLevel: "Serializable", timeout: 60_000 });
}
