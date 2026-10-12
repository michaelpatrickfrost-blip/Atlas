import { MERGE_FIELDS } from "./types";

export const templateDetailLabels: Record<typeof MERGE_FIELDS[number], string> = {
  "company.name": "Your company name", "customer.name": "Customer name", "customer.code": "Customer number", "customer.address": "Customer address",
  "contact.name": "Contact name", "contact.email": "Contact email address", "record.name": "Record name", "record.reference": "Record number",
  "record.value": "Record value", "record.currency": "Record currency", "record.date": "Record date", "date.today": "Today's date",
};
export function templateDetailLabel(key: string) { return templateDetailLabels[key as typeof MERGE_FIELDS[number]] ?? key.replace(/^custom\./, "").replaceAll("_", " ").replace(/^./, c => c.toUpperCase()); }
export type TemplateTextPiece = { kind: "text"; value: string } | { kind: "detail"; value: string; key: string };
/** Exact original token spelling is retained; the UI exposes a friendly name. */
export function templateTextPieces(text: string): TemplateTextPiece[] {
  const pieces: TemplateTextPiece[] = []; let cursor = 0;
  for (const match of text.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)) {
    pieces.push({ kind: "text", value: text.slice(cursor, match.index) }, { kind: "detail", value: match[0], key: match[1] });
    cursor = match.index + match[0].length;
  }
  pieces.push({ kind: "text", value: text.slice(cursor) }); return pieces;
}
export function documentDetailKey(label: string): string {
  const key = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (!/^[a-z][a-z0-9_]{0,49}$/.test(key)) throw new Error("Start the detail name with a letter and keep it under 50 characters.");
  return `custom.${key}`;
}
export function templateTableRows(text: string): string[][] { return text.split("\n").map(row => row.split("|")); }
export function templateTableText(rows: string[][]): string { return rows.map(row => row.join("|")).join("\n"); }
