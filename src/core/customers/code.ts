import { db } from "@/core/db/client";

/** Generates the next sequential customer code for an org, e.g. "C000184".
 *  Best-effort sequential (count-based); callers retry on the unique
 *  constraint if two creates race — acceptable at this scale, documented as a
 *  known limitation for high-concurrency deployments. */
export async function nextCustomerCode(organisationId: string): Promise<string> {
  const count = await db.party.count({ where: { organisationId } });
  return `C${String(count + 1).padStart(6, "0")}`;
}
