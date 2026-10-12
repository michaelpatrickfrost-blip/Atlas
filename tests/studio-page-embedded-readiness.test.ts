import { afterEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import type { Session } from "@/core/auth/session";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { ticketPageContract, ticketPageSurfacePolicy, ticketPageEmbeddedPolicy } from "@/core/service-work/studio-pages";
import { salesStudioContract } from "@/modules/sales/services/studio";
import { salesOrderPageContract, salesOrderMetricPagePolicy, salesOrderEmbeddedPagePolicy } from "@/modules/sales/services/studio-pages";
import { analyticsBusinessViewContract } from "@/modules/analytics/services/studio-view";
import { resolveAuthoringPageSource } from "@/core/studio/pages/definition-compiler";
import { isAppendOnlyPageSourceExtension } from "@/core/studio/pages/source-compatibility";
import { checksum } from "@/core/studio/registry/contracts";
import { studioRuntimeFeaturesForCompiledDefinition, STUDIO_PAGE_EMBEDDED_VIEW_FEATURE as EMBED,
  STUDIO_TICKET_PANEL_FEATURE as PANELS, STUDIO_SALES_PAGE_METRIC_FEATURE as METRICS } from "@/core/studio/runtime-features";
import { publishCompiledDefinitionInTransaction } from "@/core/studio/definitions/publication";
import { activateCompiledVersionInTransaction } from "@/core/studio/definitions/activation";
const m = vi.hoisted(() => ({ enabled: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
vi.mock("@/core/studio/runtime-features", async original => {
  const actual = await original<typeof import("@/core/studio/runtime-features")>();
  return { ...actual, isStudioRuntimeFeatureEnabled: m.enabled, assertStudioRuntimeFeatureEnabled: (feature: string) => {
    if (!m.enabled(feature)) throw new Error("STUDIO_RUNTIME_FEATURE_UNAVAILABLE");
  } };
});
afterEach(() => vi.clearAllMocks());
function setup() {
  const registry = new CapabilityRegistry(async () => true);
  registry.register("analytics", analyticsBusinessViewContract);
  registry.register("sales", { contributions: [...salesStudioContract.contributions, ...salesOrderPageContract.contributions] });
  registry.register("tickets", { contributions: [...ticketStudioContract.contributions, ...ticketPageContract.contributions] });
  const exact = (id: string, version: number) => { const entry = registry.describe(id, version); return { id, version, schemaHash: entry.schemaHash, contractHash: entry.contractHash }; };
  // Selection is metadata-only; this fixture intentionally grants no data or
  // authoring authority and never exercises a business reader/provider.
  const authority = { registry } as FieldRuntimeAuthority;
  return { registry, exact, authority };
}
describe("owner-approved immutable Analytics Page family", () => {
  it.each(["tickets", "sales"]) ("%s @3 appends only finite View opt-in and keeps all retained policies/hashes", owner => {
    const f = setup(), id = owner === "tickets" ? "tickets.ticket.page" : "sales.order.page";
    const old = owner === "tickets" ? ticketPageSurfacePolicy : salesOrderMetricPagePolicy;
    const next = owner === "tickets" ? ticketPageEmbeddedPolicy : salesOrderEmbeddedPagePolicy;
    expect(next).toEqual({ ...old, embeddedViewSources: [{ id: "analytics.dashboard.view", version: 1 }], maxQueryCost: 64 });
    expect(isAppendOnlyPageSourceExtension(old, next)).toBe(true);
    expect(isAppendOnlyPageSourceExtension(next, old)).toBe(false);
    expect(f.registry.describe(id, 2).schemaHash).toBe(checksum(old));
    expect(f.registry.describe(id, 3).schemaHash).toBe(checksum(next));
    for (const version of [1, 2]) {
      const contribution = (owner === "tickets" ? ticketPageContract : salesOrderPageContract).contributions.find(item => item.metadata.id === id && item.metadata.version === version)!;
      expect(f.registry.describePageSource(f.exact(id, version)).policy).toEqual(contribution.metadata.details.pageSource);
      expect(f.registry.describe(id, version).schemaHash).toBe(contribution.metadata.schemaHash);
    }
  });
  it.each(["tickets", "sales"]) ("%s authoring uses @3/@2/@1 only under the exact paired-reader families", owner => {
    const f = setup(), page = owner === "tickets" ? "tickets.ticket.page" : "sales.order.page";
    const entity = owner === "tickets" ? f.exact("tickets.ticket", 9) : f.exact("sales.order", 1);
    const family = owner === "tickets" ? PANELS : METRICS;
    for (const [features, version] of [[[], 1], [[EMBED], 1], [[family], 2], [[EMBED, family], 3]] as const) {
      m.enabled.mockImplementation(feature => (features as readonly string[]).includes(feature));
      expect(resolveAuthoringPageSource(f.authority, entity).metadata).toMatchObject({ id: page, version });
    }
    // Fallback changes only authoring selection. Exact persisted @3 remains @3.
    m.enabled.mockReturnValue(false);
    expect(f.registry.describePageSource(f.exact(page, 3)).metadata.version).toBe(3);
  });
  it.each(["tickets", "sales"]) ("%s sealed @3 requires embedded and predecessor family even without View nodes", owner => {
    const f = setup(), id = owner === "tickets" ? "tickets.ticket.page" : "sales.order.page";
    const family = owner === "tickets" ? PANELS : METRICS;
    const sourcePage = { ...f.registry.describe(id, 3), kind: "surface" };
    const plan = { kind: "page", schemaVersion: 1, approvals: { sourcePage } };
    expect(studioRuntimeFeaturesForCompiledDefinition("page", { sections: [] }, plan)).toEqual(["structuredPages.v1", family, EMBED]);
    expect(studioRuntimeFeaturesForCompiledDefinition("page", {}, { ...plan, approvals: { sourcePage: { ...sourcePage, version: 2 } } })).toEqual(["structuredPages.v1", family]);
    expect(() => studioRuntimeFeaturesForCompiledDefinition("page", {}, { ...plan, approvals: { sourcePage: { ...sourcePage, ownerModuleId: "foreign" } } })).toThrow("INVALID");
  });
  it("original publication and shared activation close @3 before every effect while either reader family is unavailable", async () => {
    const f = setup(), metadata = f.registry.describe("sales.order.page", 3);
    const plan = { kind: "page", schemaVersion: 1, approvals: { sourcePage: metadata } };
    const compiled = { payload: { schemaVersion: 1, sections: [] }, plan, checksum: checksum(plan), warnings: [] };
    const effect = vi.fn(), tx = new Proxy({}, { get() { effect(); throw new Error("No transaction effect permitted"); } }) as Prisma.TransactionClient;
    const session = { userId: "actor", organisationId: "company", capabilities: new Set(["studio.definition.publish"]) } as Session;
    const version = { id: "10000000-0000-4000-8000-000000000002", definitionId: "10000000-0000-4000-8000-000000000001", organisationId: "company", version: 1, compiledPlan: plan, checksum: compiled.checksum };
    for (const features of [[], ["structuredPages.v1", METRICS], ["structuredPages.v1", EMBED]]) {
      m.enabled.mockImplementation(feature => features.includes(feature));
      await expect(publishCompiledDefinitionInTransaction(tx, session, { definitionId: version.definitionId, organisationId: "company", revision: 0, definition: { id: version.definitionId, kind: "page", organisationId: "company", latestVersion: 0 } } as never, 0, compiled as never)).rejects.toThrow("UNAVAILABLE");
      await expect(activateCompiledVersionInTransaction(tx, session, version.definitionId, 0, version as never, compiled as never)).rejects.toThrow("UNAVAILABLE");
    }
    expect(effect).not.toHaveBeenCalled();
  });
});
