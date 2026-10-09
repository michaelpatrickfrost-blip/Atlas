import type { Session } from "@/core/auth/session";
import { enabledModulesForSession, canOpenModule } from "@/core/modules/runtime";
import { getModule } from "@/core/modules/registry";
import { db } from "@/core/db/client";
import { consoleDestinations } from "../domain/console";
import { OPEN_PRODUCTION_ORDER_STATUSES } from "../domain/lifecycle";

export async function supplyNavigation(session: Session) {
  const enabled = await enabledModulesForSession(session);
  const destinations = consoleDestinations(session, enabled);
  return { enabled, destinations, navigation: [{ label: "Console", href: "/manufacturing" }, { label: "How-to library", href: "/manufacturing/help" }, ...destinations.map((item) => ({ label: item.label, href: item.href, group: item.stage }))] };
}
export async function canOpenSupplyConsole(session: Session) {
  const manifest = getModule("manufacturing");
  return !!manifest && canOpenModule(session, manifest) && (await enabledModulesForSession(session)).has(manifest.id);
}
export async function readSupplyConsole(session: Session) {
  if (!await canOpenSupplyConsole(session)) throw new Error("Manufacturing & Supply is not available to this profile.");
  const { enabled, destinations } = await supplyNavigation(session);
  const organisationId = session.organisationId;
  const [production, run] = await Promise.all([
    session.capabilities.has("manufacturing.order.read") ? Promise.all([
      db.manufacturingOrder.count({ where: { organisationId, status: { in: OPEN_PRODUCTION_ORDER_STATUSES } } }),
      db.manufacturingOrder.count({ where: { organisationId, status: { in: OPEN_PRODUCTION_ORDER_STATUSES }, requiredDate: { lt: new Date() } } }),
      db.manufacturingOrder.count({ where: { organisationId, status: { in: OPEN_PRODUCTION_ORDER_STATUSES }, workOrders: { some: { organisationId, status: "BLOCKED" } } } }),
    ]) : null,
    session.capabilities.has("manufacturing.plan.read") ? db.manufacturingPlanningRun.findFirst({ where: { organisationId, finishedAt: { not: null } }, orderBy: { startedAt: "desc" }, select: { id: true, startedAt: true, productCount: true, warnings: true } }) : null,
  ]);
  const pending = run ? await db.manufacturingSupplySuggestion.groupBy({ by: ["kind"], where: { organisationId, runId: run.id, status: "PENDING" }, _count: true }) : [];
  return { enabled, destinations, production, run, pending };
}
