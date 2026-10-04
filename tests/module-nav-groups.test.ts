import { describe, expect, it } from "vitest";

type ModuleNavItem = { label: string; href: string; group?: string };

type Entry = { kind: "item"; item: ModuleNavItem } | { kind: "group"; label: string; items: ModuleNavItem[] };

function toEntries(items: ModuleNavItem[]): Entry[] {
  const entries: Entry[] = [];
  const groupIndex = new Map<string, number>();
  for (const item of items) {
    if (!item.group) { entries.push({ kind: "item", item }); continue; }
    const at = groupIndex.get(item.group);
    if (at === undefined) { groupIndex.set(item.group, entries.length); entries.push({ kind: "group", label: item.group, items: [item] }); }
    else { const entry = entries[at]; if (entry.kind === "group") entry.items.push(item); }
  }
  return entries;
}

describe("module nav groups", () => {
  it("keeps ungrouped tabs and merges HR sections", () => {
    const entries = toEntries([
      { label: "My HR", href: "/people/me" },
      { label: "Holidays", href: "/people/holidays", group: "My work" },
      { label: "Timesheets", href: "/people/timesheets", group: "My work" },
      { label: "Employees", href: "/people", group: "People" },
    ]);
    expect(entries).toEqual([
      { kind: "item", item: { label: "My HR", href: "/people/me" } },
      { kind: "group", label: "My work", items: [
        { label: "Holidays", href: "/people/holidays", group: "My work" },
        { label: "Timesheets", href: "/people/timesheets", group: "My work" },
      ] },
      { kind: "group", label: "People", items: [{ label: "Employees", href: "/people", group: "People" }] },
    ]);
  });
});
