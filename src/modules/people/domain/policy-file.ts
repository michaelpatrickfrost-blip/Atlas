import { createHash } from "node:crypto";

const MAX_PDF = 3 * 1024 * 1024;

export async function readPolicyPdf(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_PDF) throw new Error("Choose a PDF up to 3 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString() !== "%PDF-") throw new Error("The file must be a PDF.");
  const fileName = file.name.replace(/[\u0000-\u001f/\\]/g, "_").slice(0, 180);
  if (!fileName.toLowerCase().endsWith(".pdf")) throw new Error("The file name must end in .pdf.");
  return { bytes, fileName, checksum: createHash("sha256").update(bytes).digest("hex") };
}
