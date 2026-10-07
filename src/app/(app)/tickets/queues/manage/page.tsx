import { redirect } from "next/navigation";
/** Preserve the queue-setup bookmark; queue administration uses the shared queue workspace. */
export default function LegacyQueueSetup() { redirect("/tickets/queues"); }
