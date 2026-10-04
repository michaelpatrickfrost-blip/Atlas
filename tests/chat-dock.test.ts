import { beforeEach, describe, expect, it, vi } from "vitest";
import { conversationKey, directKey, linkSelection, messageBody } from "@/core/chat/policy";
import { modelScope } from "@/server/data-api/read-policy";
import type { Session } from "@/core/auth/session";

const state = vi.hoisted(() => ({
  session: { userId: "user-a", userName: "Ada", userEmail: "ada@example.com", organisationId: "org-a", organisationName: "Northbridge", membershipId: "member-a", capabilities: new Set<string>(["core.chat.read", "core.chat.write"]) },
  enabled: new Set(["projects"]),
  db: {
    membership: { findFirst: vi.fn(), findMany: vi.fn() },
    chatConversation: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    salesOrder: { findMany: vi.fn() },
    quote: { findMany: vi.fn() },
    party: { findMany: vi.fn() },
    project: { findMany: vi.fn() },
    product: { findMany: vi.fn() },
    contact: { findMany: vi.fn() },
    chatParticipant: { upsert: vi.fn(), updateMany: vi.fn() },
    chatMessage: { create: vi.fn(), count: vi.fn(), findMany: vi.fn() },
    projectTask: { create: vi.fn() },
    projectInboxItem: { create: vi.fn() },
    meeting: { create: vi.fn() },
    auditEntry: { create: vi.fn() },
    user: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/core/auth/session", () => ({ requireSession: vi.fn(async () => state.session) }));
vi.mock("@/core/db/client", () => ({ db: state.db }));
vi.mock("@/core/modules/runtime", () => ({ getEnabledModuleIds: vi.fn(async () => state.enabled) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { openChat, openDirectChat, postMessage, sendChat } from "@/app/(app)/chat/actions";

beforeEach(() => {
  vi.clearAllMocks();
  state.session.capabilities = new Set(["core.chat.read", "core.chat.write"]);
  state.enabled = new Set(["projects"]);
  state.db.$transaction.mockImplementation(async (fn: (tx: typeof state.db) => Promise<void>) => fn(state.db));
  state.db.membership.findFirst.mockResolvedValue({ id: "member-b" });
});

describe("chat dock policy", () => {
  it("builds one direct key regardless of who starts the conversation", () => {
    expect(directKey("user-b", "user-a")).toBe("user-a|user-b");
    expect(directKey("user-a", "user-b")).toBe(directKey("user-b", "user-a"));
    expect(() => directKey("user-a", "user-a")).toThrow("another person");
    expect(conversationKey(["user-c", "user-a", "user-b"])).toEqual({ key: "user-a|user-b|user-c", kind: "GROUP", userIds: ["user-a", "user-b", "user-c"], contactIds: [] });
    expect(conversationKey(["user-a"], ["contact-b", "contact-a"]).key).toBe("u:user-a|c:contact-a|c:contact-b");
    expect(conversationKey(["user-b", "user-a"]).kind).toBe("DIRECT");
    expect(() => conversationKey(["user-a"])).toThrow("at least one other person");
    expect(linkSelection([{ type: "SALES_ORDER", id: "order-1" }])).toEqual([{ type: "SALES_ORDER", id: "order-1" }]);
    expect(() => linkSelection([{ type: "COMPANY", id: "x" }])).toThrow("Choose a record");
    expect(messageBody("  Hello  ")).toBe("Hello");
    expect(() => messageBody("   ")).toThrow("1 and 4,000");
  });

  it("hides direct messages from people who are not in them", () => {
    const session = { ...state.session, capabilities: new Set(["core.chat.read"]) } as Session;
    expect(modelScope(session, "ChatConversation")).toEqual({
      organisationId: "org-a",
      kind: { in: ["DIRECT", "GROUP"] },
      participants: { some: { organisationId: "org-a", userId: "user-a" } },
    });
    expect(modelScope(session, "ChatMessage")).toEqual({
      organisationId: "org-a",
      conversation: { organisationId: "org-a", kind: { in: ["DIRECT", "GROUP"] }, participants: { some: { organisationId: "org-a", userId: "user-a" } } },
    });
  });
});

describe("chat contact and work", () => {
  it("refuses a direct chat with someone outside the company", async () => {
    state.db.membership.findFirst.mockResolvedValue(null);
    await expect(openDirectChat("outsider")).rejects.toThrow("active member");
    expect(state.db.chatConversation.create).not.toHaveBeenCalled();
  });

  it("refuses a customer contact from outside this company", async () => {
    state.session.capabilities.add("customers.read");
    state.db.contact.findMany.mockResolvedValue([]);
    await expect(openChat([], ["foreign-contact"])).rejects.toThrow("contact from this company");
    expect(state.db.chatConversation.create).not.toHaveBeenCalled();
  });

  it("opens one chat for several people and refuses a company broadcast", async () => {
    state.db.chatConversation.findFirst.mockResolvedValue(null);
    state.db.chatConversation.create.mockResolvedValue({ id: "group-1" });
    await expect(openChat(["user-b", "user-c"])).resolves.toEqual({ conversationId: "group-1" });
    expect(state.db.chatConversation.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ organisationId: "org-a", kind: "GROUP", directKey: "user-a|user-b|user-c" }),
    }));
    const form = new FormData();
    form.set("body", "Everyone");
    await expect(postMessage(form)).rejects.toThrow("Company messages are turned off");
    expect(state.db.chatMessage.create).not.toHaveBeenCalled();
  });

  it("attaches an order the sender can read and refuses one they cannot", async () => {
    state.enabled = new Set(["projects", "sales"]);
    state.session.capabilities.add("sales.order.read");
    state.db.chatConversation.findFirst.mockResolvedValue({ id: "direct-1", kind: "DIRECT", organisationId: "org-a", participants: [{ userId: "user-a" }, { userId: "user-b" }] });
    state.db.salesOrder.findMany.mockResolvedValueOnce([]);
    await expect(sendChat({ conversationId: "direct-1", body: "See this", links: [{ type: "SALES_ORDER", id: "hidden-order" }] })).rejects.toThrow("not available to attach");
    expect(state.db.chatMessage.create).not.toHaveBeenCalled();
    state.db.salesOrder.findMany.mockResolvedValueOnce([{ id: "order-1", reference: "SO-1", party: { name: "Northbridge" } }]);
    await sendChat({ conversationId: "direct-1", body: "See SO-1", links: [{ type: "SALES_ORDER", id: "order-1" }] });
    expect(state.db.chatMessage.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ conversationId: "direct-1", links: { create: [{ organisationId: "org-a", entityType: "SALES_ORDER", entityId: "order-1" }] } }),
    }));
  });

  it("creates a private task for a company member and posts it in the conversation", async () => {
    state.db.chatConversation.findFirst.mockResolvedValue({ id: "direct-1", kind: "DIRECT", organisationId: "org-a", participants: [{ userId: "user-a" }, { userId: "user-b" }] });
    state.db.projectTask.create.mockResolvedValue({ id: "task-1", title: "Call the customer" });
    await sendChat({ conversationId: "direct-1", body: "Call the customer", kind: "TASK", assigneeUserId: "user-b", taskType: "FOLLOW_UP", priority: "HIGH" });
    expect(state.db.membership.findFirst).toHaveBeenCalledWith({ where: { organisationId: "org-a", userId: "user-b", active: true } });
    expect(state.db.projectTask.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ organisationId: "org-a", assigneeUserId: "user-b", creatorUserId: "user-a", visibility: "PRIVATE", taskType: "FOLLOW_UP", priority: "HIGH" }),
    }));
    expect(state.db.projectInboxItem.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: "user-b", taskId: "task-1", kind: "ASSIGNMENT" }) }));
    expect(state.db.chatMessage.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organisationId: "org-a", conversationId: "direct-1", kind: "TASK", taskId: "task-1" }) }));
  });

  it("does not assign work or post into a conversation from another company", async () => {
    state.db.chatConversation.findFirst.mockResolvedValue(null);
    await expect(sendChat({ conversationId: "foreign", body: "Secret", kind: "TASK", assigneeUserId: "user-b" })).rejects.toThrow("not available");
    expect(state.db.projectTask.create).not.toHaveBeenCalled();
    expect(state.db.chatMessage.create).not.toHaveBeenCalled();
  });

  it("requires Projects before creating a meeting from chat", async () => {
    state.enabled = new Set();
    state.db.chatConversation.findFirst.mockResolvedValue({ id: "company", kind: "COMPANY", organisationId: "org-a", participants: [{ userId: "user-a" }] });
    await expect(sendChat({ conversationId: "company", body: "Planning", kind: "MEETING", startsAt: "2026-10-04T09:00:00.000Z" })).rejects.toThrow("Turn on Projects");
    expect(state.db.meeting.create).not.toHaveBeenCalled();
  });
});
