import type { Session } from "@/core/auth/session";
import type { AttentionItem } from "@/core/modules/types";
import { getNavigableModules } from "@/core/modules/runtime";
import { getCustomerAttentionItems } from "@/core/customers/attention";

/**
 * Collects "needs your attention" items from Core (Customer Master) and every
 * enabled, accessible module. Home renders the result directly — it holds no
 * module-specific business logic, only this aggregation. See
 * docs/MODULE_SPEC.md §Attention.
 */
export async function getAttentionOverview(session: Session) {
  const modules = await getNavigableModules(session);
  const sources = [
    { name: "Customers", read: () => getCustomerAttentionItems(session) },
    ...modules.filter(module => module.attentionProvider).map(module => ({
      name: module.name,
      read: () => module.attentionProvider!({ organisationId: session.organisationId, session }),
    })),
  ];
  const results = await Promise.allSettled(sources.map(source => Promise.resolve().then(source.read)));
  const items: Array<AttentionItem & { source: string }> = [];
  let unavailableSources = 0;
  results.forEach((result, index) => {
    if (result.status === "rejected") { unavailableSources++; return; }
    items.push(...result.value.map(item => ({ ...item, source: sources[index].name })));
  });
  const priority = { critical: 0, warning: 1, info: 2 };
  items.sort((left, right) => priority[left.severity] - priority[right.severity] || left.source.localeCompare(right.source) || left.label.localeCompare(right.label));
  const unique = new Map<string, typeof items[number]>();
  for (const item of items) {
    const key = `${item.href}:${item.label}`;
    if (!unique.has(key)) unique.set(key, item);
  }
  return { items: [...unique.values()], unavailableSources };
}

/** Compatibility for consumers that only need the items; Home uses source health too. */
export async function getAttentionItems(session: Session): Promise<AttentionItem[]> {
  return (await getAttentionOverview(session)).items;
}
