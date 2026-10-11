import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
const mock = vi.hoisted(() => ({ membership: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: mock.membership } } }));
import { sessionForUser, sessionAuthorityStamp, type Session } from "@/core/auth/session";
import { checksum, entity, query, declarative } from "@/core/studio/registry/contracts";
import { pageSource } from "@/core/studio/registry/page-contracts";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { pageProjectionSchema, pageQueryOutputSchema, pageSourcePolicySchema, type PageSourcePolicy, type PageSourceCallbacks, type PageQueryOutput } from "@/core/studio/pages/owner-contract";
import type { Contribution } from "@/core/studio/registry/types";

// Genuine opaque Session and real factories/registry; owner callbacks and shared
// transaction are explicit unit collaborators. No SQL/private-row/SSI/live proof.
const base = { version: 1, label: "Orders", capability: "example.order.read", lifecycle: "active" as const, classification: "confidential" as const };
const tx = {} as Prisma.TransactionClient;
const record = { kind: "record" as const, recordId: "order" };
const queryRef = { id: "example.order.page_get", version: 1 };
const column = { id: "subject", valueType: "string" as const, nullable: false, classification: "confidential" as const };
const policy = (): PageSourcePolicy => ({ schemaVersion: 1, entity: { id: "example.order", version: 1 }, accessMode: "ordinary_read", variants: false,
  nativeFields: [{ id: "subject", query: queryRef, columnId: "subject" }],
  queries: [{ query: queryRef, scope: "record", purpose: "fact", columns: [structuredClone(column)] }],
  facts: [], commands: [], metrics: [], surfaces: [], maxQueryCost: 24 });
