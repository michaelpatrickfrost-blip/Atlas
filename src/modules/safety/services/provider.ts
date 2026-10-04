import { db } from "@/core/db/client";
import type { SafetyAuthorisation, SafetyAvailability, SafetyDeliveryRisk, SafetyProvider, SafetySubstanceGate } from "@/core/safety/types";
import { authoriseCompetence } from "../domain/work";

async function enabled(organisationId: string) {
  const state = await db.moduleState.findFirst({ where: { organisationId, moduleId: "safety", enabled: true, entitled: true } });
  return Boolean(state);
}

async function activeHold(organisationId: string, targetType: string, targetId: string): Promise<SafetyAvailability> {
  const hold = await db.safetyHold.findFirst({ where: { organisationId, targetType, targetId, status: "ACTIVE" }, orderBy: { placedAt: "desc" } });
  if (!hold) {
    const override = await db.safetyHold.findFirst({ where: { organisationId, targetType, targetId, status: "OVERRIDDEN", overrideExpiresAt: { gt: new Date() } } });
    if (override) return { available: true, status: "RESTRICTED", reason: `Override in force until ${override.overrideExpiresAt?.toLocaleString("en-GB")}. ${override.overrideReason ?? ""}`.trim(), holdId: override.id, label: override.targetLabel };
    return { available: true, status: "AVAILABLE" };
  }
  return { available: false, status: "DO_NOT_USE", reason: `${hold.targetLabel} is on safety hold. ${hold.reason}`, holdId: hold.id, label: hold.targetLabel };
}

export const safetyProvider: SafetyProvider = {
  async activeHolds(organisationId) {
    if (!await enabled(organisationId)) return [];
    const holds = await db.safetyHold.findMany({ where: { organisationId, status: "ACTIVE" }, orderBy: { placedAt: "desc" }, take: 30 });
    return holds.map((hold) => ({ id: hold.id, label: hold.targetLabel, reason: hold.reason, href: `/safety/control/holds/${hold.id}`, targetType: hold.targetType, targetId: hold.targetId }));
  },
  async resourceStatus(organisationId, resourceId) {
    if (!await enabled(organisationId)) return { available: true, status: "AVAILABLE" };
    return activeHold(organisationId, "MANUFACTURING_RESOURCE", resourceId);
  },
  async assetStatus(organisationId, assetRef) {
    if (!await enabled(organisationId)) return { available: true, status: "AVAILABLE" };
    const byId = await activeHold(organisationId, "LOGISTICS_EQUIPMENT", assetRef);
    if (!byId.available) return byId;
    const byAsset = await activeHold(organisationId, "ASSET", assetRef);
    return byAsset;
  },
  async authoriseOperator(organisationId, userId, competenceKey): Promise<SafetyAuthorisation> {
    if (!competenceKey || !await enabled(organisationId)) return { authorised: true };
    const employee = await db.employee.findFirst({ where: { organisationId, userId }, select: { id: true } });
    const grants = employee ? await db.safetyCompetence.findMany({ where: { organisationId, employeeId: employee.id, key: competenceKey } }) : [];
    return authoriseCompetence(competenceKey, grants.map((grant) => ({ key: grant.key, expiresAt: grant.expiresAt })), new Date());
  },
  async deliveryRisks(organisationId, salesOrderId): Promise<SafetyDeliveryRisk[]> {
    if (!await enabled(organisationId)) return [];
    const lines = await db.salesOrderLine.findMany({ where: { orderId: salesOrderId, order: { organisationId } }, select: { id: true } });
    if (!lines.length) return [];
    const orders = await db.manufacturingOrder.findMany({
      where: { organisationId, sourceSalesOrderLineId: { in: lines.map((line) => line.id) }, status: { in: ["PLANNED", "READY", "RELEASED", "RUNNING"] } },
      include: { workOrders: true, product: { select: { name: true } } },
    });
    const resourceIds = orders.flatMap((order) => order.workOrders.map((work) => work.resourceId).filter((id): id is string => Boolean(id)));
    if (!resourceIds.length) return [];
    const holds = await db.safetyHold.findMany({ where: { organisationId, status: "ACTIVE", targetType: "MANUFACTURING_RESOURCE", targetId: { in: resourceIds } } });
    return holds.map((hold) => {
      const affected = orders.filter((order) => order.workOrders.some((work) => work.resourceId === hold.targetId));
      return { holdId: hold.id, href: `/safety/control/holds/${hold.id}`, summary: `${affected.map((order) => order.orderNumber).join(", ") || "Production"} for ${affected[0]?.product.name ?? "this order"} is blocked. ${hold.targetLabel}: ${hold.reason}` };
    });
  },
  async substanceStatus(organisationId, substanceId): Promise<SafetySubstanceGate> {
    if (!await enabled(organisationId)) return { approved: true };
    const substance = await db.safetySubstance.findFirst({ where: { id: substanceId, organisationId } });
    if (!substance) return { approved: false, reason: "This substance is not on the safety register." };
    if (substance.status !== "APPROVED") return { approved: false, reason: `${substance.tradeName} is ${substance.status.toLowerCase().replaceAll("_", " ")}. It is not approved for use.` };
    return { approved: true };
  },
};
