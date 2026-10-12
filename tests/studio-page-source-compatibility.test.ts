import { describe, expect, it } from "vitest";
import { isAppendOnlyPageSourceExtension } from "@/core/studio/pages/source-compatibility";
import type { PageSourcePolicy } from "@/core/studio/pages/owner-contract";
const columns = [{ id: "status", valueType: "string" as const, nullable: false, classification: "confidential" as const }];
const policy: PageSourcePolicy = { schemaVersion: 1, entity: { id: "tickets.ticket", version: 9 }, accessMode: "ordinary_read", variants: true, fieldSourceVersions: [2, 9],
  nativeFields: [{ id: "status", query: { id: "tickets.header", version: 1 }, columnId: "status" }], queries: [{ query: { id: "tickets.header", version: 1 }, scope: "record", purpose: "fact", columns }],
  facts: [{ id: "status", contract: { id: "tickets.ticket", version: 9 }, query: { id: "tickets.header", version: 1 }, columnId: "status", valueType: "string", nullable: false, classification: "confidential", provenance: "owner_native" }],
  commands: [], metrics: [], surfaces: [{ surface: { id: "tickets.edit", version: 1 }, family: "module", queries: [], formFactors: ["desktop", "phone"] }], maxQueryCost: 12 };
const added = (): PageSourcePolicy => ({ ...structuredClone(policy), queries: [...structuredClone(policy.queries), { query: { id: "tickets.timeline", version: 1 }, scope: "record", purpose: "surface", columns }],
  surfaces: [...structuredClone(policy.surfaces), { surface: { id: "tickets.timeline_panel", version: 1 }, family: "activity", queries: [{ id: "tickets.timeline", version: 1 }], formFactors: ["desktop", "phone"] }], maxQueryCost: 24 });
describe("strictly appended Page owner policy compatibility", () => {
  it("permits equality and appended query/surface metadata only without mutating retained policy", () => {
    const before = JSON.stringify(policy), next = added();
    expect(isAppendOnlyPageSourceExtension(policy, policy)).toBe(true);
    expect(isAppendOnlyPageSourceExtension(policy, next)).toBe(true);
    expect(JSON.stringify(policy)).toBe(before);
    expect(isAppendOnlyPageSourceExtension(next, policy)).toBe(false);
  });
  it.each(["entity", "variants", "fieldSourceVersions", "nativeFields", "facts", "commands"] as const)("rejects %s changes even when additions are otherwise valid", key => {
    const next = added();
    if (key === "entity") next.entity = { ...next.entity, version: 8 };
    else if (key === "variants") next.variants = false;
    else if (key === "fieldSourceVersions") next.fieldSourceVersions = [9, 2];
    else if (key === "nativeFields") next.nativeFields = [];
    else if (key === "facts") next.facts = [];
    else next.commands = [{ command: { id: "tickets.new_command", version: 1 }, confirmation: "required", previewQuery: null, formFactors: ["desktop"] }];
    expect(isAppendOnlyPageSourceExtension(policy, next)).toBe(false);
  });
  it("rejects removals/reordering/replacements/weakening retained columns or surface declarations", () => {
    const attempts = [added(), added(), added(), added(), added(), added()];
    attempts[0].queries.shift(); attempts[1].queries.reverse(); attempts[2].surfaces.reverse();
    attempts[3].queries[0].columns[0].classification = "public_internal";
    attempts[4].surfaces[0].formFactors = ["desktop"];
    attempts[5].queries[0].query.version = 2;
    for (const next of attempts) expect(isAppendOnlyPageSourceExtension(policy, next)).toBe(false);
  });
  it("permits appended metrics while retaining exact ordered old metric declarations", () => {
    const first = added();
    first.metrics = [{ metric: { id: "tickets.first_metric", version: 1 }, query: { id: "tickets.header", version: 1 }, formFactors: ["desktop", "phone"] }];
    const next = structuredClone(first);
    next.metrics.push({ metric: { id: "tickets.second_metric", version: 1 }, query: { id: "tickets.timeline", version: 1 }, formFactors: ["desktop"] });
    expect(isAppendOnlyPageSourceExtension(policy, first)).toBe(true);
    expect(isAppendOnlyPageSourceExtension(first, next)).toBe(true);
    const rejected = [structuredClone(next), structuredClone(next), structuredClone(next), structuredClone(next)];
    rejected[0].metrics.shift(); rejected[1].metrics.reverse();
    rejected[2].metrics[0].query.version = 2; rejected[3].metrics[0].formFactors = ["desktop"];
    for (const changed of rejected) expect(isAppendOnlyPageSourceExtension(first, changed)).toBe(false);
    expect(isAppendOnlyPageSourceExtension(next, first)).toBe(false);
  });
  it("rejects malformed/unknown/duplicate policy and lower or unsafe query budget", () => {
    for (const next of [{ ...added(), maxQueryCost: 11 }, { ...added(), maxQueryCost: 65 }, { ...added(), schemaVersion: 2 }, { ...added(), privileged: true }, { ...added(), accessMode: "native_validation" }, { ...added(), queries: [...policy.queries, ...policy.queries] }, null])
      expect(isAppendOnlyPageSourceExtension(policy, next)).toBe(false);
  });
});
