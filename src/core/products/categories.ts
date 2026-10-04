export const CATEGORY_CLASSES = [
  { id: "FINISHED", label: "Finished goods", detail: "What you sell or ship." },
  { id: "RAW", label: "Materials", detail: "Bought parts that go onto a bill of materials." },
  { id: "WIP", label: "Work in progress", detail: "Intermediates you make, hold in stock, and use in other products." },
  { id: "PACKAGING", label: "Packaging", detail: "Packs, labels and other materials used to ship." },
  { id: "SERVICE", label: "Services", detail: "Sold work. It has a price, not a manufacturing bill." },
  { id: "OTHER", label: "Other", detail: "A group that does not fit the ones above." },
] as const;

export type CategoryClass = (typeof CATEGORY_CLASSES)[number]["id"];

export const STARTER_CATEGORIES: Array<{ code: string; name: string; itemClass: CategoryClass; description: string }> = [
  { code: "FINISHED", name: "Finished goods", itemClass: "FINISHED", description: "Products you sell. The bill lists materials and work in progress." },
  { code: "MATERIAL", name: "Materials", itemClass: "RAW", description: "Bought parts. They usually have no bill of their own." },
  { code: "WIP", name: "Work in progress", itemClass: "WIP", description: "Intermediates you make, hold, and consume on a later bill." },
  { code: "PACKAGING", name: "Packaging", itemClass: "PACKAGING", description: "Cartons, labels and packs that go on a bill." },
  { code: "SERVICE", name: "Services", itemClass: "SERVICE", description: "Sold work. No stock and no manufacturing bill." },
];

export function categoryClass(value: string): CategoryClass {
  const found = CATEGORY_CLASSES.find((item) => item.id === value);
  if (!found) throw new Error("Choose a class: finished goods, materials, work in progress, packaging, services or other.");
  return found.id;
}

/** An explicit class wins. A blank choice uses the category's class. */
export function productClassChoice(requested: string, fromCategory: string | null | undefined): CategoryClass {
  const chosen = requested.trim();
  if (chosen) return categoryClass(chosen);
  if (fromCategory && CATEGORY_CLASSES.some((item) => item.id === fromCategory)) return fromCategory as CategoryClass;
  return "OTHER";
}

export function cleanCategoryCode(value: string) {
  const code = value.trim().slice(0, 60);
  if (!code) throw new Error("Enter a category code.");
  if (!/^[\w .&/-]+$/.test(code)) throw new Error("Use letters, numbers and spaces in the category code.");
  return code;
}

export function categoryLabel(itemClass: string) {
  return CATEGORY_CLASSES.find((item) => item.id === itemClass)?.label ?? "Other";
}

/** A category cannot sit under itself, including through a longer chain. */
export function categoryParentOk(rows: Array<{ id: string; parentId: string | null }>, id: string | null, parentId: string | null) {
  if (!parentId) return true;
  if (parentId === id) return false;
  const parents = new Map(rows.map((row) => [row.id, row.parentId]));
  const seen = new Set<string>();
  let cursor: string | null = parentId;
  while (cursor) {
    if (cursor === id || seen.has(cursor)) return false;
    seen.add(cursor);
    cursor = parents.get(cursor) ?? null;
  }
  return parents.has(parentId) || rows.some((row) => row.id === parentId);
}
