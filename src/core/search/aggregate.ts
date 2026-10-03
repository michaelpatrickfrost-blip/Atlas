import type { Session } from "@/core/auth/session";
import type { SearchResult } from "@/core/modules/types";
import { getNavigableModules, getModuleNavigation } from "@/core/modules/runtime";

/**
 * Powers the ⌘K command palette. Combines static navigation matches with each
 * enabled module's own searchProvider. Honest about scope today: no natural-language
 * commands, just navigation + entity search — the architecture (typed providers
 * per module) is what's built to extend into that later.
 */
export async function searchAtlas(session: Session, query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const modules = await getNavigableModules(session);

  const navigationMatches: SearchResult[] = modules.flatMap((module) => {
    const items = getModuleNavigation(module, session);
    return items
      .filter((item) => item.label.toLowerCase().includes(trimmed.toLowerCase()))
      .map((item) => ({
        id: `nav:${module.id}:${item.href}`,
        title: item.label,
        subtitle: module.name,
        href: item.href,
        group: "Navigation",
      }));
  });

  const providerResults = await Promise.all(
    modules
      .filter((module) => module.searchProvider)
      .map((module) => module.searchProvider!({ organisationId: session.organisationId, session, query: trimmed })),
  );

  return [...navigationMatches, ...providerResults.flat()].slice(0, 20);
}
