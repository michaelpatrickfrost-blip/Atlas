"use server";

import { revalidatePath } from "next/cache";
import { requireSession, type Session } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { AUDIT_CAPABILITIES, CORE_CAPABILITIES, ECHO_CAPABILITIES } from "@/core/permissions/capabilities";
import { workAuditScope } from "@/core/permissions/work-access";
import { db } from "@/core/db/client";
import {
  AUDIT_AREA_CAPABILITY,
  AUDIT_OWN_CAPABILITY,
  areasForUser,
  assignAuditAreas,
  auditAreas,
  auditIntro,
  auditReportCsv,
  auditSearchWhere,
  auditVisibility,
  echoChangeVisible,
  isAuditArea,
  parseAuditAccess,
  personInAuditView,
  serializeAuditAccess,
  setOwnActivity,
} from "@/core/audit/access";
import {
  AUDIT_SYSTEMS,
  UNCLASSIFIED_SYSTEM,
  actionLabel,
  collectTeamUserIds,
  echoTarget,
  publicChange,
  recordHref,
  systemForAction,
} from "@/core/audit/systems";

async function requireAuditApp(session: Session) {
  await assertModuleEnabled(session, "audit");
}

async function teamUserIds(session: Session) {
  const [reports, managed] = await Promise.all([
    db.employee.findMany({
      where: { organisationId: session.organisationId, manager: { organisationId: session.organisationId, userId: session.userId } },
      select: { userId: true },
    }),
    db.workTeamMember.findMany({
      where: {
        isManager: true,
        membership: { organisationId: session.organisationId, userId: session.userId, active: true },
        team: { organisationId: session.organisationId },
      },
      select: { team: { select: { members: { select: { membership: { select: { userId: true, active: true } } } } } } },
    }),
  ]);
  return collectTeamUserIds({
    viewerUserId: session.userId,
    directReportUserIds: reports.map((report) => report.userId),
    managedTeamMemberUserIds: managed.flatMap((row) => row.team.members.filter((member) => member.membership.active).map((member) => member.membership.userId)),
  });
}

export type AuditBoard = {
  scope: "team" | "company" | "areas" | "own" | "mixed";
  title: string;
  detail: string;
  days: number;
  query: string;
  personId: string | null;
  systemId: string | null;
  teamId: string | null;
  teams: Array<{ id: string; name: string }>;
  people: Array<{ id: string; name: string; detail: string; count: number }>;
  systems: Array<{ id: string; name: string; summary: string; count: number }>;
  entries: Array<{
    id: string;
    at: string;
    label: string;
    detail: string | null;
    actorName: string;
    systemName: string;
    href: string | null;
  }>;
  unclassified: string[];
};

type AuditQuery = { personId?: string; systemId?: string; teamId?: string; days?: number; query?: string; limit?: number };

async function auditContext(session: Session) {
  const company = can(session, "core.audit.read");
  const team = can(session, AUDIT_CAPABILITIES.teamRead);
  const own = can(session, AUDIT_OWN_CAPABILITY);
  const areaReader = can(session, AUDIT_AREA_CAPABILITY);
  if (!company && !team && !own && !areaReader) throw new Error("FORBIDDEN: missing capability \"audit.team.read\"");
  const organisation = await db.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { auditAccess: true } });
  const policy = parseAuditAccess(organisation.auditAccess);
  const areaIds = areaReader ? areasForUser(policy, session.userId) : [];
  const teamActorIds = team && !company ? await teamUserIds(session) : null;
  return { company, team, own, areaIds, teamActorIds, policy };
}

