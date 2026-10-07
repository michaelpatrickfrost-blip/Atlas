import { randomUUID, createHash } from "node:crypto";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
const LIMIT = 8 * 1024 * 1024;
function root() {
  const value = process.env.ATLAS_SERVICE_FILE_ROOT;
  if (!value || !path.isAbsolute(value) || process.env.ATLAS_RUNTIME === "desktop") throw new Error("Server attachment storage is not configured.");
  return value;
}
function filePath(key: string) {
  if (!/^[a-f0-9-]{36}$/.test(key)) throw new Error("Invalid attachment reference.");
  return path.join(root(), key);
}
export async function saveServiceFile(file: File) {
  if (!file.size || file.size > LIMIT) throw new Error("Choose a file up to 8 MB.");
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = buffer.subarray(0, 5).toString() === "%PDF-" ? "application/pdf" : buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "image/png" : buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255 ? "image/jpeg" : null;
  if (!mime) throw new Error("Use a PDF, PNG or JPEG file.");
  const storageKey = randomUUID();
  await mkdir(root(), { recursive: true, mode: 0o700 });
  await writeFile(filePath(storageKey), buffer, { flag: "wx", mode: 0o600 });
  return { storageKey, name: path.basename(file.name).slice(0, 200), mime, size: buffer.length, sha256: createHash("sha256").update(buffer).digest("hex") };
}
export const readServiceFile = (key: string) => readFile(filePath(key));
export const removeServiceFile = (key: string) => unlink(filePath(key));
