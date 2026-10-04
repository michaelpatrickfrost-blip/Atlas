import { db } from "@/core/db/client";
import { timeSeries } from "@/core/analytics/buckets";
import { serviceCaseScope } from "@/core/permissions/service-access";
import type { AnalyticsProvider } from "@/core/analytics/types";
import { assertCapability } from "@/core/permissions/check";

const read = "service.case.read";
export const serviceAnalytics: AnalyticsProvider = [
  { id: "service.case.count", name: "Cases opened", subject: "Customer Service", definition: "Cases created during the selected period, grouped by type. Tenant and case security apply. Counts cases, not handling time.", grain: "One customer case", capability: read, href: "/service/cases", snapshot: false, query: async (session, since) => { assertCapability(session, read); const rows = await db.serviceCase.groupBy({ by: ["type"], where: { AND: [serviceCaseScope(session), ...(since ? [{ createdAt: { gte: since } }] : [])] }, _count: { _all: true } }); return rows.map((row) => ({ label: row.type.replaceAll("_", " "), value: row._count._all })); } },
  { id: "service.case.status", name: "Case status", subject: "Customer Service", definition: "Current cases by status, within the cases this profile can see. Counts cases. Resolution notes are excluded.", grain: "One customer case", capability: read, href: "/service/cases", snapshot: true, query: async (session) => { assertCapability(session, read); const rows = await db.serviceCase.groupBy({ by: ["status"], where: serviceCaseScope(session), _count: { _all: true } }); return rows.map((row) => ({ label: row.status.replaceAll("_", " "), value: row._count._all })); } },
  { id: "service.case.trend", name: "Cases over time", subject: "Customer Service", definition: "Cases created in the selected period, by week or by month on longer ranges. Latest 8,000 visible cases. Counts cases.", grain: "One customer case", capability: read, href: "/service/cases", snapshot: false, shape: "trend", query: async (session, since) => { assertCapability(session, read); const rows = await db.serviceCase.findMany({ where: { AND: [serviceCaseScope(session), ...(since ? [{ createdAt: { gte: since } }] : [])] }, select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 8000 }); return timeSeries(rows.map((row) => row.createdAt), since); } },
];
