/** Next.js server start hook: wires the event→automation sink and starts the background tick.
 *  Node runtime only; skipped for the edge runtime and for the desktop package (ATLAS_RUNTIME=desktop). */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.ATLAS_RUNTIME === "desktop") return;
  const { installEventSink } = await import("@/core/events/sink");
  installEventSink();
  const { startTick } = await import("@/core/scheduler/tick");
  startTick();
}


/** Capture render, route and action failures without request bodies, cookies or customer data. */
export const onRequestError: import("next").Instrumentation.onRequestError = async (error, _request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.ATLAS_RUNTIME === "desktop" || context.routePath.includes("guardian")) return;
  const message = error instanceof Error ? error.message : "";
  if (/^(FORBIDDEN|UNAUTHENTICATED|NEXT_REDIRECT|NEXT_NOT_FOUND)/.test(message)) return;
  try {
    const { recordFinding } = await import("@/core/guardian/store");
    const { safePath } = await import("@/core/guardian/report");
    const route = safePath(context.routePath.replace(/^\/app/, ""));
    const code = error && typeof error === "object" && "code" in error && /^[A-Z0-9_]{1,40}$/.test(String(error.code)) ? String(error.code) : "SERVER_ERROR";
    const digest = error && typeof error === "object" && "digest" in error && /^[a-zA-Z0-9_-]{1,80}$/.test(String(error.digest)) ? String(error.digest) : "unavailable";
    await recordFinding({ key: `server:${route}:${context.routeType}:${code}:${digest}`, title: `Server ${context.routeType} failed: ${route}`, kind: "SERVER_ERROR", severity: "HIGH", route, expected: "The page or action completes successfully.", actual: `${context.routeType} failed (${code}); server digest ${digest}.`, steps: ["Sign in with an authorised test profile.", `Open ${route} and reproduce the failing page/action.`, "Correlate the digest with server logs; inspect the original exception securely."], evidence: [`Route type: ${context.routeType}`, `Error code: ${code}`, `Digest: ${digest}`, "No headers, bodies, raw error messages or customer data collected."] });
  } catch { console.error("[guardian] Unable to persist server diagnostic"); }
};
