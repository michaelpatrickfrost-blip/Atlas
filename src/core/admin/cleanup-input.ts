export class CleanupValidationError extends Error {}
export type CleanupSelection = { id: string; name: string; updatedAt: string };
export const cleanupConfirmation = (count: number) => `DELETE ${count} TEST ${count === 1 ? "COMPANY" : "COMPANIES"}`;
export function readCleanupSelection(raw: string): CleanupSelection[] {
  if (raw.length > 250_000) throw new CleanupValidationError("Select up to 1,000 test companies per sweep.");
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new CleanupValidationError("Select the companies to delete again."); }
  if (!Array.isArray(parsed) || !parsed.length || parsed.length > 1000) throw new CleanupValidationError("Select between 1 and 1,000 test companies.");
  const selected: CleanupSelection[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object" || typeof item.id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(item.id) || typeof item.name !== "string" || !item.name || item.name.length > 150 || typeof item.updatedAt !== "string" || !Number.isFinite(Date.parse(item.updatedAt))) throw new CleanupValidationError("The company list changed. Refresh the cleanup page.");
    selected.push({ id: item.id, name: item.name, updatedAt: item.updatedAt });
  }
  if (new Set(selected.map(item => item.id)).size !== selected.length) throw new CleanupValidationError("Select each company only once.");
  return selected;
}
