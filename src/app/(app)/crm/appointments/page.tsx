import { randomUUID } from "node:crypto";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { ownerRestriction } from "@/modules/crm/services/visibility";
import {
  APPOINTMENT_TYPES,
  appointmentWeek,
  appointmentDay,
} from "@/modules/crm/domain/appointments";
import { AppointmentDiary } from "@/modules/crm/components/appointment-diary";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    week?: string;
    q?: string;
    state?: string;
    owner?: string;
    party?: string;
    focus?: string;
  }>;
}) {
  const session = await requireSession();
  assertCapability(session, "sales.opportunity.read");
  await assertModuleEnabled(session, "crm");
  const query = await searchParams,
    restriction = ownerRestriction(session);
  let week = appointmentWeek(query.week);
  if (query.focus && !query.week) {
    const focused = await db.salesActivity.findFirst({
      where: {
        id: query.focus,
        organisationId: session.organisationId,
        ...(restriction ? { ownerUserId: restriction } : {}),
        type: { in: [...APPOINTMENT_TYPES] },
      },
      select: { dueAt: true },
    });
    if (focused?.dueAt)
      week = appointmentWeek(appointmentDay(focused.dueAt.toISOString()));
  }
  const where = { organisationId: session.organisationId };
  const [activities, customers, prospects, deals, members] = await Promise.all([
    db.salesActivity.findMany({
      where: {
        ...where,
        type: { in: [...APPOINTMENT_TYPES] },
        dueAt: {
          gte: new Date(week.start.getTime() - 86400000),
          lt: new Date(week.end.getTime() + 86400000),
        },
        ...(restriction || query.owner
          ? { ownerUserId: restriction || query.owner }
          : {}),
        ...(query.party ? { partyId: query.party } : {}),
        ...(query.q
          ? {
              subject: { contains: query.q.slice(0, 200), mode: "insensitive" },
            }
          : {}),
        ...(query.state === "completed"
          ? { completedAt: { not: null }, cancelledAt: null }
          : query.state === "cancelled"
            ? { cancelledAt: { not: null } }
            : { completedAt: null, cancelledAt: null }),
      },
      include: {
        party: { select: { id: true, name: true, identityScrubbed: true } },
        prospect: {
          select: { id: true, companyName: true, ownerUserId: true },
        },
        opportunity: { select: { id: true, name: true, ownerUserId: true } },
      },
      orderBy: { dueAt: "asc" },
      take: 501,
    }),
    can(session, "customers.read")
      ? db.party.findMany({
          where: { ...where, identityScrubbed: false, archived: false },
          select: { id: true, name: true, customerCode: true },
          orderBy: { name: "asc" },
          take: 1000,
        })
      : [],
    can(session, "sales.prospect.read")
      ? db.prospect.findMany({
          where: {
            ...where,
            ...(restriction ? { ownerUserId: restriction } : {}),
            lifecycleStage: { notIn: ["CONVERTED", "DISQUALIFIED"] },
          },
          select: { id: true, companyName: true },
          orderBy: { companyName: "asc" },
          take: 1000,
        })
      : [],
    can(session, "customers.read")
      ? db.opportunity.findMany({
          where: {
            ...where,
            status: "OPEN",
            ...(restriction ? { ownerUserId: restriction } : {}),
            party: {
              organisationId: session.organisationId,
              identityScrubbed: false,
              archived: false,
            },
          },
          select: { id: true, name: true, partyId: true },
          orderBy: { name: "asc" },
          take: 1000,
        })
      : [],
    db.membership.findMany({
      where: {
        ...where,
        active: true,
        ...(restriction ? { userId: restriction } : {}),
      },
      select: { userId: true, user: { select: { name: true } } },
    }),
  ]);
  const names = new Map(
    members.map((member) => [member.userId, member.user.name]),
  );
  const rows = activities
    .filter(
      (row) =>
        row.dueAt &&
        week.days.includes(appointmentDay(row.dueAt.toISOString())),
    )
    .slice(0, 500)
    .map((row) => ({
      id: row.id,
      subject: row.subject,
      type: row.type,
      startsAt: row.dueAt!.toISOString(),
      endsAt: row.endsAt?.toISOString() ?? null,
      location: row.location,
      notes: row.notes,
      outcome: row.outcome,
      version: row.version,
      ownerUserId: row.ownerUserId,
      ownerName: names.get(row.ownerUserId) ?? "Sales colleague",
      completed: !!row.completedAt,
      cancelled: !!row.cancelledAt,
      partyId: row.partyId,
      prospectId: row.prospectId,
      opportunityId: row.opportunityId,
      accountName:
        can(session, "customers.read") &&
        row.party &&
        !row.party.identityScrubbed
          ? row.party.name
          : can(session, "sales.prospect.read") &&
              row.prospect &&
              (!restriction || row.prospect.ownerUserId === restriction)
            ? row.prospect.companyName
            : "Linked account",
      accountHref:
        can(session, "customers.read") &&
        row.party &&
        !row.party.identityScrubbed
          ? `/crm/accounts/${row.party.id}`
          : can(session, "sales.prospect.read") &&
              row.prospect &&
              (!restriction || row.prospect.ownerUserId === restriction)
            ? `/crm/prospect/${row.prospect.id}`
            : null,
      dealName:
        row.opportunity &&
        (!restriction || row.opportunity.ownerUserId === restriction)
          ? row.opportunity.name
          : null,
    }));
  return (
    <AppointmentDiary
      rows={rows}
      days={week.days}
      query={query}
      customers={customers.map((customer) => ({
        id: customer.id,
        name: `${customer.name} · ${customer.customerCode}`,
      }))}
      prospects={prospects.map((prospect) => ({
        id: prospect.id,
        name: prospect.companyName,
      }))}
      deals={deals}
      owners={members.map((member) => ({
        id: member.userId,
        name: member.user.name,
      }))}
      userId={session.userId}
      canManage={can(session, "sales.activity.manage")}
      seesAll={!restriction}
      requestKey={randomUUID()}
      truncated={activities.length > 500}
    />
  );
}
