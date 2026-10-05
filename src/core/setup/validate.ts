import { SETUP_CATALOGUE, setupTemplate } from "./catalogue";

export function rowIssue(index: number, message: string) {
  return `Row ${index + 2}: ${message}`;
}

export function missingColumns(rows: Record<string, string>[], required: string[]) {
  const headers = new Set(Object.keys(rows[0] ?? {}));
  const missing = required.filter((column) => !headers.has(column));
  return missing.length ? `Add these columns to the header row: ${missing.join(", ")}.` : null;
}

export function duplicateKeyIssue(rows: Record<string, string>[], keyFor: (row: Record<string, string>) => string) {
  const seen = new Set<string>();
  for (const [index, row] of rows.entries()) {
    const key = keyFor(row);
    if (!key) return rowIssue(index, "a record code is required.");
    if (seen.has(key)) return rowIssue(index, `duplicate record ${key}.`);
    seen.add(key);
  }
  return null;
}

/** Parent codes may already exist. A loop inside the file is rejected. Existing records are not re-parented. */
export function parentLoopIssue(rows: Array<{ code: string; parent: string }>, existing: Set<string>, indexFor: Map<string, number>) {
  const parents = new Map(rows.map((row) => [row.code, row.parent]));
  for (const row of rows) {
    const seen = new Set<string>([row.code]);
    let parent = row.parent;
    while (parent) {
      if (seen.has(parent)) return rowIssue(indexFor.get(row.code) ?? 0, `circular link involving ${row.code}.`);
      if (!parents.has(parent) && !existing.has(parent)) return rowIssue(indexFor.get(row.code) ?? 0, `parent ${parent} is missing. Import it first or include it in this file.`);
      seen.add(parent);
      parent = parents.get(parent) ?? "";
    }
  }
  return null;
}

export function customerImportIssue(rows: Record<string, string>[], existingCodes: Set<string>) {
  const template = setupTemplate("customers");
  return missingColumns(rows, template?.required ?? [])
    ?? duplicateKeyIssue(rows, (row) => row.customerCode)
    ?? rows.reduce<string | null>((found, row, index) => {
      if (found) return found;
      if (existingCodes.has(row.customerCode)) return rowIssue(index, `customer ${row.customerCode} already exists. Customer import creates records and does not overwrite them.`);
      if (!row.name || row.name.length > 200) return rowIssue(index, "enter a customer name up to 200 characters.");
      if (row.customerCode.length > 64) return rowIssue(index, "customer code must be 64 characters or fewer.");
      if (!["GROUP", "CUSTOMER", "BRANCH", "DELIVERY"].includes(row.hierarchyRole || "CUSTOMER")) return rowIssue(index, "hierarchy level must be GROUP, CUSTOMER, BRANCH or DELIVERY.");
      if (!/^[A-Z]{3}$/.test(row.currency || "GBP")) return rowIssue(index, "currency must be a 3-letter code such as GBP.");
      if (row.status && !["PROSPECT", "ACTIVE", "ON_HOLD", "INACTIVE", "CLOSED"].includes(row.status)) return rowIssue(index, "status must be ACTIVE, PROSPECT, ON_HOLD, INACTIVE or CLOSED.");
      return null;
    }, null)
    ?? parentLoopIssue(rows.map((row) => ({ code: row.customerCode, parent: row.parentCustomerCode ?? "" })), existingCodes, new Map(rows.map((row, index) => [row.customerCode, index])));
}

export function catalogueCoversRequiredColumns() {
  return SETUP_CATALOGUE.every((template) => template.required.every((column) => template.columns.includes(column)) && template.columns.length === template.example.length && new Set(template.columns).size === template.columns.length);
}