async function readAuditRows(session: Session, input: AuditQuery) {
  await requireAuditApp(session);
  const context = await auditContext(session);
  const days = input.days === 1 || input.days === 30 ? input.days : 7;
  const since = new Date(Date.now() - days * 86400000);
  const query = (input.query ?? "").trim().slice(0, 80);
  const teams = context.company
    ? await db.workTeam.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 100 })
    : context.team
      ? await db.workTeam.findMany({
        where: { organisationId: session.organisationId, members: { some: { isManager: true, membership: { organisationId: session.organisationId, userId: session.userId, active: true } } } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
      : [];
  const teamId = input.teamId && teams.some((team) => team.id === input.teamId) ? input.teamId : null;
  let teamActorIds = context.teamActorIds;
  if (teamId) {
    const members = await db.workTeamMember.findMany({
      where: { teamId, team: { organisationId: session.organisationId }, membership: { organisationId: session.organisationId, active: true } },
      select: { membership: { select: { userId: true } } },
    });
    const memberIds = members.map((member) => member.membership.userId);
    teamActorIds = context.company ? memberIds : (teamActorIds ? memberIds.filter((id) => teamActorIds!.includes(id)) : memberIds);
  }
  const view = auditVisibility({
    company: context.company && !teamId,
    teamActorIds: context.company && !teamId ? null : teamActorIds,
    areaIds: teamId ? [] : context.areaIds,
    own: context.own && !teamId,
    userId: session.userId,
  });
  if (input.personId && !personInAuditView(input.personId, { company: context.company, teamActorIds: context.team ? teamActorIds : null, areaIds: context.areaIds, own: context.own, userId: session.userId })) {
    throw new Error("That person is outside this view.");
  }
  const personId = input.personId ?? null;
  if (personId) {
    const member = await db.membership.count({ where: { organisationId: session.organisationId, userId: personId } });
    if (!member) throw new Error("That person is outside this view.");
  }
  const system = auditAreas().find((item) => item.id === input.systemId);
  const nameMatches = query.length >= 2
    ? await db.user.findMany({
      where: { name: { contains: query, mode: "insensitive" }, memberships: { some: { organisationId: session.organisationId } } },
      select: { id: true },
      take: 40,
    })
    : [];
  const search = auditSearchWhere(query, nameMatches.map((user) => user.id));
  const rows = await db.auditEntry.findMany({
    where: {
      AND: [
        workAuditScope(session),
        view.where,
        { createdAt: { gte: since } },
        ...(personId ? [{ actorUserId: personId }] : []),
        ...(search ? [search] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 400,
    select: { id: true, action: true, entityType: true, entityId: true, actorUserId: true, after: true, createdAt: true },
  });
  const grant = auditVisibility({ company: context.company, teamActorIds: context.teamActorIds, areaIds: context.areaIds, own: context.own, userId: session.userId });
  return { context, days, query, teamId, personId, system, view, grant, teams, rows, directoryIds: teamActorIds };
}

export async function loadAuditBoard(input: AuditQuery = {}): Promise<AuditBoard> {
  const session = await requireSession();
  const loaded = await readAuditRows(session, { ...input, limit: 400 });
  const { rows, grant, system } = loaded;
  const visible = system ? rows.filter((row) => systemForAction(row.action).id === system.id) : rows;
  const counts = new Map<string, number>();
  const peopleCounts = new Map<string, number>();
  const unclassified = new Set<string>();
  for (const row of rows) {
    const mapped = systemForAction(row.action);
    counts.set(mapped.id, (counts.get(mapped.id) ?? 0) + 1);
    if (mapped.id === "other") unclassified.add(row.action.split(".")[0] || row.action);
    if (row.actorUserId) peopleCounts.set(row.actorUserId, (peopleCounts.get(row.actorUserId) ?? 0) + 1);
  }
  const peopleIds = [...new Set([...(loaded.directoryIds ?? []), ...peopleCounts.keys()])].slice(0, 80);
  const [users, employees] = await Promise.all([
    db.user.findMany({ where: { id: { in: peopleIds }, memberships: { some: { organisationId: session.organisationId } } }, select: { id: true, name: true } }),
    db.employee.findMany({ where: { organisationId: session.organisationId, userId: { in: peopleIds } }, select: { userId: true, jobTitle: true } }),
  ]);
  const names = new Map(users.map((user) => [user.id, user.name]));
  const titles = new Map(employees.flatMap((employee) => employee.userId ? [[employee.userId, employee.jobTitle] as const] : []));
  const directory = (loaded.directoryIds ?? [...peopleCounts.keys()]).filter((id) => names.has(id));
  const shownAreas = grant.kind === "areas" ? grant.areaIds : null;
  const catalogue = shownAreas ? auditAreas().filter((item) => shownAreas.includes(item.id)) : [...AUDIT_SYSTEMS, ...(counts.has("other") ? [UNCLASSIFIED_SYSTEM] : [])];
  const areaNames = auditAreas().filter((area) => grant.areaIds.includes(area.id)).map((area) => area.name);
  const intro = auditIntro(grant.kind, areaNames);
  const entries = visible.slice(0, 80).map((row) => {
    const mapped = systemForAction(row.action);
    return {
      id: row.id,
      at: row.createdAt.toISOString(),
      label: actionLabel(row.action),
      detail: publicChange(row.after),
      actorName: row.actorUserId ? names.get(row.actorUserId) ?? "Former member" : "System",
      systemName: mapped.name,
      href: recordHref(row.entityType, row.entityId),
    };
  });
  return {
    scope: grant.kind === "company" || grant.kind === "team" ? grant.kind : grant.kind === "none" ? "own" : grant.kind,
    title: intro.title,
    detail: intro.detail,
    days: loaded.days,
    query: loaded.query,
    personId: loaded.personId,
    systemId: system?.id ?? null,
    teamId: loaded.teamId,
    teams: loaded.teams,
    people: directory.slice(0, 40).map((id) => ({
      id,
      name: names.get(id) ?? "Former member",
      detail: id === session.userId ? "You" : titles.get(id) ?? "Team",
      count: peopleCounts.get(id) ?? 0,
    })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    systems: catalogue.map((item) => ({ id: item.id, name: item.name, summary: item.summary, count: counts.get(item.id) ?? 0 })),
    entries,
    unclassified: [...unclassified].slice(0, 12),
  };
}

export async function exportAuditReport(input: AuditQuery = {}) {
  const session = await requireSession();
  const loaded = await readAuditRows(session, { ...input, limit: 2000 });
  const listedIds = (loaded.system ? loaded.rows.filter((row) => systemForAction(row.action).id === loaded.system!.id) : loaded.rows).flatMap((row) => row.actorUserId ? [row.actorUserId] : []);
  const actorIds = [...new Set(listedIds)];
  const users = await db.user.findMany({
    where: { id: { in: actorIds }, memberships: { some: { organisationId: session.organisationId } } },
    select: { id: true, name: true },
  });
  const names = new Map(users.map((user) => [user.id, user.name]));
  const listed = loaded.system ? loaded.rows.filter((row) => systemForAction(row.action).id === loaded.system!.id) : loaded.rows;
  const rows = listed.map((row) => ({
    at: row.createdAt.toLocaleString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    actorName: row.actorUserId ? names.get(row.actorUserId) ?? "Former member" : "System",
    systemName: systemForAction(row.action).name,
    label: actionLabel(row.action),
    detail: publicChange(row.after) ?? "",
  }));
  return auditReportCsv(rows);
}

async function recordTitle(session: Session, entityType: string, entityId: string) {
  const target = echoTarget(entityType);
  if (!target) throw new Error("Echo is not available on this record.");
  assertCapability(session, target.capability);
  if (entityType === "Party") {
    const party = await db.party.findFirst({ where: { id: entityId, organisationId: session.organisationId }, select: { name: true } });
    if (!party) throw new Error("Record not found.");
    return party.name;
  }
  if (entityType === "SalesOrder") {
    const order = await db.salesOrder.findFirst({ where: { id: entityId, organisationId: session.organisationId }, select: { reference: true } });
    if (!order) throw new Error("Record not found.");
    return order.reference;
  }
  if (entityType === "Quote") {
    const quote = await db.quote.findFirst({ where: { id: entityId, organisationId: session.organisationId }, select: { reference: true } });
    if (!quote) throw new Error("Record not found.");
    return quote.reference;
  }
  const agreement = await db.salesAgreement.findFirst({ where: { id: entityId, organisationId: session.organisationId }, select: { reference: true } });
  if (!agreement) throw new Error("Record not found.");
  return agreement.reference;
}

export type EchoThread = {
  title: string;
  canWrite: boolean;
  people: Array<{ id: string; name: string }>;
  items: Array<
    | { kind: "note"; id: string; at: string; author: string; body: string; mentions: string[] }
    | { kind: "change"; id: string; at: string; actor: string; label: string; detail: string | null }
  >;
};

export async function loadEcho(entityType: string, entityId: string): Promise<EchoThread> {
  const session = await requireSession();
  assertCapability(session, ECHO_CAPABILITIES.read);
  await requireAuditApp(session);
  const title = await recordTitle(session, entityType, entityId);
  const notes = await db.echoNote.findMany({
    where: { organisationId: session.organisationId, entityType, entityId },
    orderBy: { createdAt: "asc" },
    take: 80,
    include: { mentions: { select: { id: true, userId: true, seenAt: true } } },
  });
  const unseen = notes.flatMap((note) => note.mentions.filter((mention) => mention.userId === session.userId && !mention.seenAt).map((mention) => mention.id));
  if (unseen.length) await db.echoMention.updateMany({ where: { id: { in: unseen }, organisationId: session.organisationId, userId: session.userId }, data: { seenAt: new Date() } });
  const companyAudit = can(session, "core.audit.read");
  const teamAudit = can(session, AUDIT_CAPABILITIES.teamRead);
  const ownAudit = can(session, AUDIT_OWN_CAPABILITY);
  const areaAudit = can(session, AUDIT_AREA_CAPABILITY);
  const showChanges = companyAudit || teamAudit || ownAudit || areaAudit;
  const areaIds = areaAudit ? areasForUser(parseAuditAccess((await db.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { auditAccess: true } })).auditAccess), session.userId) : [];
  const changes = showChanges ? (await db.auditEntry.findMany({
    where: { AND: [workAuditScope(session), { entityType, entityId }] },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { id: true, action: true, actorUserId: true, after: true, createdAt: true },
  })).filter((change) => echoChangeVisible({ company: companyAudit, team: teamAudit, own: ownAudit, areaIds, userId: session.userId, actorUserId: change.actorUserId, action: change.action })) : [];
  const userIds = [...new Set([
    ...notes.map((note) => note.authorUserId),
    ...notes.flatMap((note) => note.mentions.map((mention) => mention.userId)),
    ...changes.flatMap((change) => change.actorUserId ? [change.actorUserId] : []),
  ])];
  const [named, people] = await Promise.all([
    db.user.findMany({ where: { id: { in: userIds }, memberships: { some: { organisationId: session.organisationId } } }, select: { id: true, name: true } }),
    db.user.findMany({ where: { memberships: { some: { organisationId: session.organisationId, active: true } } }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 200 }),
  ]);
  const names = new Map(named.map((user) => [user.id, user.name]));
  const items: EchoThread["items"] = [
    ...notes.map((note) => ({
      kind: "note" as const,
      id: note.id,
      at: note.createdAt.toISOString(),
      author: names.get(note.authorUserId) ?? "Former member",
      body: note.body,
      mentions: note.mentions.map((mention) => names.get(mention.userId) ?? "Someone"),
    })),
    ...changes.map((change) => ({
      kind: "change" as const,
      id: change.id,
      at: change.createdAt.toISOString(),
      actor: change.actorUserId ? names.get(change.actorUserId) ?? "Former member" : "System",
      label: actionLabel(change.action),
      detail: publicChange(change.after),
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  return { title, canWrite: can(session, ECHO_CAPABILITIES.write), people, items };
}

export async function postEchoNote(entityType: string, entityId: string, body: string, mentionIds: string[]) {
  const session = await requireSession();
  assertCapability(session, ECHO_CAPABILITIES.write);
  await requireAuditApp(session);
  const title = await recordTitle(session, entityType, entityId);
  const text = body.trim();
  if (text.length < 1 || text.length > 2000) throw new Error("Write a note of up to 2000 characters.");
  const uniqueMentions = [...new Set(mentionIds)].filter((id) => id !== session.userId).slice(0, 8);
  if (uniqueMentions.length) {
    const members = await db.membership.count({ where: { organisationId: session.organisationId, active: true, userId: { in: uniqueMentions } } });
    if (members !== uniqueMentions.length) throw new Error("Tag people who belong to this company.");
  }
  const note = await db.echoNote.create({
    data: {
      organisationId: session.organisationId,
      entityType,
      entityId,
      authorUserId: session.userId,
      body: text,
      mentions: { create: uniqueMentions.map((userId) => ({ organisationId: session.organisationId, userId })) },
    },
  });
  await db.auditEntry.create({
    data: {
      organisationId: session.organisationId,
      actorUserId: session.userId,
      action: "echo.note.added",
      entityType,
      entityId,
      ...(uniqueMentions.length ? { after: { mentions: uniqueMentions.length } } : {}),
    },
  });
  const href = echoTarget(entityType)?.href(entityId);
  if (href) revalidatePath(href);
  revalidatePath("/audit/echo");
  return { id: note.id, title };
}

export type EchoInboxItem = {
  id: string;
  at: string;
  author: string;
  body: string;
  title: string;
  href: string | null;
  seen: boolean;
};

export async function loadEchoInbox(): Promise<EchoInboxItem[]> {
  const session = await requireSession();
  assertCapability(session, ECHO_CAPABILITIES.read);
  await requireAuditApp(session);
  const mentions = await db.echoMention.findMany({
    where: { organisationId: session.organisationId, userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { note: true },
  });
  const authors = await db.user.findMany({
    where: { id: { in: [...new Set(mentions.map((mention) => mention.note.authorUserId))] }, memberships: { some: { organisationId: session.organisationId } } },
    select: { id: true, name: true },
  });
  const names = new Map(authors.map((author) => [author.id, author.name]));
  const titles = new Map<string, string>();
  for (const mention of mentions) {
    const key = `${mention.note.entityType}:${mention.note.entityId}`;
    if (titles.has(key)) continue;
    const target = echoTarget(mention.note.entityType);
    if (!target || !can(session, target.capability)) {
      titles.set(key, "A record you cannot open");
      continue;
    }
    try {
      titles.set(key, await recordTitle(session, mention.note.entityType, mention.note.entityId));
    } catch {
      titles.set(key, "A record you cannot open");
    }
  }
  return mentions.map((mention) => {
    const target = echoTarget(mention.note.entityType);
    const allowed = target && can(session, target.capability);
    return {
      id: mention.id,
      at: mention.createdAt.toISOString(),
      author: names.get(mention.note.authorUserId) ?? "Former member",
      body: mention.note.body,
      title: titles.get(`${mention.note.entityType}:${mention.note.entityId}`) ?? "Record",
      href: allowed ? recordHref(mention.note.entityType, mention.note.entityId) : null,
      seen: Boolean(mention.seenAt),
    };
  });
}

function assertAuditManager(session: Session) {
  if (!can(session, CORE_CAPABILITIES.usersManage) && !can(session, CORE_CAPABILITIES.modulesManage)) {
    throw new Error("FORBIDDEN: missing capability \"core.users.manage\"");
  }
}

export type AuditAccessBoard = {
  ownActivity: boolean;
  people: Array<{ id: string; name: string }>;
  grants: Array<{ userId: string; name: string; areaIds: string[] }>;
  areas: Array<{ id: string; name: string; summary: string }>;
};

export async function loadAuditAccess(userId?: string): Promise<AuditAccessBoard & { selectedId: string | null }> {
  const session = await requireSession();
  assertAuditManager(session);
  await requireAuditApp(session);
  const [organisation, members] = await Promise.all([
    db.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { auditAccess: true } }),
    db.membership.findMany({
      where: { organisationId: session.organisationId, active: true },
      select: { userId: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
      take: 200,
    }),
  ]);
  const policy = parseAuditAccess(organisation.auditAccess);
  const names = new Map(members.map((member) => [member.userId, member.user.name]));
  const selectedId = userId && names.has(userId) ? userId : null;
  return {
    ownActivity: policy.ownActivity,
    people: members.map((member) => ({ id: member.userId, name: member.user.name })),
    grants: policy.grants.map((grant) => ({ userId: grant.userId, name: names.get(grant.userId) ?? "Former member", areaIds: grant.areaIds })),
    areas: auditAreas().map((area) => ({ id: area.id, name: area.name, summary: area.summary })),
    selectedId,
  };
}

export async function saveAuditOwnActivity(form: FormData) {
  const session = await requireSession();
  assertAuditManager(session);
  await requireAuditApp(session);
  const ownActivity = form.get("ownActivity") === "on";
  await db.$transaction(async (tx) => {
    const current = await tx.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { auditAccess: true } });
    const next = setOwnActivity(parseAuditAccess(current.auditAccess), ownActivity);
    await tx.organisation.update({ where: { id: session.organisationId }, data: { auditAccess: serializeAuditAccess(next) } });
    await tx.auditEntry.create({
      data: {
        organisationId: session.organisationId,
        actorUserId: session.userId,
        action: "company.audit_own_activity.updated",
        entityType: "Organisation",
        entityId: session.organisationId,
        before: { ownActivity: parseAuditAccess(current.auditAccess).ownActivity },
        after: { ownActivity },
      },
    });
  });
  revalidatePath("/audit/access");
  revalidatePath("/audit");
}

export async function saveAuditAreas(form: FormData) {
  const session = await requireSession();
  assertAuditManager(session);
  await requireAuditApp(session);
  const userId = String(form.get("userId") ?? "");
  const areaIds = form.getAll("area").map(String).filter(isAuditArea);
  const member = await db.membership.findFirst({ where: { organisationId: session.organisationId, userId, active: true }, select: { userId: true } });
  if (!member) throw new Error("Choose a person in this company.");
  await db.$transaction(async (tx) => {
    const current = await tx.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { auditAccess: true } });
    const before = areasForUser(parseAuditAccess(current.auditAccess), userId);
    const next = assignAuditAreas(parseAuditAccess(current.auditAccess), userId, areaIds);
    await tx.organisation.update({ where: { id: session.organisationId }, data: { auditAccess: serializeAuditAccess(next) } });
    await tx.auditEntry.create({
      data: {
        organisationId: session.organisationId,
        actorUserId: session.userId,
        action: "company.audit_access.updated",
        entityType: "Organisation",
        entityId: session.organisationId,
        before: { userId, areas: before },
        after: { userId, areas: areasForUser(next, userId) },
      },
    });
  });
  revalidatePath("/audit/access");
  revalidatePath("/audit");
}