const membership = () => ({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 2, active: true,
  grantedCapabilities: [base.capability], deniedCapabilities: [] as string[], roles: [],
  user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
  organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
beforeEach(() => { vi.resetAllMocks(); mock.membership.mockImplementation(async () => membership()); });
async function actor(grants = [base.capability]) {
  mock.membership.mockResolvedValueOnce({ ...membership(), grantedCapabilities: grants });
  const session = await sessionForUser("company", "actor"); if (!session) throw new Error("No actor."); return session;
}
function setup(overrides: Partial<PageSourcePolicy> = {}, callbacksOverride: Partial<PageSourceCallbacks> = {}) {
  const run = vi.fn<() => Promise<PageQueryOutput>>(async () => ({ rows: [{ id: "order", values: { subject: "Order" } }], nextCursor: null }));
  const callbacks: PageSourceCallbacks = {
    authoriseRead: vi.fn<PageSourceCallbacks["authoriseRead"]>(async (ctx, request) => {
      if (!sessionAuthorityStamp(ctx.session) || ctx.transaction !== tx) throw new Error("Invalid owner context.");
      return request.kind === "list" ? { kind: "list", organisationId: ctx.session.organisationId }
        : { kind: "record", organisationId: ctx.session.organisationId, recordId: request.recordId, revision: "v4:2026-10-11T01:02:03Z" };
    }),
    bindQueryInput: vi.fn(async (_ctx, anchor) => { if (anchor.kind !== "record") throw new Error("Record required."); return { id: anchor.recordId }; }),
    projectQueryOutput: vi.fn(async (_ctx, _anchor, _request, output) => pageQueryOutputSchema.parse(output)),
    ...callbacksOverride,
  };
  const owner = pageSource({ ...base, id: "example.order.page", policy: { ...policy(), ...overrides }, callbacks });
  const sources = [entity({ ...base, kind: "entity", id: "example.order", key: "string",
    fields: [{ id: "subject", type: "string", nullable: false, classification: "confidential", filterable: true, sortable: false, decision: false, template: false }],
    extensionPolicy: { customFields: false, recordTypes: false, pageVariants: false } }),
    query({ ...base, kind: "query", ...queryRef, pagination: "none", maxCardinality: 1, costClass: "low", transaction: "required",
      input: z.strictObject({ id: z.string() }), output: pageProjectionSchema((overrides.queries ?? policy().queries)[0].columns, 1), execute: run })];
  const available = vi.fn(async () => true), registry = new CapabilityRegistry(available);
  registry.register("example", { contributions: [...sources, owner] });
  return { registry, available, callbacks, run, sources, owner, reference: registry.describe("example.order.page", 1) };
}
const queryRequest = () => ({ query: queryRef, pageSize: 50, cursor: null });

describe("explicit owner page read contribution", () => {
  it("adds page-only approval without changing entity extension flags/hashes or projecting data during metadata reconstruction", async () => {
    const { registry, sources, run, reference } = setup();
    const before = new CapabilityRegistry(async () => true); before.register("example", { contributions: sources });
    expect(registry.describe("example.order", 1)).toEqual(before.describe("example.order", 1));
    expect(registry.describe(queryRef.id, 1)).toEqual(before.describe(queryRef.id, 1));
    expect(registry.describePageSource(reference).policy.variants).toBe(false);
    expect(registry.describe("example.order", 1).details.extensionPolicy).toEqual({ customFields: false, recordTypes: false, pageVariants: false });
    expect(Object.isFrozen(reference.details.pageSource)).toBe(true); expect(run).not.toHaveBeenCalled();
  });
  it("rechecks genuine owning scope for every actual query and keeps opaque native revision separate from extension integer", async () => {
    const session = await actor(), { registry, callbacks, run, reference } = setup();
    const context = { session, transaction: tx };
    const authorised = await registry.authorisePageRead(context, reference, record);
    expect(authorised.anchor).toEqual({ kind: "record", organisationId: "company", recordId: "order", revision: "v4:2026-10-11T01:02:03Z" });
    expect(run).not.toHaveBeenCalled();
    expect(await registry.invokePageRead(context, reference, record, queryRequest())).toEqual({ anchor: authorised.anchor,
      output: { rows: [{ id: "order", values: { subject: "Order" } }], nextCursor: null } });
    await registry.invokePageRead(context, reference, record, queryRequest());
    expect(callbacks.authoriseRead).toHaveBeenCalledTimes(3); expect(run).toHaveBeenCalledTimes(2);
    expect(callbacks.bindQueryInput).toHaveBeenLastCalledWith(context, authorised.anchor, { ...queryRequest(), pageSize: 1 });
    expect(vi.mocked(callbacks.authoriseRead).mock.invocationCallOrder[1]).toBeLessThan(run.mock.invocationCallOrder[0]);
    expect(session.capabilities.has("example.order.manage")).toBe(false);
  });
  it("rejects copied authority, missing transaction and caller tenant/record overrides before owning access", async () => {
    const session = await actor(), { registry, callbacks, run, reference } = setup();
    for (const context of [{ session: { ...session } as Session, transaction: tx }, { session }])
      await expect(registry.authorisePageRead(context, reference, record)).rejects.toThrow("genuine");
    await expect(registry.authorisePageRead({ session, transaction: tx }, reference, { ...record, organisationId: "foreign" })).rejects.toThrow();
    await expect(registry.invokePageRead({ session, transaction: tx }, reference, record, { ...queryRequest(), recordId: "foreign" })).rejects.toThrow();
    expect(callbacks.authoriseRead).not.toHaveBeenCalled(); expect(run).not.toHaveBeenCalled();
  });
  it("denies native/module/full projection rights before callbacks or protected queries", async () => {
    const session = await actor([]), first = setup();
    await expect(first.registry.invokePageRead({ session, transaction: tx }, first.reference, record, queryRequest())).rejects.toThrow();
    expect(first.callbacks.authoriseRead).not.toHaveBeenCalled(); expect(first.run).not.toHaveBeenCalled();
    const current = await actor(), denied = setup({ queries: [{ ...policy().queries[0], columns: [{ ...column, capability: "example.secret.read" }] }] });
    await expect(denied.registry.invokePageRead({ session: current, transaction: tx }, denied.reference, record, queryRequest())).rejects.toThrow();
    expect(denied.callbacks.authoriseRead).not.toHaveBeenCalled(); expect(denied.run).not.toHaveBeenCalled();
    first.available.mockResolvedValue(false);
    await expect(first.registry.authorisePageRead({ session: current, transaction: tx }, first.reference, record)).rejects.toThrow("unavailable");
    expect(first.callbacks.authoriseRead).not.toHaveBeenCalled();
  });
  it("validates foreign/mismatched owning anchors and list-vs-record scope before data", async () => {
    const session = await actor();
    for (const anchor of [{ kind: "record" as const, organisationId: "foreign", recordId: "order", revision: "4" },
      { kind: "record" as const, organisationId: "company", recordId: "another", revision: "4" }, { kind: "list" as const, organisationId: "company" }]) {
      const { registry, run, reference } = setup({}, { authoriseRead: async () => anchor });
      await expect(registry.invokePageRead({ session, transaction: tx }, reference, record, queryRequest())).rejects.toThrow("invalid page scope"); expect(run).not.toHaveBeenCalled();
    }
    const { registry, run, callbacks, reference } = setup();
    await expect(registry.invokePageRead({ session, transaction: tx }, reference, { kind: "list" }, queryRequest())).rejects.toThrow("scope");
    expect(callbacks.authoriseRead).not.toHaveBeenCalled(); expect(run).not.toHaveBeenCalled();
  });
  it("keeps the source descriptive and refuses unapproved queries/cursors", async () => {
    const session = await actor(), { registry, callbacks, run, reference } = setup();
    await expect(registry.invoke(session, reference, {})).rejects.toThrow("descriptive");
    await expect(registry.invokePageRead({ session, transaction: tx }, reference, record, { ...queryRequest(), query: { id: "example.order.other", version: 1 } })).rejects.toThrow("approved");
    await expect(registry.invokePageRead({ session, transaction: tx }, reference, record, { ...queryRequest(), cursor: { id: "cursor" } })).rejects.toThrow("cursor");
    expect(run).not.toHaveBeenCalled(); expect(callbacks.bindQueryInput).not.toHaveBeenCalled();
  });
  it("retains same-policy supported historical versions but never falls back after current policy changes/disappears", async () => {
    const session = await actor(), { registry, owner, reference } = setup();
    registry.register("example", { contributions: [pageSource({ ...base, id: reference.id, version: 2, label: "Modern orders", policy: policy(), callbacks: owner.pageSource! })] });
    await expect(registry.authorisePageRead({ session, transaction: tx }, reference, record)).resolves.toBeTruthy();
    registry.register("example", { contributions: [pageSource({ ...base, id: reference.id, version: 3, policy: { ...policy(), variants: true }, callbacks: owner.pageSource! })] });
    expect(() => registry.describePageSource(reference)).toThrow("republishing");
    const unsupported = setup();
    unsupported.registry.register("example", { contributions: [declarative({ ...base, id: reference.id, version: 2, kind: "surface", schema: z.string(), references: [] })] });
    expect(() => unsupported.registry.describePageSource(unsupported.reference)).toThrow("republishing");
    await expect(registry.authorisePageRead({ session, transaction: tx }, { ...reference, contractHash: "f".repeat(64) }, record)).rejects.toThrow("changed");
  });
  it("honors retained source/query support windows instead of keeping deprecated execution available indefinitely", async () => {
    const session = await actor(), fixture = setup();
    const registry = new CapabilityRegistry(async () => true);
    registry.register("example", { contributions: [...fixture.sources, pageSource({ ...base, id: fixture.reference.id, lifecycle: "deprecated",
      supportedUntil: "2020-01-01T00:00:00Z", policy: policy(), callbacks: fixture.owner.pageSource! })] });
    await expect(registry.authorisePageRead({ session, transaction: tx }, registry.describe(fixture.reference.id, 1), record)).rejects.toThrow("expired");
    expect(fixture.callbacks.authoriseRead).not.toHaveBeenCalled();
  });
  it("rejects absent/foreign/nontransactional/ambiguous policies atomically, with callback iff explicit", () => {
    const fixture = setup();
    const mutate = [
      (value: Contribution) => { delete value.pageSource; },
      (value: Contribution) => { delete (value.metadata.details as Record<string, unknown>).pageSource; },
      (value: Contribution) => { value.metadata.kind = "entity"; },
      (value: Contribution) => { const p = policy(); p.entity.id = "foreign.order"; value.metadata.details = { pageSource: p }; value.metadata.schemaHash = checksum(p); },
      (value: Contribution) => { const p = policy(); p.nativeFields[0].id = "missing"; value.metadata.details = { pageSource: p }; value.metadata.schemaHash = checksum(p); },
    ];
    for (const corrupt of mutate) {
      const value = pageSource({ ...base, id: fixture.reference.id, policy: policy(), callbacks: fixture.owner.pageSource! }); corrupt(value);
      const registry = new CapabilityRegistry(async () => true);
      expect(() => registry.register("example", { contributions: [...fixture.sources, value] })).toThrow();
      expect(() => registry.describe("example.order", 1)).toThrow("missing");
    }
    const altered = setup().sources; delete (altered[1].metadata.details as Record<string, unknown>).transaction;
    const registry = new CapabilityRegistry(async () => true);
    expect(() => registry.register("example", { contributions: [...altered, fixture.owner] })).toThrow("shared-transaction");
    expect(() => fixture.registry.register("example", { contributions: [pageSource({ ...base, id: "example.order.other_page", policy: policy(), callbacks: fixture.owner.pageSource! })] })).toThrow("stable");
    expect(() => pageSourcePolicySchema.parse({ ...policy(), organisationId: "foreign" })).toThrow();
  });
  it("rejects surplus, type-coerced, foreign record and over-bound projected data", async () => {
    const session = await actor();
    const cases = [
      { rows: [{ id: "order", values: { subject: "Order", private: "secret" } }], nextCursor: null },
      { rows: [{ id: "order", values: { subject: 5 } }], nextCursor: null },
      { rows: [{ id: "foreign", values: { subject: "Order" } }], nextCursor: null },
      { rows: [{ id: "order", values: { subject: "Order" } }, { id: "order", values: { subject: "Order" } }], nextCursor: null },
      { rows: [{ id: "order", values: { subject: "Order" } }], nextCursor: { id: "order" } },
    ];
    for (const output of cases) {
      const { registry, reference } = setup({}, { projectQueryOutput: async () => output });
      await expect(registry.invokePageRead({ session, transaction: tx }, reference, record, queryRequest())).rejects.toThrow("INVALID");
    }
  });
  it("preserves exact zero and false from approved projections without fetching during descriptor resolution", async () => {
    const columns = [column, { id: "count", valueType: "number" as const, nullable: false, classification: "confidential" as const },
      { id: "flag", valueType: "boolean" as const, nullable: false, classification: "confidential" as const }];
    const p = policy(), session = await actor(), fixture = setup({ queries: [{ ...p.queries[0], columns }], facts: [
      { id: "open_count", contract: p.entity, query: queryRef, columnId: "count", valueType: "number", nullable: false, classification: "confidential", provenance: "owner_projection" },
      { id: "has_owner", contract: p.entity, query: queryRef, columnId: "flag", valueType: "boolean", nullable: false, classification: "confidential", provenance: "owner_native" },
    ] });
    fixture.run.mockResolvedValue({ rows: [{ id: "order", values: { subject: "Order", count: 0, flag: false } }], nextCursor: null });
    fixture.registry.describePageSource(fixture.reference); expect(fixture.run).not.toHaveBeenCalled();
    const result = await fixture.registry.invokePageRead({ session, transaction: tx }, fixture.reference, record, queryRequest());
    expect(result.output.rows[0].values).toEqual({ subject: "Order", count: 0, flag: false });
  });
  it("requires complete normalized output and exact native scalar types instead of trimming an old raw query", () => {
    const fixture = setup(), raw = query({ ...base, ...queryRef, kind: "query", pagination: "none", maxCardinality: 1, costClass: "low", transaction: "required",
      input: z.strictObject({ id: z.string() }), output: z.strictObject({ subject: z.string(), secret: z.string() }), async execute() { return { subject: "Order", secret: "private" }; } });
    const registry = new CapabilityRegistry(async () => true);
    expect(() => registry.register("example", { contributions: [fixture.sources[0], raw, fixture.owner] })).toThrow("closed approved projection");
    expect(() => registry.describe("example.order", 1)).toThrow("missing");
    const mismatched = policy(); mismatched.queries[0].columns[0].valueType = "number";
    expect(() => setup(mismatched)).toThrow("scalar type");
  });
  it("propagates changed current private access on the next query before any subsequent protected read", async () => {
    const session = await actor(), fixture = setup(), context = { session, transaction: tx };
    await fixture.registry.invokePageRead(context, fixture.reference, record, queryRequest());
    vi.mocked(fixture.callbacks.authoriseRead).mockRejectedValueOnce(new Error("Current private access revoked."));
    await expect(fixture.registry.invokePageRead(context, fixture.reference, record, queryRequest())).rejects.toThrow("revoked");
    expect(fixture.run).toHaveBeenCalledTimes(1); expect(fixture.callbacks.bindQueryInput).toHaveBeenCalledTimes(1);
  });
  it("keeps list pagination on its explicitly approved scope and bound, never inferring a record relationship", async () => {
    const session = await actor(), fixture = setup(), listRef = { id: "example.order.page_list", version: 1 };
    const listRun = vi.fn(async () => ({ rows: [{ id: "a", values: { subject: "First" } }], nextCursor: { id: "a" } }));
    const listPolicy = { ...policy(), nativeFields: [], queries: [{ query: listRef, scope: "list" as const, purpose: "list" as const, columns: [column] }] };
    const bind = vi.fn<PageSourceCallbacks["bindQueryInput"]>(async (_ctx, _anchor, request) => ({ pageSize: request.pageSize, cursor: request.cursor }));
    const registry = new CapabilityRegistry(async () => true);
    registry.register("example", { contributions: [fixture.sources[0], query({ ...base, ...listRef, kind: "query", pagination: "cursor", maxCardinality: 20,
      costClass: "low", transaction: "required", input: z.strictObject({ pageSize: z.number().int().max(20), cursor: z.unknown() }),
      output: pageProjectionSchema([column], 20), execute: listRun }), pageSource({ ...base, id: fixture.reference.id, policy: listPolicy,
      callbacks: { ...fixture.owner.pageSource!, bindQueryInput: bind } })] });
    const ref = registry.describe(fixture.reference.id, 1), request = { query: listRef, pageSize: 50, cursor: null };
    const result = await registry.invokePageRead({ session, transaction: tx }, ref, { kind: "list" }, request);
    expect(result.output.nextCursor).toEqual({ id: "a" }); expect(bind).toHaveBeenLastCalledWith({ session, transaction: tx },
      { kind: "list", organisationId: "company" }, { ...request, pageSize: 20 });
    await expect(registry.invokePageRead({ session, transaction: tx }, ref, record, request)).rejects.toThrow("scope");
    expect(listRun).toHaveBeenCalledTimes(1);
  });
});
