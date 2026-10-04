export type TimelineItem = {
  id: string;
  title: string;
  kind: "goal" | "initiative" | "action";
  start: string | null;
  end: string | null;
  status: string;
  detail: string;
};

export function pointOnWindow(startIso: string, endIso: string, fraction: number) {
  const start = Date.parse(`${startIso.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${endIso.slice(0, 10)}T00:00:00Z`);
  const at = start + (end - start) * Math.min(1, Math.max(0, fraction));
  return new Date(at).toISOString().slice(0, 10);
}

export function timelineLayout(periodStart: string, periodEnd: string, items: TimelineItem[], today = new Date()) {
  const start = Date.parse(`${periodStart.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${periodEnd.slice(0, 10)}T00:00:00Z`);
  const span = Math.max(end - start, 86_400_000);
  const months: string[] = [];
  const cursor = new Date(start);
  cursor.setUTCDate(1);
  while (cursor.getTime() <= end && months.length < 36) {
    months.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  const bars = items.flatMap((item) => {
    if (!item.start && !item.end) return [];
    const a = Date.parse(`${(item.start ?? item.end)!.slice(0, 10)}T00:00:00Z`);
    const b = Date.parse(`${(item.end ?? item.start)!.slice(0, 10)}T00:00:00Z`);
    const from = Math.min(a, b);
    const to = Math.max(a, b, from + 86_400_000);
    const left = Math.min(98, Math.max(0, ((from - start) / span) * 100));
    const width = Math.min(100 - left, Math.max(1.5, ((to - from) / span) * 100));
    const overdue = item.status !== "done" && item.end != null && Date.parse(`${item.end.slice(0, 10)}T00:00:00Z`) < Date.parse(`${today.toISOString().slice(0, 10)}T00:00:00Z`);
    return [{ ...item, left, width, overdue }];
  });
  const todayMs = Date.parse(`${today.toISOString().slice(0, 10)}T00:00:00Z`);
  const marker = todayMs >= start && todayMs <= end ? ((todayMs - start) / span) * 100 : null;
  return { months, bars, marker };
}
