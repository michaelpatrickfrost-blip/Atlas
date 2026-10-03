import type { Session } from "@/core/auth/session";
import type { AttentionItem } from "@/core/modules/types";
import { getNavigableModules } from "@/core/modules/runtime";

/**
 * Collects "needs your attention" items from every enabled, accessible module.
 * Home renders the result directly — it holds no module-specific business logic,
 * only this aggregation. See docs/MODULE_SPEC.md §Attention.
 */
export async function getAttentionItems(session: Session): Promise<AttentionItem[]> {
  const modules = await getNavigableModules(session);
  const results = await Promise.all(
    modules
      .filter((module) => module.attentionProvider)
      .map((module) => module.attentionProvider!({ organisationId: session.organisationId, session })),
  );
  return results.flat();
}
