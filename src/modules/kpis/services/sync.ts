import { db } from "@/core/db/client";

type Objective = { goal?: string; measure?: string; support?: string; by?: string };

export async function syncPlanGoals(input: {
  organisationId: string;
  ownerUserId: string;
  planId: string;
  employeeId: string;
  personName: string;
  title: string;
  kind: string;
  support: string;
  startOn: Date;
  endOn: Date;
  reviewOn: Date;
  leadUserIds: string[];
  objectives: unknown;
}) {
  const rows = Array.isArray(input.objectives) ? input.objectives as Objective[] : [];
  const existing = await db.kpi.findMany({ where: { organisationId: input.organisationId, planId: input.planId }, select: { name: true } });
  const names = new Set(existing.map((goal) => goal.name));
  for (const row of rows) {
    const name = String(row?.goal ?? "").trim();
    if (!name || names.has(name)) continue;
    names.add(name);
    await db.kpi.create({
      data: {
        organisationId: input.organisationId,
        name,
        teamName: "Personal",
        ownerUserId: input.ownerUserId,
        unit: "done",
        direction: "AT_LEAST",
        target: 1,
        current: 0,
        startsAt: input.startOn,
        endsAt: input.endOn,
        notes: String(row.measure ?? "").trim() || null,
        reviewOn: input.reviewOn,
        scope: input.kind === "DEVELOPMENT" ? "DEVELOPMENT" : "PIP",
        visibility: "PRIVATE",
        employeeId: input.employeeId,
        planId: input.planId,
        personName: input.personName,
        planTitle: input.title,
        planKind: input.kind,
        support: String(row.support ?? input.support ?? ""),
        status: "ACTIVE",
        leadUserIds: input.leadUserIds,
      },
    });
  }
}
