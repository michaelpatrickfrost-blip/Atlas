/** Wires the durable event log to Automations. Imported once from instrumentation.ts. */
import { registerEventSink } from "./bus";

export function installEventSink() {
  registerEventSink(async (eventId: string) => {
    const { dispatchEvent } = await import("@/modules/automations/engine/run");
    await dispatchEvent(eventId);
  });
}
