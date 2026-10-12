import { checksum } from "../registry/contracts";
import { pageSourcePolicySchema } from "./owner-contract";

/** Strictly additive owner query/surface/metric and explicit View opt-in release. Retained pages keep their exact
 * old policy/queries/grants/budget; the registry still requires CURRENT owning
 * capability/module/lifecycle and invokes fresh current callbacks. This never
 * supports a removed/reordered/replaced query, surface or metric, a new field/fact/command
 * in an old policy, a changed entity or a weakened classification. */
export function isAppendOnlyPageSourceExtension(retained: unknown, current: unknown): boolean {
  const before = pageSourcePolicySchema.safeParse(retained), after = pageSourcePolicySchema.safeParse(current);
  if (!before.success || !after.success) return false;
  const old = before.data, next = after.data;
  if (next.maxQueryCost < old.maxQueryCost || next.queries.length < old.queries.length || next.surfaces.length < old.surfaces.length || next.metrics.length < old.metrics.length) return false;
  for (const key of ["queries", "surfaces", "metrics"] as const)
    if (old[key].some((value, index) => checksum(value) !== checksum(next[key][index]))) return false;
  if (old.embeddedViewSources !== undefined && next.embeddedViewSources === undefined) return false;
  const retainedSources = old.embeddedViewSources ?? [], nextSources = next.embeddedViewSources ?? [];
  if (nextSources.length < retainedSources.length || retainedSources.some((value, index) => checksum(value) !== checksum(nextSources[index]))) return false;
  const comparable = { ...next };
  // An absent historical opt-in stays absent in its reconstructed exact policy.
  if (old.embeddedViewSources === undefined) delete comparable.embeddedViewSources;
  else comparable.embeddedViewSources = old.embeddedViewSources;
  return checksum(old) === checksum({ ...comparable, queries: old.queries, surfaces: old.surfaces, metrics: old.metrics, maxQueryCost: old.maxQueryCost });
}
