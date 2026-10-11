import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { enabledModulesForSession } from "@/core/modules/runtime";
import { db } from "@/core/db/client";
import { members } from "@/core/shared/operational-forms";
import type { Prisma } from "@/generated/prisma/client";

export async function maintenanceRegister(query: {
  view?: string;
  q?: string;
  status?: string;
  mine?: string;
  page?: string;
  kind?: string;
}) {
  const s = await requireSession();
  assertCapability(s, "maintenance.work.read");
  await assertModuleEnabled(s, "maintenance");
  const enabled = await enabledModulesForSession(s),
    vehicleAccess = can(s, "fleet.vehicle.read") && enabled.has("fleet");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const search = (query.q ?? "").trim().slice(0, 100),
    page = Math.min(100000, Math.max(0, Math.trunc(Number(query.page) || 0)));
  const status = [
    "all",
    "OPEN",
    "IN_PROGRESS",
    "WAITING_PARTS",
    "COMPLETED",
    "CANCELLED",
    "overdue",
  ].includes(query.status ?? "")
    ? query.status!
    : "open";
  const base: Prisma.MaintenanceWorkOrderWhereInput = {
    organisationId: s.organisationId,
    ...(!vehicleAccess ? { vehicleId: null } : {}),
  };
  const open: Prisma.MaintenanceWorkOrderWhereInput = {
    ...base,
    status: { notIn: ["COMPLETED", "CANCELLED"] },
  };
  const workWhere: Prisma.MaintenanceWorkOrderWhereInput = {
    AND: [
      base,
      status === "open"
        ? { status: { notIn: ["COMPLETED", "CANCELLED"] } }
        : status === "overdue"
          ? {
              status: { notIn: ["COMPLETED", "CANCELLED"] },
              dueAt: { lt: today },
            }
          : status === "all"
            ? {}
            : { status },
      query.mine === "1" ? { assigneeUserId: s.userId } : {},
      ["BREAKDOWN", "PREVENTIVE", "INSPECTION", "REPAIR"].includes(
        query.kind ?? "",
      )
        ? { kind: query.kind }
        : {},
      search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              {
                equipment: { name: { contains: search, mode: "insensitive" } },
              },
              {
                equipment: { code: { contains: search, mode: "insensitive" } },
              },
              ...(vehicleAccess
                ? [
                    {
                      vehicle: {
                        registration: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                  ]
                : []),
            ],
          }
        : {},
    ],
  };
  const equipmentWhere: Prisma.MaintenanceEquipmentWhereInput = {
    organisationId: s.organisationId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [
    equipment,
    vehicles,
    people,
    work,
    count,
    openCount,
    urgentCount,
    overdueCount,
    downCount,
    dueCount,
    dueEquipment,
  ] = await Promise.all([
    db.maintenanceEquipment.findMany({
      where:
        query.view === "equipment"
          ? equipmentWhere
          : { organisationId: s.organisationId, status: { not: "RETIRED" } },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: query.view === "equipment" ? 50 : 201,
      ...(query.view === "equipment" ? { skip: page * 50 } : {}),
    }),
    vehicleAccess
      ? db.fleetVehicle.findMany({
          where: {
            organisationId: s.organisationId,
            status: { not: "RETIRED" },
          },
          select: { id: true, name: true, registration: true },
          orderBy: { registration: "asc" },
          take: 201,
        })
      : [],
    members(s),
    query.view === "equipment"
      ? []
      : db.maintenanceWorkOrder.findMany({
          where: workWhere,
          orderBy: [
            { dueAt: { sort: "asc", nulls: "last" } },
            { createdAt: "desc" },
            { id: "asc" },
          ],
          include: {
            equipment: { select: { name: true, code: true } },
            ...(vehicleAccess
              ? { vehicle: { select: { name: true, registration: true } } }
              : {}),
          },
          take: 50,
          skip: page * 50,
        }),
    query.view === "equipment"
      ? db.maintenanceEquipment.count({ where: equipmentWhere })
      : db.maintenanceWorkOrder.count({ where: workWhere }),
    db.maintenanceWorkOrder.count({ where: open }),
    db.maintenanceWorkOrder.count({
      where: { ...open, priority: { in: ["HIGH", "URGENT"] } },
    }),
    db.maintenanceWorkOrder.count({ where: { ...open, dueAt: { lt: today } } }),
    db.maintenanceEquipment.count({
      where: { organisationId: s.organisationId, status: "OUT_OF_SERVICE" },
    }),
    db.maintenanceEquipment.count({
      where: {
        organisationId: s.organisationId,
        status: { not: "RETIRED" },
        nextServiceAt: { lte: today },
      },
    }),
    db.maintenanceEquipment.findMany({
      where: {
        organisationId: s.organisationId,
        status: { not: "RETIRED" },
        nextServiceAt: { lte: today },
      },
      orderBy: [{ nextServiceAt: "asc" }, { id: "asc" }],
      take: 6,
    }),
  ]);
  return {
    s,
    equipment,
    vehicles,
    people,
    work,
    count,
    page,
    search,
    status,
    stats: { openCount, urgentCount, overdueCount, downCount, dueCount },
    dueEquipment,
  };
}
export async function maintenanceWorkspace() {
  const s = await requireSession();
  assertCapability(s, "maintenance.work.read");
  await assertModuleEnabled(s, "maintenance");
  const enabled = await enabledModulesForSession(s),
    vehicleAccess = can(s, "fleet.vehicle.read") && enabled.has("fleet");
  const [equipment, vehicles, work, people] = await Promise.all([
    db.maintenanceEquipment.findMany({
      where: { organisationId: s.organisationId },
      orderBy: { name: "asc" },
      take: 201,
    }),
    vehicleAccess
      ? db.fleetVehicle.findMany({
          where: { organisationId: s.organisationId },
          select: { id: true, name: true, registration: true },
          take: 201,
        })
      : [],
    db.maintenanceWorkOrder.findMany({
      where: {
        organisationId: s.organisationId,
        ...(!vehicleAccess ? { vehicleId: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 201,
    }),
    members(s),
  ]);
  return { s, equipment, vehicles, work, people, enabled };
}
