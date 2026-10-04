import { requireSession, type Session } from "@/core/auth/session";
import { echoTarget } from "@/core/audit/systems";
import { db } from "@/core/db/client";
import { getEnabledModuleIds } from "@/core/modules/runtime";
import { assertCapability, can } from "@/core/permissions/check";
import { CORE_CAPABILITIES, ECHO_CAPABILITIES } from "@/core/permissions/capabilities";
import { projectScope, taskScope } from "@/core/permissions/work-access";
import { hideTasksAlreadyListed, noticeKind, type Notice } from "./shape";

type Row = Notice & { at: number };

function escapeRe(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** "@Sam", "@Sam Green" or "@sam.green" typed in a message tags that person. */
export function mentionsName(body: string, fullName: string) {
  const names = [fullName, fullName.split(/\s+/)[0]].map((name) => name.trim()).filter((name) => name.length > 1);
  return names.some((name) => new RegExp(`(^|[\\s(])@${escapeRe(name)}(?![\\p{L}\\p{N}])`, "iu").test(body));
}

function clip(text: string, max = 140) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function when(date: Date | null | undefined) {
  if (!date) return "";
  return date.toLocaleString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function detail(...parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(" · ");
}

function missingStore(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /does not exist|P2021|P2022/.test(message);
}

async function optional<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (missingStore(error)) return fallback;
    throw error;
  }
}

function publish(rows: Row[]): Notice[] {
  return [...rows].sort((a, b) => b.at - a.at).map((row) => ({ id: row.id, group: row.group, title: row.title, detail: row.detail, href: row.href, ...(row.conversationId ? { conversationId: row.conversationId } : {}) }));
}

