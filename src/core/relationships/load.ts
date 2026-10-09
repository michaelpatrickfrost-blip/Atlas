import { customerRecordRelationships } from "@/core/customers/relationships";
import type { Session } from "@/core/auth/session";
import { getImplementedModules, getModule } from "@/core/modules/registry";
import { enabledModulesForSession } from "@/core/modules/runtime";
import type { RelationshipContext, RecordRef, RecordRelationship } from "./types";

/** Source ownership authorises the record first; each target owner then authorises its links. */
export async function loadRecordRelationships(session: Session, record: RecordRef) {
  const enabled = await enabledModulesForSession(session);
  if (!enabled.has(record.moduleId)) return null;
  let context: RelationshipContext | null | undefined;
  try {
    context = await getModule(record.moduleId)?.recordContextProvider?.(session, record);
  } catch {
    // The record page already authorises its own source; optional navigation must
    // not bring the operational screen down. No contributor runs on this failure.
    return { links: [], unavailable: true, hasMore: false };
  }
  if (!context) return null;
  const providers = getImplementedModules().filter(module => enabled.has(module.id) && module.recordRelationshipProvider);
  const results = await Promise.allSettled([customerRecordRelationships(session, context), ...providers.map(module => module.recordRelationshipProvider!(session, context))]);
  const links = new Map<string, RecordRelationship>();
  let unavailable = false, hasMore = false;
  for (const result of results) {
    if (result.status === "rejected") { unavailable = true; continue; }
    hasMore ||= Boolean(result.value.hasMore);
    for (const link of result.value.links) {
      // Relationship navigation stays within Atlas; never render an injected external link.
      if (!link.href.startsWith("/") || link.href.startsWith("//") || link.href.includes("\\")) continue;
      links.set(`${link.direction}:${link.href}`, link);
    }
  }
  return { links: [...links.values()], unavailable, hasMore };
}
