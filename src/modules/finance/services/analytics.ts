import { financeGoalMetrics } from "./goal-metrics";
import { db } from "@/core/db/client";
import type { AnalyticsProvider } from "@/core/analytics/types";
import { assertCapability } from "@/core/permissions/check";

const read = "finance.overview.read";
export const financeAnalytics: AnalyticsProvider = [...financeGoalMetrics,
  { id: "finance.documents.status", name: "Finance documents", subject: "Finance", definition: "Current finance documents by status. Counts documents. Amounts are not added, including across currencies.", grain: "One finance document", capability: read, href: "/finance", snapshot: true, query: async (session) => { assertCapability(session, read); const rows = await db.financeDocument.groupBy({ by: ["status"], where: { organisationId: session.organisationId }, _count: { _all: true } }); return rows.map((row) => ({ label: row.status.replaceAll("_", " "), value: row._count._all })); } },
  { id: "finance.documents.kind", name: "Document types", subject: "Finance", definition: "Current finance documents by kind. Counts documents, not monetary value.", grain: "One finance document", capability: read, href: "/finance", snapshot: true, query: async (session) => { assertCapability(session, read); const rows = await db.financeDocument.groupBy({ by: ["kind"], where: { organisationId: session.organisationId }, _count: { _all: true } }); return rows.map((row) => ({ label: row.kind.replaceAll("_", " "), value: row._count._all })); } },
];
