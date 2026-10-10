export type TaskSource = "projects" | "people";
export type TaskFilter = "open" | "completed" | "all";
export type MyTask = {
  id: string; source: TaskSource; title: string; context: string; kind: string;
  status: string; priority: string; dueAt: string | null; hasAttachments: boolean;
};
export type MyTaskDetail = MyTask & {
  description: string; version: number; editable: boolean; href: string;
  statuses: string[];
  notes: Array<{ id: string; body: string; author: string; at: string }>;
  attachments: Array<{ key: string; title: string; detail: string; href: string | null }>;
  checklist: Array<{ id: string; title: string; done: boolean }>;
};
export type MyTaskPage = {
  items: MyTask[]; hasMore: boolean; openCount: number; completedCount: number;
};
export const taskStatusLabel = (status: string) => ({
  BACKLOG: "Backlog", TODO: "To do", READY: "Ready", IN_PROGRESS: "In progress",
  REVIEW: "In review", WAITING: "Waiting", BLOCKED: "Blocked", DONE: "Completed",
  CANCELLED: "Cancelled",
}[status] ?? status);
export const taskClosed = (status: string) => status === "DONE" || status === "CANCELLED";
