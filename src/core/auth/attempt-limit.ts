import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { db } from "@/core/db/client";

export const AUTH_LIMIT_ERROR = "Too many attempts. Wait 15 minutes before trying again.";

/** Caddy overwrites X-Forwarded-For; use its final hop, never a submitted form field. */
export function authenticationAttemptKeys(headers: Headers, identifier: string, purpose: "login" | "recovery") {
  const candidate = headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "";
  const address = isIP(candidate) ? candidate : "unavailable";
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Authentication is unavailable.");
  const hash = (value: string) => createHmac("sha256", secret).update(value).digest("hex");
  return { ipKey: hash(`ip:${address}`), identityKey: hash(`${purpose}:${address}:${identifier}`) };
}

/** Atomic shared counters survive restarts; no email, IP or credential is stored. */
export async function allowAuthenticationAttempt(headers: Headers, identifier: string, purpose: "login" | "recovery") {
  const { ipKey, identityKey } = authenticationAttemptKeys(headers, identifier, purpose);
  const rows = await db.$queryRaw<{ key: string; attempts: number }[]>`
    INSERT INTO "authentication_rate_limits" ("key", "attempts", "expiresAt")
    VALUES (${ipKey}, 1, NOW() + INTERVAL '15 minutes'),
           (${identityKey}, 1, NOW() + INTERVAL '15 minutes')
    ON CONFLICT ("key") DO UPDATE SET
      "attempts" = CASE WHEN "authentication_rate_limits"."expiresAt" <= NOW()
        THEN 1 ELSE LEAST("authentication_rate_limits"."attempts" + 1, 61) END,
      "expiresAt" = CASE WHEN "authentication_rate_limits"."expiresAt" <= NOW()
        THEN NOW() + INTERVAL '15 minutes' ELSE "authentication_rate_limits"."expiresAt" END
    RETURNING "key", "attempts"
  `;
  // Remove only expired disposable security counters, never business records.
  await db.$executeRaw`DELETE FROM "authentication_rate_limits" WHERE "expiresAt" < NOW() - INTERVAL '1 day'`;
  return rows.length === 2 && rows.every(row => row.attempts <= (row.key === ipKey ? 60 : 10));
}