async function clearedKeys(session: Session) {
  const rows = await optional(() => db.projectInboxItem.findMany({
    where: { organisationId: session.organisationId, userId: session.userId, kind: "NOTICE_CLEAR" },
    select: { label: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  }), []);
  return new Set(rows.map((row) => row.label));
}

async function rememberClear(session: Session, key: string) {
  const existing = await db.projectInboxItem.findFirst({
    where: { organisationId: session.organisationId, userId: session.userId, kind: "NOTICE_CLEAR", label: key },
    select: { id: true },
  });
  if (existing) return;
  await db.projectInboxItem.create({
    data: {
      organisationId: session.organisationId,
      userId: session.userId,
      label: key,
      kind: "NOTICE_CLEAR",
      dismissedAt: new Date(),
    },
  });
}

async function echoNotices(session: Session, enabled: Set<string>): Promise<Row[]> {
  if (!enabled.has("audit") || !can(session, ECHO_CAPABILITIES.read)) return [];
  const mentions = await optional(() => db.echoMention.findMany({
    where: { organisationId: session.organisationId, userId: session.userId, seenAt: null },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { note: { select: { body: true, entityType: true, entityId: true, authorUserId: true } } },
  }), []);
  if (!mentions.length) return [];
  const authors = await db.user.findMany({
    where: { id: { in: [...new Set(mentions.map((mention) => mention.note.authorUserId))] }, memberships: { some: { organisationId: session.organisationId } } },
    select: { id: true, name: true },
  });
  const names = new Map(authors.map((author) => [author.id, author.name]));
  const titles = new Map<string, { title: string; href: string | null }>();
  const wanted = new Map<string, string[]>();
  for (const mention of mentions) {
    const key = `${mention.note.entityType}:${mention.note.entityId}`;
    const target = echoTarget(mention.note.entityType);
    if (!target || !can(session, target.capability)) {
      titles.set(key, { title: "a record", href: null });
      continue;
    }
    const ids = wanted.get(mention.note.entityType) ?? [];
    ids.push(mention.note.entityId);
    wanted.set(mention.note.entityType, ids);
    titles.set(key, { title: "a record", href: `${target.href(mention.note.entityId)}?echo=1` });
  }
  const organisationId = session.organisationId;
  const [parties, orders, quotes, agreements] = await Promise.all([
    wanted.has("Party") ? db.party.findMany({ where: { organisationId, id: { in: wanted.get("Party") } }, select: { id: true, name: true } }) : [],
    wanted.has("SalesOrder") ? db.salesOrder.findMany({ where: { organisationId, id: { in: wanted.get("SalesOrder") } }, select: { id: true, reference: true } }) : [],
    wanted.has("Quote") ? db.quote.findMany({ where: { organisationId, id: { in: wanted.get("Quote") } }, select: { id: true, reference: true } }) : [],
    wanted.has("SalesAgreement") ? db.salesAgreement.findMany({ where: { organisationId, id: { in: wanted.get("SalesAgreement") } }, select: { id: true, reference: true } }) : [],
  ]);
  for (const party of parties) titles.set(`Party:${party.id}`, { title: party.name, href: titles.get(`Party:${party.id}`)?.href ?? null });
  for (const order of orders) titles.set(`SalesOrder:${order.id}`, { title: order.reference, href: titles.get(`SalesOrder:${order.id}`)?.href ?? null });
  for (const quote of quotes) titles.set(`Quote:${quote.id}`, { title: quote.reference, href: titles.get(`Quote:${quote.id}`)?.href ?? null });
  for (const agreement of agreements) titles.set(`SalesAgreement:${agreement.id}`, { title: agreement.reference, href: titles.get(`SalesAgreement:${agreement.id}`)?.href ?? null });
  return mentions.map((mention) => {
    const record = titles.get(`${mention.note.entityType}:${mention.note.entityId}`);
    const author = names.get(mention.note.authorUserId) ?? "Someone";
    return {
      id: `echo:${mention.id}`,
      group: "Tagged" as const,
      title: `${author} tagged you on ${record?.title ?? "a record"}`,
      detail: detail(clip(mention.note.body), when(mention.createdAt)),
      href: record?.href ?? null,
      at: mention.createdAt.getTime(),
    };
  });
}


async function chatNotices(session: Session): Promise<Row[]> {
  if (!can(session, CORE_CAPABILITIES.chatRead)) return [];
  const mine = await optional(() => db.chatParticipant.findMany({
    where: { organisationId: session.organisationId, userId: session.userId },
    select: { conversationId: true, lastReadAt: true },
    take: 100,
  }), []);
  if (!mine.length) return [];
  const unread = await optional(() => db.chatMessage.findMany({
    where: {
      organisationId: session.organisationId,
      authorUserId: { not: session.userId },
      OR: mine.map((row) => ({ conversationId: row.conversationId, createdAt: { gt: row.lastReadAt } })),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, conversationId: true, authorUserId: true, body: true, createdAt: true },
  }), []);
  if (!unread.length) return [];
  const authors = await db.user.findMany({
    where: { id: { in: [...new Set(unread.map((message) => message.authorUserId))] }, memberships: { some: { organisationId: session.organisationId } } },
    select: { id: true, name: true },
  });
  const names = new Map(authors.map((author) => [author.id, author.name]));
  const byConversation = new Map<string, typeof unread>();
  for (const message of unread) byConversation.set(message.conversationId, [...(byConversation.get(message.conversationId) ?? []), message]);
  const rows: Row[] = [];
  for (const [conversationId, messages] of byConversation) {
    const latest = messages[0];
    const tagged = messages.find((message) => mentionsName(message.body, session.userName));
    const shown = tagged ?? latest;
    const author = names.get(shown.authorUserId) ?? "Someone";
    rows.push({
      id: `chat:${conversationId}`,
      group: tagged ? "Tagged" : "Messages",
      title: tagged ? `${author} tagged you in chat` : messages.length > 1 ? `${author} and others · ${messages.length} new messages` : `${author} sent a message`,
      detail: detail(clip(shown.body), when(shown.createdAt)),
      href: null,
      conversationId,
      at: shown.createdAt.getTime(),
    });
  }
  return rows;
}

async function inboxNotices(session: Session, enabled: Set<string>): Promise<Row[]> {
  if (!enabled.has("projects") || !can(session, "projects.read")) return [];
  const items = await optional(() => db.projectInboxItem.findMany({
    where: {
      organisationId: session.organisationId,
      userId: session.userId,
      dismissedAt: null,
      kind: { not: "NOTICE_CLEAR" },
      AND: [
        { OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: new Date() } }] },
        { OR: [{ projectId: null }, { project: projectScope(session) }] },
        { OR: [{ taskId: null }, { task: taskScope(session) }] },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, label: true, kind: true, projectId: true, taskId: true, createdAt: true },
  }), []);
  return items.map((item) => {
    const tagged = item.kind === "MENTION";
    return {
      id: `inbox:${item.id}`,
      group: tagged ? "Tagged" as const : "Assigned" as const,
      title: item.label,
      detail: detail(tagged ? "Tagged" : item.kind === "APPROVAL" ? "Waiting for your decision" : "Assigned to you", when(item.createdAt)),
      href: item.taskId ? `/projects/tasks/${item.taskId}` : item.projectId ? `/projects/${item.projectId}` : "/projects/work/inbox",
      at: item.createdAt.getTime(),
    };
  });
}

