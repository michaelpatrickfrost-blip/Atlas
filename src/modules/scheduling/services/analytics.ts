import { db } from "@/core/db/client";
import type { AnalyticsProvider } from "@/core/analytics/types";
import { assertCapability } from "@/core/permissions/check";

const read = "scheduling.read";
export const schedulingAnalytics: AnalyticsProvider = [
  { id: "scheduling.shifts", name: "Shifts", subject: "Scheduling", definition: "Rota shifts in the selected period by status. Counts shifts. Notes and personal details are excluded.", grain: "One rota shift", capability: read, href: "/scheduling", snapshot: false, query: async (session, since) => { assertCapability(session, read); const rows = await db.rotaShift.groupBy({ by: ["status"], where: { organisationId: session.organisationId, ...(since ? { startsAt: { gte: since } } : {}) }, _count: { _all: true } }); return rows.map((row) => ({ label: String(row.status).replaceAll("_", " "), value: row._count._all })); } },
  { id: "scheduling.timesheets", name: "Timesheets", subject: "Scheduling", definition: "Timesheets in the selected period by status. Counts sheets, not pay.", grain: "One timesheet", capability: read, href: "/people/timesheets", snapshot: false, query: async (session, since) => { assertCapability(session, read); const rows = await db.timesheet.groupBy({ by: ["status"], where: { organisationId: session.organisationId, ...(since ? { weekStart: { gte: since } } : {}) }, _count: { _all: true } }); return rows.map((row) => ({ label: row.status.replaceAll("_", " "), value: row._count._all })); } },
];
