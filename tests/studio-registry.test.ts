import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { query, command } from "@/core/studio/registry/contracts";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import type { ContractMetadata } from "@/core/studio/registry/types";
const actor = (organisationId = "tenant-a", permissions = ["sales.order.read"]): Session => ({ organisationId, userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", organisationName: organisationId, membershipId: "member", capabilities: new Set(permissions) });
const base = { id: "sales.order.get", version: 1, label: "Order", capability: "sales.order.read", lifecycle: "active" as const, classification: "confidential" as const };
const contribution = () => query({ ...base, kind: "query", input: z.strictObject({ id: z.string() }), output: z.strictObject({ tenant: z.string() }), pagination: "none", maxCardinality: 1, costClass: "low", async execute(ctx) { return { tenant: ctx.session.organisationId }; } });
const reference = (m: ContractMetadata) => ({ id: m.id, version: m.version, schemaHash: m.schemaHash, contractHash: m.contractHash });
describe("Studio capability registry", () => {
  it("rejects duplicate bundles atomically and owner spoofing", () => {
    const registry = new CapabilityRegistry(async () => true);
    expect(() => registry.register("sales", { contributions: [contribution(), contribution()] })).toThrow("Duplicate");
    expect(() => registry.describe(base.id, 1)).toThrow("missing");
    expect(() => registry.register("finance", { contributions: [contribution()] })).toThrow("owner");
  });
  it("pins immutable metadata and detects schema/capability removal or changes", () => {
    const registry = new CapabilityRegistry(async () => true);
    registry.register("sales", { contributions: [contribution()] });
    const m = registry.describe(base.id, 1);
    expect(Object.isFrozen(m.details)).toBe(true);
    expect(registry.checkCompatibility([reference(m)])).toEqual([]);
    expect(registry.checkCompatibility([{ ...reference(m), schemaHash: "changed" }])).toHaveLength(1);
    expect(registry.checkCompatibility([{ ...reference(m), id: "sales.order.removed" }])).toHaveLength(1);
    const changed = new CapabilityRegistry(async () => true);
    const next = contribution(); next.metadata.capability = "sales.order.manage";
    changed.register("sales", { contributions: [next] });
    expect(changed.checkCompatibility([reference(m)])).toHaveLength(1);
  });
  it("uses the trusted tenant context, rejects client tenant IDs and missing permissions", async () => {
    const registry = new CapabilityRegistry(async () => true);
    registry.register("sales", { contributions: [contribution()] });
    const ref = reference(registry.describe(base.id, 1));
    expect(await registry.invoke(actor(), ref, { id: "order" })).toEqual({ tenant: "tenant-a" });
    expect(await registry.invoke(actor("tenant-b"), ref, { id: "order" })).toEqual({ tenant: "tenant-b" });
    await expect(registry.invoke(actor(), ref, { id: "order", organisationId: "tenant-b" })).rejects.toThrow();
    await expect(registry.invoke(actor("tenant-a", []), ref, { id: "order" })).rejects.toThrow("FORBIDDEN");
    expect(await registry.discover(actor("tenant-a", []))).toEqual([]);
  });
  it("blocks disabled owners, expired deprecated contracts and invalid outputs", async () => {
    const registry = new CapabilityRegistry(async () => false);
    registry.register("sales", { contributions: [contribution()] });
    await expect(registry.invoke(actor(), reference(registry.describe(base.id, 1)), { id: "x" })).rejects.toThrow("unavailable");
    const bad = query({ ...base, kind: "query", input: z.strictObject({}), output: z.string(), pagination: "none", maxCardinality: 1, costClass: "low", async execute() { return 3 as unknown as string; } });
    const enabled = new CapabilityRegistry(async () => true);
    enabled.register("sales", { contributions: [bad] });
    await expect(enabled.invoke(actor(), reference(enabled.describe(base.id, 1)), {})).rejects.toThrow();
    const expired = contribution(); expired.metadata.lifecycle = "deprecated"; expired.metadata.supportedUntil = "2000-01-01T00:00:00Z";
    const legacy = new CapabilityRegistry(async () => true); legacy.register("sales", { contributions: [expired] });
    await expect(legacy.resolve(actor(), reference(legacy.describe(base.id, 1)))).rejects.toThrow("expired");
  });
  it("requires an idempotency key for protected domain commands", async () => {
    const registry = new CapabilityRegistry(async () => true);
    registry.register("sales", { contributions: [command({ ...base, kind: "command", input: z.strictObject({}), output: z.string(), execution: "transactional", idempotency: "required", sideEffect: "internal", async invoke(ctx) { return ctx.idempotencyKey!; } })] });
    const ref = reference(registry.describe(base.id, 1));
    await expect(registry.invoke(actor(), ref, {})).rejects.toThrow("idempotency");
    expect(await registry.invoke(actor(), ref, {}, "stable-operation")).toBe("stable-operation");
  });
});
