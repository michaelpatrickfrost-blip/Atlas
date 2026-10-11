import type { Session } from "@/core/auth/session";

export type DatedSupply = { productId: string; quantity: number; availableDate: Date; sourceId: string };
export type IncomingSupply = { rows: DatedSupply[]; warnings: string[] };
export type IncomingSupplyProvider = (session: Session) => Promise<IncomingSupply>;

/** Finance owns purchasing evidence and its document access boundaries. */
export async function incomingPurchaseSupply(session: Session): Promise<IncomingSupply> {
  const { getEnabledModuleIds } = await import("@/core/modules/runtime");
  const { getModule } = await import("@/core/modules/registry");
  if (!(await getEnabledModuleIds(session.organisationId)).has("finance")) return { rows: [], warnings: [] };
  if (!session.capabilities.has("finance.purchase.read")) return { rows: [], warnings: ["Incoming purchase supply is excluded because your profile cannot read Purchasing. Ask an authorised planner to run the combined plan."] };
  return await getModule("finance")?.incomingSupplyProvider?.(session) ?? { rows: [], warnings: [] };
}
