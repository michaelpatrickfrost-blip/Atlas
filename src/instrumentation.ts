/** Next.js server start hook: wires the event→automation sink and starts the background tick.
 *  Node runtime only; skipped for the edge runtime and for the desktop package (ATLAS_RUNTIME=desktop). */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.ATLAS_RUNTIME === "desktop") return;
  const { installEventSink } = await import("@/core/events/sink");
  installEventSink();
  const { startTick } = await import("@/core/scheduler/tick");
  startTick();
}
