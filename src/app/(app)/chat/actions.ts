"use server";
import { requireSession, type Session } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { projectScope, taskScope } from "@/core/permissions/work-access";
import { enabledModulesForSession } from "@/core/modules/runtime";
import { db } from "@/core/db/client";
import {
  conversationKey,
  linkSelection,
  messageBody,
  CHAT_LINK_TYPES,
  CHAT_TASK_TYPES,
  type ChatLinkType,
} from "@/core/chat/policy";
import { choice, dateValue, PRIORITIES } from "@/modules/projects/domain/work";
import { revalidatePath } from "next/cache";

const TASK_LABELS: Record<string, string> = {
  TASK: "Task",
  FOLLOW_UP: "Follow-up",
  REQUEST: "Request",
};
const LINK_META: Record<
  ChatLinkType,
  { capability: string; moduleId: string | null }
> = {
  SALES_ORDER: { capability: "sales.order.read", moduleId: "sales" },
  QUOTE: { capability: "sales.quote.read", moduleId: "sales" },
  CUSTOMER: { capability: "customers.read", moduleId: null },
  PROJECT: { capability: "projects.read", moduleId: "projects" },
  PRODUCT: { capability: "core.products.read", moduleId: "products" },
};

type VisibleLink = {
  type: ChatLinkType;
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

function hrefFor(type: ChatLinkType, id: string) {
  if (type === "SALES_ORDER") return `/sales/orders/${id}`;
  if (type === "QUOTE") return `/sales/quotes/${id}`;
  if (type === "CUSTOMER") return `/customers/${id}`;
  if (type === "PROJECT") return `/projects/${id}`;
  return `/products/${id}`;
}

function canAttach(session: Session, enabled: Set<string>, type: ChatLinkType) {
  const meta = LINK_META[type];
  return (
    can(session, meta.capability) &&
    (!meta.moduleId || enabled.has(meta.moduleId))
  );
}

async function member(session: Session, userId: string) {
  if (
    !(await db.membership.findFirst({
      where: { organisationId: session.organisationId, userId, active: true },
    }))
  ) {
    throw new Error("Choose an active member of this company.");
  }
}

async function conversationFor(session: Session, id: string) {
  const conversation = await db.chatConversation.findFirst({
    where: {
      id,
      organisationId: session.organisationId,
      kind: { in: ["DIRECT", "GROUP"] },
    },
    include: { participants: { select: { userId: true } } },
  });
  if (
    !conversation ||
    !conversation.participants.some(
      (person) => person.userId === session.userId,
    )
  ) {
    throw new Error("That conversation is not available.");
  }
  return conversation;
}

async function enabledModules(session: Session) {
  return enabledModulesForSession(session);
}

function stamp(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function textFilter(needle: string) {
  return needle
    ? { contains: needle, mode: "insensitive" as const }
    : undefined;
}

async function loadLinks(
  session: Session,
  enabled: Set<string>,
  requested: Array<{ type: ChatLinkType; id: string }>,
) {
  const found = new Map<string, VisibleLink>();
  const wanted = (type: ChatLinkType) => [
    ...new Set(
      requested
        .filter(
          (item) => item.type === type && canAttach(session, enabled, type),
        )
        .map((item) => item.id),
    ),
  ];
  const orders = wanted("SALES_ORDER");
  const quotes = wanted("QUOTE");
  const customers = wanted("CUSTOMER");
  const projects = wanted("PROJECT");
  const products = wanted("PRODUCT");
  const [orderRows, quoteRows, customerRows, projectRows, productRows] =
    await Promise.all([
      orders.length
        ? db.salesOrder.findMany({
            where: {
              organisationId: session.organisationId,
              id: { in: orders },
            },
            select: {
              id: true,
              reference: true,
              party: { select: { name: true } },
            },
          })
        : [],
      quotes.length
        ? db.quote.findMany({
            where: {
              organisationId: session.organisationId,
              id: { in: quotes },
            },
            select: {
              id: true,
              reference: true,
              party: { select: { name: true } },
            },
          })
        : [],
      customers.length
        ? db.party.findMany({
            where: {
              organisationId: session.organisationId,
              archived: false,
              identityScrubbed: false,
              id: { in: customers },
            },
            select: {
              id: true,
              name: true,
              tradingName: true,
              customerCode: true,
            },
          })
        : [],
      projects.length
        ? db.project.findMany({
            where: { AND: [{ id: { in: projects } }, projectScope(session)] },
            select: { id: true, name: true, reference: true },
          })
        : [],
      products.length
        ? db.product.findMany({
            where: {
              organisationId: session.organisationId,
              id: { in: products },
            },
            select: { id: true, name: true, code: true },
          })
        : [],
    ]);
  for (const row of orderRows)
    found.set(`SALES_ORDER:${row.id}`, {
      type: "SALES_ORDER",
      id: row.id,
      title: row.reference,
      subtitle: row.party.name,
      href: hrefFor("SALES_ORDER", row.id),
    });
  for (const row of quoteRows)
    found.set(`QUOTE:${row.id}`, {
      type: "QUOTE",
      id: row.id,
      title: row.reference,
      subtitle: row.party.name,
      href: hrefFor("QUOTE", row.id),
    });
  for (const row of customerRows)
    found.set(`CUSTOMER:${row.id}`, {
      type: "CUSTOMER",
      id: row.id,
      title: row.tradingName || row.name,
      subtitle: row.customerCode,
      href: hrefFor("CUSTOMER", row.id),
    });
  for (const row of projectRows)
    found.set(`PROJECT:${row.id}`, {
      type: "PROJECT",
      id: row.id,
      title: row.name,
      subtitle: row.reference,
      href: hrefFor("PROJECT", row.id),
    });
  for (const row of productRows)
    found.set(`PRODUCT:${row.id}`, {
      type: "PRODUCT",
      id: row.id,
      title: row.name,
      subtitle: row.code,
      href: hrefFor("PRODUCT", row.id),
    });
  return found;
}

function present(
  type: ChatLinkType,
  id: string,
  found: Map<string, VisibleLink>,
) {
  return (
    found.get(`${type}:${id}`) ?? {
      type,
      id: "",
      title: "Attached record",
      subtitle: "Not available to you",
      href: "",
    }
  );
}

export async function postMessage(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.chat.write");
  void form;
  throw new Error(
    "Company messages are turned off. Choose the people who should see it.",
  );
}

export async function searchChatPeople(query: string) {
  const session = await requireSession();
  assertCapability(session, "core.chat.read");
  const needle = String(query ?? "").trim();
  if (needle.length > 80) throw new Error("Search is too long.");
  if (!needle)
    return [] as Array<{
      id: string;
      type: "user" | "contact";
      name: string;
      subtitle: string;
    }>;
  const text = { contains: needle, mode: "insensitive" as const };
  const [memberships, contacts] = await Promise.all([
    db.membership.findMany({
      where: {
        organisationId: session.organisationId,
        active: true,
        userId: { not: session.userId },
        user: { name: text },
      },
      select: { user: { select: { id: true, name: true } } },
      orderBy: { user: { name: "asc" } },
      take: 15,
    }),
    can(session, "customers.read")
      ? db.contact.findMany({
          where: {
            status: "ACTIVE",
            identityScrubbed: false,
            party: {
              organisationId: session.organisationId,
              archived: false,
              identityScrubbed: false,
            },
            OR: [
              { firstName: text },
              { surname: text },
              { preferredName: text },
              { party: { name: text } },
            ],
          },
          select: {
            id: true,
            firstName: true,
            surname: true,
            preferredName: true,
            jobTitle: true,
            party: { select: { name: true } },
          },
          orderBy: [{ surname: "asc" }, { firstName: "asc" }],
          take: 15,
        })
      : [],
  ]);
  const userIds = memberships.map((row) => row.user.id);
  const employees = userIds.length
    ? await db.employee.findMany({
        where: {
          organisationId: session.organisationId,
          userId: { in: userIds },
        },
        select: { userId: true, jobTitle: true, department: true },
      })
    : [];
  const jobTitleByUser = new Map(
    employees.map((row) => [
      row.userId,
      row.department ? `${row.jobTitle} · ${row.department}` : row.jobTitle,
    ]),
  );
  const people = memberships.map((row) => ({
    id: row.user.id,
    type: "user" as const,
    name: row.user.name,
    subtitle: jobTitleByUser.get(row.user.id) ?? "Colleague",
  }));
  const customerContacts = contacts.map((contact) => ({
    id: contact.id,
    type: "contact" as const,
    name:
      contact.preferredName || `${contact.firstName} ${contact.surname}`.trim(),
    subtitle: contact.jobTitle
      ? `${contact.jobTitle} · ${contact.party.name}`
      : contact.party.name,
  }));
  return [...people, ...customerContacts];
}

async function contactsInCompany(session: Session, contactIds: string[]) {
  if (!contactIds.length) return;
  if (!can(session, "customers.read"))
    throw new Error("You cannot open a chat with a customer contact.");
  const rows = await db.contact.findMany({
    where: {
      id: { in: contactIds },
      status: "ACTIVE",
      identityScrubbed: false,
      party: {
        organisationId: session.organisationId,
        archived: false,
        identityScrubbed: false,
      },
    },
    select: { id: true },
  });
  if (rows.length !== contactIds.length)
    throw new Error("Choose a contact from this company.");
}

export async function openChat(userIds: string[], contactIds: string[] = []) {
  const session = await requireSession();
  assertCapability(session, "core.chat.read");
  const room = conversationKey([session.userId, ...userIds], contactIds);
  for (const userId of room.userIds)
    if (userId !== session.userId) await member(session, userId);
  await contactsInCompany(session, room.contactIds);
  const existing = await db.chatConversation.findFirst({
    where: {
      organisationId: session.organisationId,
      directKey: room.key,
      kind: room.kind,
    },
  });
  if (existing) return { conversationId: existing.id };
  try {
    const conversation = await db.chatConversation.create({
      data: {
        organisationId: session.organisationId,
        kind: room.kind,
        directKey: room.key,
        participants: {
          create: [
            ...room.userIds.map((userId) => ({
              organisationId: session.organisationId,
              userId,
            })),
            ...room.contactIds.map((contactId) => ({
              organisationId: session.organisationId,
              contactId,
            })),
          ],
        },
      },
    });
    return { conversationId: conversation.id };
  } catch {
    const again = await db.chatConversation.findFirst({
      where: {
        organisationId: session.organisationId,
        directKey: room.key,
        kind: room.kind,
      },
    });
    if (!again) throw new Error("Could not open that conversation.");
    return { conversationId: again.id };
  }
}

export async function openDirectChat(userId: string) {
  return openChat([userId]);
}

export async function searchChatRecords(query: string) {
  const session = await requireSession();
  assertCapability(session, "core.chat.read");
  const needle = String(query ?? "").trim();
  if (needle.length > 80) throw new Error("Search is too long.");
  const enabled = await enabledModules(session);
  const text = textFilter(needle);
  const results: VisibleLink[] = [];
  if (canAttach(session, enabled, "SALES_ORDER")) {
    const rows = await db.salesOrder.findMany({
      where: {
        organisationId: session.organisationId,
        ...(text
          ? {
              OR: [
                { reference: text },
                { customerPoReference: text },
                { party: { name: text } },
              ],
            }
          : {}),
      },
      select: { id: true, reference: true, party: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    });
    for (const row of rows)
      results.push({
        type: "SALES_ORDER",
        id: row.id,
        title: row.reference,
        subtitle: row.party.name,
        href: hrefFor("SALES_ORDER", row.id),
      });
  }
  if (canAttach(session, enabled, "QUOTE")) {
    const rows = await db.quote.findMany({
      where: {
        organisationId: session.organisationId,
        ...(text
          ? { OR: [{ reference: text }, { party: { name: text } }] }
          : {}),
      },
      select: { id: true, reference: true, party: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    });
    for (const row of rows)
      results.push({
        type: "QUOTE",
        id: row.id,
        title: row.reference,
        subtitle: row.party.name,
        href: hrefFor("QUOTE", row.id),
      });
  }
  if (canAttach(session, enabled, "CUSTOMER")) {
    const rows = await db.party.findMany({
      where: {
        organisationId: session.organisationId,
        archived: false,
        identityScrubbed: false,
        ...(text
          ? {
              OR: [
                { name: text },
                { tradingName: text },
                { customerCode: text },
              ],
            }
          : {}),
      },
      select: { id: true, name: true, tradingName: true, customerCode: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    });
    for (const row of rows)
      results.push({
        type: "CUSTOMER",
        id: row.id,
        title: row.tradingName || row.name,
        subtitle: row.customerCode,
        href: hrefFor("CUSTOMER", row.id),
      });
  }
  if (canAttach(session, enabled, "PROJECT")) {
    const rows = await db.project.findMany({
      where: {
        AND: [
          projectScope(session),
          ...(text ? [{ OR: [{ name: text }, { reference: text }] }] : []),
        ],
      },
      select: { id: true, name: true, reference: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    });
    for (const row of rows)
      results.push({
        type: "PROJECT",
        id: row.id,
        title: row.name,
        subtitle: row.reference,
        href: hrefFor("PROJECT", row.id),
      });
  }
  if (canAttach(session, enabled, "PRODUCT")) {
    const rows = await db.product.findMany({
      where: {
        organisationId: session.organisationId,
        ...(text ? { OR: [{ name: text }, { code: text }] } : {}),
      },
      select: { id: true, name: true, code: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    });
    for (const row of rows)
      results.push({
        type: "PRODUCT",
        id: row.id,
        title: row.name,
        subtitle: row.code,
        href: hrefFor("PRODUCT", row.id),
      });
  }
  return results;
}

export async function sendChat(input: {
  conversationId: string;
  body: string;
  kind?: "TEXT" | "NOTE" | "TASK" | "MEETING";
  assigneeUserId?: string;
  dueAt?: string;
  priority?: string;
  taskType?: string;
  startsAt?: string;
  links?: Array<{ type: string; id: string }>;
}) {
  const session = await requireSession();
  assertCapability(session, "core.chat.write");
  const kind = input.kind ?? "TEXT";
  if (!["TEXT", "NOTE", "TASK", "MEETING"].includes(kind))
    throw new Error("Choose a message, note, task or meeting.");
  const selected = linkSelection(input.links);
  const body = messageBody(
    String(input.body ?? "").trim() ||
      (kind === "TEXT" && selected.length ? "Shared Atlas records." : ""),
  );
  const conversation = await conversationFor(session, input.conversationId);
  const enabled = await enabledModules(session);
  const visible = selected.length
    ? await loadLinks(session, enabled, selected)
    : new Map<string, VisibleLink>();
  if (selected.some((item) => !visible.has(`${item.type}:${item.id}`)))
    throw new Error("That record is not available to attach.");
  const assigneeUserId = (
    input.assigneeUserId ||
    conversation.participants.find(
      (person) => person.userId && person.userId !== session.userId,
    )?.userId ||
    session.userId
  ).trim();
  if (kind === "TASK" || kind === "MEETING") {
    if (!enabled.has("projects"))
      throw new Error("Turn on Projects before assigning work from chat.");
    await member(session, assigneeUserId);
  }
  await db.$transaction(async (tx) => {
    let taskId: string | null = null;
    let meetingId: string | null = null;
    if (kind === "TASK") {
      const taskType = choice(
        input.taskType || "TASK",
        CHAT_TASK_TYPES,
        "work type",
      );
      const priority = choice(
        input.priority || "NORMAL",
        PRIORITIES,
        "priority",
      );
      const dueAt = dateValue(input.dueAt || "");
      const task = await tx.projectTask.create({
        data: {
          organisationId: session.organisationId,
          reference: `TASK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          title: body.slice(0, 200),
          description: body,
          taskType,
          priority,
          dueAt,
          assigneeUserId,
          creatorUserId: session.userId,
          visibility: "PRIVATE",
          contributorUserIds: [
            ...new Set(
              conversation.participants
                .map((person) => person.userId)
                .filter(
                  (id): id is string =>
                    Boolean(id) &&
                    id !== session.userId &&
                    id !== assigneeUserId,
                ),
            ),
          ],
        },
      });
      taskId = task.id;
      if (assigneeUserId !== session.userId) {
        await tx.projectInboxItem.create({
          data: {
            organisationId: session.organisationId,
            userId: assigneeUserId,
            taskId: task.id,
            label: `${TASK_LABELS[taskType]}: ${task.title}`,
            kind: "ASSIGNMENT",
          },
        });
      }
      await tx.auditEntry.create({
        data: {
          organisationId: session.organisationId,
          actorUserId: session.userId,
          action: "TaskCreated",
          entityType: "ProjectTask",
          entityId: task.id,
          workTaskId: task.id,
          after: { title: task.title, source: "chat", assigneeUserId },
        },
      });
    }
    if (kind === "MEETING") {
      const startsAt = dateValue(input.startsAt || "");
      if (!startsAt) throw new Error("Choose a meeting time.");
      const attendeeUserIds = [
        ...new Set([
          session.userId,
          assigneeUserId,
          ...conversation.participants
            .map((person) => person.userId)
            .filter((id): id is string => Boolean(id)),
        ]),
      ];
      const meeting = await tx.meeting.create({
        data: {
          organisationId: session.organisationId,
          title: body.slice(0, 200),
          startsAt,
          organiserUserId: session.userId,
          attendeeUserIds,
          notes: "Arranged in chat.",
        },
      });
      meetingId = meeting.id;
      await tx.auditEntry.create({
        data: {
          organisationId: session.organisationId,
          actorUserId: session.userId,
          action: "ProjectMeetingCreated",
          entityType: "Meeting",
          entityId: meeting.id,
          after: { title: meeting.title, source: "chat" },
        },
      });
    }
    await tx.chatMessage.create({
      data: {
        organisationId: session.organisationId,
        conversationId: conversation.id,
        authorUserId: session.userId,
        body,
        kind,
        taskId,
        meetingId,
        ...(selected.length
          ? {
              links: {
                create: selected.map((item) => ({
                  organisationId: session.organisationId,
                  entityType: item.type,
                  entityId: item.id,
                })),
              },
            }
          : {}),
      },
    });
    await tx.chatParticipant.upsert({
      where: {
        conversationId_userId: {
          conversationId: conversation.id,
          userId: session.userId,
        },
      },
      create: {
        organisationId: session.organisationId,
        conversationId: conversation.id,
        userId: session.userId,
        lastReadAt: new Date(),
      },
      update: { lastReadAt: new Date() },
    });
    await tx.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
  });
  revalidatePath("/chat");
  revalidatePath("/projects", "layout");
  return { conversationId: conversation.id };
}

function conversationTitle(
  kind: string,
  participants: Array<{ userId: string | null; contactId?: string | null }>,
  names: Map<string, string>,
  me: string,
) {
  const others = participants.flatMap((person) => {
    if (person.userId && person.userId !== me)
      return [names.get(person.userId) ?? "Former member"];
    if (person.contactId)
      return [names.get(`contact:${person.contactId}`) ?? "Contact"];
    return [];
  });
  if (kind === "DIRECT") return others[0] ?? "Direct message";
  if (!others.length) return "Group chat";
  if (others.length <= 3) return others.join(", ");
  return `${others.slice(0, 2).join(", ")} +${others.length - 2}`;
}

/** Task attachments use the same per-recipient record resolver as Messages.
 * Reading them never marks the conversation read. */
export async function taskChatAttachments(taskId: string) {
  const session = await requireSession();
  assertCapability(session, "core.chat.read");
  assertCapability(session, "projects.read");
  const enabled = await enabledModules(session);
  if (!enabled.has("projects")) throw new Error("Projects is not available.");
  if (typeof taskId !== "string" || !taskId || taskId.length > 80) throw new Error("Choose a task.");
  const task = await db.projectTask.findFirst({ where: { AND: [taskScope(session), { id: taskId },
    { OR: [{ assigneeUserId: session.userId }, { contributorUserIds: { has: session.userId } }] }] }, select: { id: true } });
  if (!task) throw new Error("This task is no longer available to you.");
  const messages = await db.chatMessage.findMany({ where: { organisationId: session.organisationId, taskId,
    conversation: { organisationId: session.organisationId, participants: { some: { organisationId: session.organisationId, userId: session.userId } } } },
    select: { links: { select: { entityType: true, entityId: true } } } });
  const requested = messages.flatMap((message) => message.links.flatMap((link) => CHAT_LINK_TYPES.includes(link.entityType as ChatLinkType)
    ? [{ type: link.entityType as ChatLinkType, id: link.entityId }] : []));
  const found = await loadLinks(session, enabled, requested);
  const distinct = new Map(requested.map((link) => [`${link.type}:${link.id}`, present(link.type, link.id, found)]));
  return [...distinct.values()].map((link, index) => ({ key: `chat-${index}`, title: link.title, detail: link.subtitle, href: link.href || null }));
}

export async function chatSnapshot(
  activeId?: string,
  options: { query?: string; before?: string } = {},
) {
  const session = await requireSession();
  assertCapability(session, "core.chat.read");
  const query = String(options.query ?? "").trim();
  const before = String(options.before ?? "").trim();
  if (query.length > 120 || before.length > 80)
    throw new Error("Chat search is too long.");
  if ((query || before) && !activeId)
    throw new Error("Choose a conversation to search.");
  if (activeId) await conversationFor(session, activeId);
  if (activeId && !query && !before) {
    await db.chatParticipant.updateMany({
      where: {
        conversationId: activeId,
        organisationId: session.organisationId,
        userId: session.userId,
      },
      data: { lastReadAt: new Date() },
    });
  }
  const enabled = await enabledModules(session);
  const [conversations, people, contactRows] = await Promise.all([
    db.chatConversation.findMany({
      where: {
        organisationId: session.organisationId,
        kind: { in: ["DIRECT", "GROUP"] },
        participants: { some: { userId: session.userId } },
      },
      include: {
        participants: {
          select: { userId: true, contactId: true, lastReadAt: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            body: true,
            createdAt: true,
            authorUserId: true,
            kind: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.membership
      .findMany({
        where: {
          organisationId: session.organisationId,
          active: true,
          userId: { not: session.userId },
        },
        select: { user: { select: { id: true, name: true } } },
        orderBy: { user: { name: "asc" } },
        take: 200,
      })
      .then(async (rows) => {
        const userIds = rows.map((row) => row.user.id);
        const employees = userIds.length
          ? await db.employee.findMany({
              where: {
                organisationId: session.organisationId,
                userId: { in: userIds },
              },
              select: { userId: true, jobTitle: true },
            })
          : [];
        const titleByUser = new Map(
          employees.map((row) => [row.userId, row.jobTitle]),
        );
        return rows.map((row) => ({
          user: {
            id: row.user.id,
            name: row.user.name,
            jobTitle: titleByUser.get(row.user.id) ?? null,
          },
        }));
      }),
    can(session, "customers.read")
      ? db.contact.findMany({
          where: {
            status: "ACTIVE",
            identityScrubbed: false,
            party: {
              organisationId: session.organisationId,
              archived: false,
              identityScrubbed: false,
            },
          },
          select: {
            id: true,
            firstName: true,
            surname: true,
            preferredName: true,
            party: { select: { name: true } },
          },
          orderBy: [{ surname: "asc" }, { firstName: "asc" }],
          take: 200,
        })
      : [],
  ]);
  const unreadEntries = await Promise.all(
    conversations.map(async (conversation) => {
      const mine = conversation.participants.find(
        (person) => person.userId === session.userId,
      );
      const count = await db.chatMessage.count({
        where: {
          organisationId: session.organisationId,
          conversationId: conversation.id,
          authorUserId: { not: session.userId },
          createdAt: { gt: mine?.lastReadAt ?? new Date() },
        },
      });
      return [conversation.id, count] as const;
    }),
  );
  const unreadById = new Map(unreadEntries);
  const ids = [
    ...new Set(
      conversations
        .flatMap((conversation) => [
          conversation.messages[0]?.authorUserId,
          ...conversation.participants.map((person) => person.userId),
        ])
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const linkedContactIds = [
    ...new Set(
      conversations.flatMap((conversation) =>
        conversation.participants
          .map((person) => person.contactId)
          .filter((id): id is string => Boolean(id)),
      ),
    ),
  ];
  const users = ids.length
    ? await db.user.findMany({
        where: {
          id: { in: ids },
          memberships: { some: { organisationId: session.organisationId } },
        },
        select: { id: true, name: true },
      })
    : [];
  const names = new Map(users.map((user) => [user.id, user.name]));
  const linkedContacts =
    can(session, "customers.read") && linkedContactIds.length
      ? await db.contact.findMany({
          where: {
            id: { in: linkedContactIds },
            party: { organisationId: session.organisationId },
          },
          select: {
            id: true,
            firstName: true,
            surname: true,
            preferredName: true,
            party: { select: { name: true } },
          },
        })
      : [];
  for (const contact of linkedContacts)
    names.set(
      `contact:${contact.id}`,
      contact.preferredName || `${contact.firstName} ${contact.surname}`.trim(),
    );
  let thread: Array<{
    id: string;
    authorId: string;
    authorName: string;
    body: string;
    kind: string;
    at: string;
    mine: boolean;
    links: Array<{
      type: string;
      title: string;
      subtitle: string;
      href: string;
    }>;
    task: {
      id: string;
      title: string;
      due: string | null;
      priority: string;
      status: string;
      taskType: string;
      assignee: string;
    } | null;
    meeting: { id: string; title: string; startsAt: string } | null;
  }> = [];
  let hasOlder = false;
  if (activeId) {
    const cursor = before
      ? await db.chatMessage.findFirst({
          where: {
            id: before,
            organisationId: session.organisationId,
            conversationId: activeId,
          },
          select: { id: true, createdAt: true },
        })
      : null;
    if (before && !cursor) throw new Error("That message is not available.");
    const rows = await db.chatMessage.findMany({
      where: {
        organisationId: session.organisationId,
        conversationId: activeId,
        ...(query ? { body: { contains: query, mode: "insensitive" } } : {}),
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 81,
      include: {
        links: { select: { entityType: true, entityId: true } },
        task: {
          select: {
            id: true,
            title: true,
            dueAt: true,
            priority: true,
            status: true,
            taskType: true,
            assigneeUserId: true,
          },
        },
        meeting: { select: { id: true, title: true, startsAt: true } },
      },
    });
    hasOlder = rows.length > 80;
    if (hasOlder) rows.pop();
    const extra = [
      ...new Set(
        rows.flatMap((row) =>
          [row.authorUserId, row.task?.assigneeUserId].filter(
            (id): id is string => Boolean(id),
          ),
        ),
      ),
    ];
    const more = extra.length
      ? await db.user.findMany({
          where: {
            id: { in: extra },
            memberships: { some: { organisationId: session.organisationId } },
          },
          select: { id: true, name: true },
        })
      : [];
    for (const user of more) names.set(user.id, user.name);
    const found = await loadLinks(
      session,
      enabled,
      rows.flatMap((row) =>
        row.links.flatMap((link) =>
          CHAT_LINK_TYPES.includes(link.entityType as ChatLinkType)
            ? [{ type: link.entityType as ChatLinkType, id: link.entityId }]
            : [],
        ),
      ),
    );
    thread = rows.reverse().map((row) => ({
      id: row.id,
      authorId: row.authorUserId,
      authorName: names.get(row.authorUserId) ?? "Former member",
      body: row.body,
      kind: row.kind,
      at: row.createdAt.toISOString(),
      mine: row.authorUserId === session.userId,
      links: row.links.flatMap((link) =>
        CHAT_LINK_TYPES.includes(link.entityType as ChatLinkType)
          ? [present(link.entityType as ChatLinkType, link.entityId, found)]
          : [],
      ),
      task: row.task
        ? {
            id: row.task.id,
            title: row.task.title,
            due: stamp(row.task.dueAt),
            priority: row.task.priority,
            status: row.task.status,
            taskType: row.task.taskType,
            assignee: names.get(row.task.assigneeUserId) ?? "Unassigned",
          }
        : null,
      meeting: row.meeting
        ? {
            id: row.meeting.id,
            title: row.meeting.title,
            startsAt: row.meeting.startsAt.toISOString(),
          }
        : null,
    }));
  }
  const notices = conversations.flatMap((conversation) => {
    const latest = conversation.messages[0];
    if (
      !latest ||
      latest.authorUserId === session.userId ||
      !(unreadById.get(conversation.id) ?? 0)
    )
      return [];
    const title = conversationTitle(
      conversation.kind,
      conversation.participants,
      names,
      session.userId,
    );
    return [
      {
        id: `${conversation.id}:${latest.createdAt.toISOString()}`,
        conversationId: conversation.id,
        title,
        body: latest.body.slice(0, 140),
      },
    ];
  });
  return {
    me: session.userId,
    canWrite: can(session, "core.chat.write"),
    projectsReady: enabled.has("projects"),
    unread: unreadEntries.reduce((sum, [, count]) => sum + count, 0),
    people: people.map((row) => ({
      id: row.user.id,
      name: row.user.name,
      jobTitle: row.user.jobTitle,
    })),
    contacts: contactRows.map((contact) => ({
      id: contact.id,
      name:
        contact.preferredName ||
        `${contact.firstName} ${contact.surname}`.trim(),
      customer: contact.party.name,
    })),
    notices,
    conversations: conversations.map((conversation) => {
      const others = conversation.participants.filter(
        (person) => person.userId && person.userId !== session.userId,
      );
      const latest = conversation.messages[0];
      return {
        id: conversation.id,
        kind: conversation.kind,
        title: conversationTitle(
          conversation.kind,
          conversation.participants,
          names,
          session.userId,
        ),
        peerId:
          conversation.kind === "DIRECT" ? (others[0]?.userId ?? null) : null,
        peerIds: others.flatMap((person) =>
          person.userId ? [person.userId] : [],
        ),
        participants: conversation.participants.flatMap<{
          id: string;
          name: string;
          type: "user" | "contact";
          mine: boolean;
          lastReadAt: string | null;
        }>((person) =>
          person.userId
            ? [
                {
                  id: person.userId,
                  name: names.get(person.userId) ?? "Former member",
                  type: "user" as const,
                  mine: person.userId === session.userId,
                  lastReadAt: stamp(person.lastReadAt),
                },
              ]
            : person.contactId
              ? [
                  {
                    id: person.contactId,
                    name:
                      names.get(`contact:${person.contactId}`) ??
                      "Customer contact",
                    type: "contact" as const,
                    mine: false,
                    lastReadAt: null,
                  },
                ]
              : [],
        ),
        peopleCount: conversation.participants.filter(
          (person) => person.userId || person.contactId,
        ).length,
        preview: latest ? latest.body.slice(0, 90) : "No messages yet",
        at: latest ? latest.createdAt.toISOString() : null,
        unread: unreadById.get(conversation.id) ?? 0,
      };
    }),
    thread,
    history: { hasOlder, oldestId: thread[0]?.id ?? null, query, before },
  };
}
