export const CHAT_MESSAGE_KINDS = ["TEXT", "NOTE", "TASK", "MEETING"] as const;
export type ChatMessageKind = (typeof CHAT_MESSAGE_KINDS)[number];
export const CHAT_TASK_TYPES = ["TASK", "FOLLOW_UP", "REQUEST"] as const;
export const CHAT_LINK_TYPES = ["SALES_ORDER", "QUOTE", "CUSTOMER", "PROJECT", "PRODUCT"] as const;
export type ChatLinkType = (typeof CHAT_LINK_TYPES)[number];

export function directKey(left: string, right: string) {
  if (!left || !right || left === right) throw new Error("Choose another person in this company.");
  return [left, right].sort().join("|");
}

export function conversationKey(userIds: string[], contactIds: string[] = []) {
  const users = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))].sort();
  const contacts = [...new Set(contactIds.map((id) => id.trim()).filter(Boolean))].sort();
  if (contacts.length) {
    const parts = [...users.map((id) => `u:${id}`), ...contacts.map((id) => `c:${id}`)];
    if (!users.length || parts.length < 2) throw new Error("Choose at least one other person.");
    if (parts.length > 12) throw new Error("A chat can include up to 12 people.");
    return { key: parts.join("|"), kind: parts.length === 2 ? "DIRECT" as const : "GROUP" as const, userIds: users, contactIds: contacts };
  }
  if (users.length < 2) throw new Error("Choose at least one other person.");
  if (users.length > 12) throw new Error("A chat can include up to 12 people.");
  return { key: users.join("|"), kind: users.length === 2 ? "DIRECT" as const : "GROUP" as const, userIds: users, contactIds: contacts };
}

export function linkSelection(value: unknown) {
  if (value == null) return [] as Array<{ type: ChatLinkType; id: string }>;
  if (!Array.isArray(value)) throw new Error("Choose records to attach.");
  if (value.length > 8) throw new Error("Attach up to 8 records.");
  const seen = new Set<string>();
  return value.map((item) => {
    const type = String(item && typeof item === "object" ? (item as { type?: unknown }).type ?? "" : "");
    const id = String(item && typeof item === "object" ? (item as { id?: unknown }).id ?? "" : "").trim();
    if (!CHAT_LINK_TYPES.includes(type as ChatLinkType) || !id || id.length > 80) throw new Error("Choose a record to attach.");
    const token = `${type}:${id}`;
    if (seen.has(token)) throw new Error("That record is already attached.");
    seen.add(token);
    return { type: type as ChatLinkType, id };
  });
}

export function messageBody(value: unknown) {
  const body = String(value ?? "").trim();
  if (!body || body.length > 4000) throw new Error("Write a message between 1 and 4,000 characters.");
  return body;
}