async function assignedWork(session: Session, enabled: Set<string>, cleared: Set<string>): Promise<Row[]> {
  const organisationId = session.organisationId;
  const rows: Row[] = [];
  if (enabled.has("projects") && can(session, "projects.read")) {
    const [tasks, meetings] = await optional(() => Promise.all([
      db.projectTask.findMany({
        where: { AND: [taskScope(session), { status: { notIn: ["DONE", "CANCELLED"] }, OR: [{ assigneeUserId: session.userId }, { contributorUserIds: { has: session.userId } }] }] },
        select: { id: true, title: true, dueAt: true, taskType: true, assigneeUserId: true, updatedAt: true, project: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
        take: 12,
      }),
      db.meeting.findMany({
        where: { organisationId, startsAt: { gte: new Date(Date.now() - 86_400_000) }, OR: [{ organiserUserId: session.userId }, { attendeeUserIds: { has: session.userId } }] },
        select: { id: true, title: true, startsAt: true },
        orderBy: { startsAt: "asc" },
        take: 8,
      }),
    ]), [[], []] as const);
    for (const task of tasks) {
      const id = `work:task:${task.id}`;
      if (cleared.has(id)) continue;
      const mine = task.assigneeUserId === session.userId;
      const kind = task.taskType === "FOLLOW_UP" ? "Follow-up" : task.taskType === "REQUEST" ? "Request" : "Task";
      rows.push({
        id,
        group: mine ? "Assigned" : "Tagged",
        title: task.title,
        detail: detail(kind, mine ? "Assigned to you" : "You were added", task.project?.name, when(task.dueAt)),
        href: `/projects/tasks/${task.id}`,
        at: (task.dueAt ?? task.updatedAt).getTime(),
      });
    }
    for (const meeting of meetings) {
      const id = `work:meeting:${meeting.id}`;
      if (cleared.has(id)) continue;
      rows.push({ id, group: "Assigned", title: meeting.title, detail: detail("Meeting", when(meeting.startsAt)), href: "/projects/meetings", at: meeting.startsAt.getTime() });
    }
  }
  if (enabled.has("crm")) {
    const activities = await optional(() => db.salesActivity.findMany({
      where: { organisationId, ownerUserId: session.userId, completedAt: null },
      select: { id: true, subject: true, type: true, dueAt: true, createdAt: true, prospectId: true, opportunityId: true, partyId: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }), []);
    for (const activity of activities) {
      const id = `work:activity:${activity.id}`;
      if (cleared.has(id)) continue;
      const href = activity.opportunityId ? `/crm/opportunities/${activity.opportunityId}` : activity.prospectId ? `/crm/prospect/${activity.prospectId}` : activity.partyId ? `/customers/${activity.partyId}` : "/crm/today";
      rows.push({ id, group: "Assigned", title: activity.subject, detail: detail(activity.type.replaceAll("_", " "), "Assigned to you", when(activity.dueAt)), href, at: (activity.dueAt ?? activity.createdAt).getTime() });
    }
  }
  if (enabled.has("service") && can(session, "service.case.read")) {
    const cases = await optional(() => db.serviceCase.findMany({
      where: { organisationId, ownerUserId: session.userId, status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] } },
      select: { id: true, number: true, subject: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }), []);
    for (const item of cases) {
      const id = `work:case:${item.id}`;
      if (cleared.has(id)) continue;
      rows.push({ id, group: "Assigned", title: item.subject, detail: detail(item.number, "Assigned to you"), href: `/service/cases/${item.id}`, at: item.updatedAt.getTime() });
    }
  }
  if (enabled.has("people")) {
    const [reviews, meetings, tasks] = await optional(() => Promise.all([
      db.appraisal.findMany({
        where: { organisationId, status: "SCHEDULED", OR: [{ reviewerUserId: session.userId }, { employee: { userId: session.userId } }] },
        select: { id: true, cycle: true, scheduledAt: true, employee: { select: { firstName: true, lastName: true, userId: true } } },
        orderBy: { scheduledAt: "asc" },
        take: 6,
      }),
      db.oneToOne.findMany({
        where: { organisationId, status: "SCHEDULED", OR: [{ managerUserId: session.userId }, { employee: { userId: session.userId } }] },
        select: { id: true, scheduledAt: true, employee: { select: { firstName: true, lastName: true, userId: true } } },
        orderBy: { scheduledAt: "asc" },
        take: 6,
      }),
      db.employeeTask.findMany({
        where: { organisationId, assignedToUserId: session.userId, completedAt: null },
        select: { id: true, title: true, dueDate: true, createdAt: true, employee: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]), [[], [], []] as const);
    for (const review of reviews) {
      const id = `work:appraisal:${review.id}`;
      if (cleared.has(id)) continue;
      const mine = review.employee.userId === session.userId;
      rows.push({ id, group: "Assigned", title: review.cycle, detail: detail("Appraisal", mine ? "Your review" : `${review.employee.firstName} ${review.employee.lastName}`, when(review.scheduledAt)), href: "/people/appraisals", at: review.scheduledAt.getTime() });
    }
    for (const meeting of meetings) {
      const id = `work:one-to-one:${meeting.id}`;
      if (cleared.has(id)) continue;
      const mine = meeting.employee.userId === session.userId;
      rows.push({ id, group: "Assigned", title: mine ? "Your one-to-one" : `${meeting.employee.firstName} ${meeting.employee.lastName}`, detail: detail("One-to-one", when(meeting.scheduledAt)), href: "/people/one-to-ones", at: meeting.scheduledAt.getTime() });
    }
    for (const task of tasks) {
      const id = `work:hr-task:${task.id}`;
      if (cleared.has(id)) continue;
      rows.push({ id, group: "Assigned", title: task.title, detail: detail("Assigned to you", `${task.employee.firstName} ${task.employee.lastName}`, when(task.dueDate)), href: `/people/${task.employee.id}`, at: (task.dueDate ?? task.createdAt).getTime() });
    }
  }
  return rows;
}

async function collect(session: Session): Promise<Notice[]> {
  const [enabled, cleared] = await Promise.all([getEnabledModuleIds(session.organisationId), clearedKeys(session)]);
  const [tagged, inbox, work, chat] = await Promise.all([
    echoNotices(session, enabled),
    inboxNotices(session, enabled),
    assignedWork(session, enabled, cleared),
    chatNotices(session),
  ]);
  const listedTasks = new Set(inbox.flatMap((item) => {
    const id = item.href?.match(/^\/projects\/tasks\/([A-Za-z0-9]+)/)?.[1];
    return id ? [id] : [];
  }));
  const assignments = hideTasksAlreadyListed(listedTasks, publish(work));
  return [...publish(tagged.filter((item) => item.group === "Tagged").concat(inbox.filter((item) => item.group === "Tagged"), chat.filter((item) => item.group === "Tagged"))), ...publish(inbox.filter((item) => item.group === "Assigned")), ...assignments, ...publish(chat.filter((item) => item.group === "Messages"))].slice(0, 40);
}

async function sessionForNotices() {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  return session;
}

export async function collectNotices(session: Session): Promise<Notice[]> {
  return collect(session);
}

export async function loadNotices(): Promise<Notice[]> {
  return collect(await sessionForNotices());
}

export async function clearNotice(id: string) {
  const session = await sessionForNotices();
  const kind = noticeKind(id);
  if (!kind) throw new Error("That notification is no longer here.");
  if (kind === "echo") {
    const updated = await db.echoMention.updateMany({
      where: { id: id.slice("echo:".length), organisationId: session.organisationId, userId: session.userId, seenAt: null },
      data: { seenAt: new Date() },
    });
    if (updated.count !== 1) throw new Error("That notification is no longer here.");
    return;
  }
  if (kind === "chat") {
    const read = await db.chatParticipant.updateMany({
      where: { conversationId: id.slice("chat:".length), organisationId: session.organisationId, userId: session.userId },
      data: { lastReadAt: new Date() },
    });
    if (read.count !== 1) throw new Error("That notification is no longer here.");
    return;
  }
  if (kind === "inbox") {
    const item = await db.projectInboxItem.findFirst({
      where: { id: id.slice("inbox:".length), organisationId: session.organisationId, userId: session.userId, dismissedAt: null, kind: { not: "NOTICE_CLEAR" } },
      select: { id: true, taskId: true },
    });
    if (!item) throw new Error("That notification is no longer here.");
    await db.projectInboxItem.update({ where: { id: item.id }, data: { dismissedAt: new Date() } });
    if (item.taskId) await rememberClear(session, `work:task:${item.taskId}`);
    return;
  }
  await rememberClear(session, id);
}

export async function clearNotices() {
  const session = await sessionForNotices();
  const items = await collect(session);
  for (const item of items) {
    const kind = noticeKind(item.id);
    if (kind === "echo") {
      await db.echoMention.updateMany({
        where: { id: item.id.slice("echo:".length), organisationId: session.organisationId, userId: session.userId, seenAt: null },
        data: { seenAt: new Date() },
      });
    } else if (kind === "chat") {
      await db.chatParticipant.updateMany({
        where: { conversationId: item.id.slice("chat:".length), organisationId: session.organisationId, userId: session.userId },
        data: { lastReadAt: new Date() },
      });
    } else if (kind === "inbox") {
      const row = await db.projectInboxItem.findFirst({
        where: { id: item.id.slice("inbox:".length), organisationId: session.organisationId, userId: session.userId, dismissedAt: null },
        select: { id: true, taskId: true },
      });
      if (!row) continue;
      await db.projectInboxItem.update({ where: { id: row.id }, data: { dismissedAt: new Date() } });
      if (row.taskId) await rememberClear(session, `work:task:${row.taskId}`);
    } else if (kind === "work") {
      await rememberClear(session, item.id);
    }
  }
}
