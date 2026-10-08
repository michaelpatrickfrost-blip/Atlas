import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function importFingerprint(company: string, entity: string, content: string) {
  return createHash("sha256").update(JSON.stringify([company, entity, content])).digest("hex");
}
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("Connections review signing is unavailable: configure SESSION_SECRET.");
  return value;
}
export function signReview(fingerprint: string, userId: string, now = Date.now()) {
  const expires = String(now + 15 * 60_000);
  const signature = createHmac("sha256", secret()).update(JSON.stringify([fingerprint, userId, expires])).digest("hex");
  return `${expires}.${signature}`;
}
export function verifyReview(token: string, fingerprint: string, userId: string, now = Date.now()) {
  const [expires, signature] = token.split(".");
  if (!/^\d+$/.test(expires ?? "") || !/^[a-f0-9]{64}$/.test(signature ?? "") || Number(expires) < now || Number(expires) > now + 15 * 60_000) throw new Error("Validate this file again; its review has expired or changed.");
  const expected = createHmac("sha256", secret()).update(JSON.stringify([fingerprint, userId, expires])).digest("hex");
  if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"))) throw new Error("Validate this file for the selected company again.");
}
