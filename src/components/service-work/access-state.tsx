import Link from "next/link";
import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";

/** Expected restrictions are rendered on the server before work/queue data is read.
 * Unexpected failures still propagate to the error boundary. Actions retain their guards. */
export async function serviceWorkRestriction(session: Session, kind: string, capabilities = [kind === "TICKET" ? "tickets.ticket.read" : "service.ticket.read"]) {
  const forbidden = capabilities.some(capability => !session.capabilities.has(capability));
  if (!forbidden && await db.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: kind === "TICKET" ? "tickets" : "service", enabled: true, entitled: true } })) return null;
  return <section data-guardian-state="access-restricted" className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
    <h2 className="text-lg font-semibold">{forbidden ? "You don't have permission to view this." : "This app is not enabled for your company."}</h2>
    <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">{forbidden ? "Ask your workspace administrator for access." : "Ask your workspace administrator to enable this app in Manage apps."}</p>
    <Link href="/home" className="mt-5 inline-flex rounded-xl border px-5 py-3 text-sm">Go to Home</Link>
  </section>;
}
