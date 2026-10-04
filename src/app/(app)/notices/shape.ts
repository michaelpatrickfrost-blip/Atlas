export type Notice = {
  id: string;
  group: "Tagged" | "Assigned" | "Messages";
  title: string;
  detail: string;
  href: string | null;
  conversationId?: string;
};

const WORK_KINDS = ["task", "meeting", "activity", "case", "appraisal", "one-to-one", "hr-task"] as const;

export function noticeKind(id: string): "echo" | "inbox" | "chat" | "work" | null {
  if (/^chat:[A-Za-z0-9]+$/.test(id)) return "chat";
  if (/^echo:[A-Za-z0-9]+$/.test(id)) return "echo";
  if (/^inbox:[A-Za-z0-9]+$/.test(id)) return "inbox";
  if (new RegExp(`^work:(${WORK_KINDS.join("|")}):[A-Za-z0-9]+$`).test(id)) return "work";
  return null;
}

export function taskIdFromNotice(id: string): string | null {
  return /^work:task:([A-Za-z0-9]+)$/.exec(id)?.[1] ?? null;
}

/** An open task already listed as an inbox assignment should not appear twice. */
export function hideTasksAlreadyListed(taskIds: ReadonlySet<string>, items: Notice[]): Notice[] {
  return items.filter((item) => {
    const taskId = taskIdFromNotice(item.id);
    return !taskId || !taskIds.has(taskId);
  });
}
