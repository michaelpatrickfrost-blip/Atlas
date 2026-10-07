import { getSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { safePath } from "@/core/guardian/report";
import { recordFinding } from "@/core/guardian/store";
import { z } from "zod";

const event = z.object({ kind: z.enum(["BROWSER_ERROR", "UNHANDLED_REJECTION", "EMPTY_LINK", "PAGE_ERROR"]), path: z.string().max(240), code: z.string().regex(/^[A-Za-z0-9_.:-]{1,80}$/) });
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (request.headers.get("origin") !== new URL(request.url).origin) return new Response(null, { status: 403, headers });
  const session = await getSession();
  if (!session) return new Response(null, { status: 401, headers });
  const text = await request.text();
  if (text.length > 1024) return new Response(null, { status: 413, headers });
  let input;
  try { input = event.parse(JSON.parse(text)); } catch { return new Response(null, { status: 400, headers }); }
  // Atomic DB window, no unbounded in-memory map. Telemetry cannot expose any existing report.
  const rows = await db.$queryRawUnsafe<Array<{ count: number }>>(`INSERT INTO guardian_rate_limits (id, count, "expiresAt") VALUES ($1, 1, now() + interval '1 minute') ON CONFLICT (id) DO UPDATE SET count = CASE WHEN guardian_rate_limits."expiresAt" < now() THEN 1 ELSE guardian_rate_limits.count + 1 END, "expiresAt" = CASE WHEN guardian_rate_limits."expiresAt" < now() THEN now() + interval '1 minute' ELSE guardian_rate_limits."expiresAt" END RETURNING count`, session.userId);
  if (rows[0].count > 10) return new Response(null, { status: 429, headers });
  const path = safePath(input.path);
  await recordFinding({ key: `browser:${input.kind}:${path}:${input.code}`, title: `${input.kind === "EMPTY_LINK" ? "Navigation has no destination" : "Browser failure"}: ${path}`, kind: input.kind, severity: input.kind === "EMPTY_LINK" ? "MEDIUM" : "HIGH", route: path,
    expected: "The page renders and its controls complete with visible feedback.", actual: `Browser reported ${input.kind} (${input.code}); requires reproduction.`,
    steps: ["Sign in using an authorised test profile.", `Open ${path} and reproduce the failing interaction.`, "Inspect browser errors and the associated server request."], evidence: [`Client observation: ${input.code}. No page content, form values or customer identifiers collected.`] });
  return new Response(null, { status: 204, headers });
}
