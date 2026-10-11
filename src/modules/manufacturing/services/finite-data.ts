import type { Prisma } from "@/generated/prisma/client";
import type { FiniteResource } from "../domain/finite-scheduling";

export async function loadFiniteResources(tx: Prisma.TransactionClient, organisationId: string, excludeIds: string[] = []): Promise<FiniteResource[]> {
  const [machines, shifts, work, downtime] = await Promise.all([
    tx.manufacturingResource.findMany({ where: { organisationId, active: true, workCentre: { active: true, organisationId } }, orderBy: { id: "asc" }, take: 2001 }),
    tx.manufacturingShift.findMany({ where: { organisationId, active: true }, orderBy: { id: "asc" }, take: 10001 }),
    tx.manufacturingWorkOrder.findMany({ where: { organisationId, id: { notIn: excludeIds }, status: { not: "COMPLETE" }, scheduledStart: { not: null }, scheduledEnd: { not: null }, productionOrder: { status: { notIn: ["COMPLETE", "CLOSED"] } } }, select: { id: true, resourceId: true, workCentreId: true, scheduledStart: true, scheduledEnd: true }, orderBy: { id: "asc" }, take: 10001 }),
    tx.manufacturingDowntime.findMany({ where: { organisationId, active: true }, orderBy: { id: "asc" }, take: 10001 }),
  ]);
  if (machines.length > 2000 || [shifts, work, downtime].some((rows) => rows.length > 10000)) throw new Error("Plant scheduling exceeds its safe scope. Review the plant and open bookings before planning.");
  return machines.map((machine) => {
    const own = shifts.filter((s) => s.resourceId === machine.id);
    const applicable = own.length ? own : shifts.filter((s) => s.workCentreId === machine.workCentreId && !s.resourceId);
    return { id: machine.id, name: machine.name, workCentreId: machine.workCentreId, active: machine.active, calendarMode: machine.calendarMode, timezone: machine.timezone,
      shifts: applicable.map((s) => ({ daysOfWeek: s.daysOfWeek, startMinute: s.startMinute, endMinute: s.endMinute, crewCount: s.crewCount })),
      bookings: work.filter((w) => w.resourceId === machine.id || !w.resourceId && w.workCentreId === machine.workCentreId).map((w) => ({ id: w.id, start: w.scheduledStart!, end: w.scheduledEnd! })),
      downtime: downtime.filter((d) => d.resourceId === machine.id).map((d) => ({ id: d.id, start: d.startsAt, end: d.endsAt })),
    };
  });
}
