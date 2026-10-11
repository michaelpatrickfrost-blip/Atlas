import { expect, it, vi } from "vitest";
import { z } from "zod";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { query, command } from "@/core/studio/registry/contracts";
import { CapabilityRegistry } from "@/core/studio/registry/registry";

const session: Session = { organisationId: "company", organisationName: "Company", userId: "user", membershipId: "member",
  userName: "User", userEmail: "user@example.invalid", capabilities: new Set(["tickets.ticket.manage"]) };
const transaction = { fixture: "server transaction" } as unknown as Prisma.TransactionClient;
const base = { id: "tickets.ticket.snapshot", version: 1, label: "Snapshot", capability: "tickets.ticket.manage",
  lifecycle: "active" as const, classification: "confidential" as const };
function setup(required = true, available = true) {
  const execute = vi.fn(async (ctx: { session: Session; transaction?: Prisma.TransactionClient }) => ({ organisationId: ctx.session.organisationId }));
  const registry = new CapabilityRegistry(async () => available);
  const descriptor = query({ ...base, kind: "query", input: z.strictObject({}), output: z.strictObject({ organisationId: z.string() }),
    pagination: "none", maxCardinality: 1, costClass: "low", ...(required ? { transaction: "required" as const } : {}), execute });
  registry.register("tickets", { contributions: [descriptor] });
  return { registry, reference: registry.describe(base.id, 1), execute, descriptor };
}

it("requires the exact server transaction and rejects ordinary invocation before owner execution", async () => {
  const { registry, reference, execute } = setup();
  await expect(registry.invoke(session, reference, {})).rejects.toThrow("shared server transaction");
  await expect(registry.invokeQueryInTransaction({ session }, reference, {})).rejects.toThrow("opted-in");
  expect(execute).not.toHaveBeenCalled();
  expect(await registry.invokeQueryInTransaction({ session, transaction }, reference, {})).toEqual({ organisationId: "company" });
  expect(execute.mock.calls[0][0].transaction).toBe(transaction);
  expect(execute.mock.calls[0][0].session).toBe(session);
});

it("preserves permission, source and input guards; client identities and transactions cannot override server context", async () => {
  const { registry, reference, execute } = setup();
  await expect(registry.invokeQueryInTransaction({ session: { ...session, capabilities: new Set(["studio.definition.publish"]) }, transaction }, reference, {})).rejects.toThrow("FORBIDDEN");
  await expect(registry.invokeQueryInTransaction({ session, transaction }, reference, { organisationId: "other", transaction: "client" })).rejects.toThrow();
  expect(execute).not.toHaveBeenCalled();
  const disabled = setup(true, false);
  await expect(disabled.registry.invokeQueryInTransaction({ session, transaction }, disabled.reference, {})).rejects.toThrow("unavailable");
  expect(disabled.execute).not.toHaveBeenCalled();
  const other = { ...session, organisationId: "other-company" };
  expect(await registry.invokeQueryInTransaction({ session: other, transaction }, reference, {})).toEqual({ organisationId: "other-company" });
});

it("keeps old query metadata and invocation unchanged while treating the opt-in as a contract change", async () => {
  const old = setup(false), next = setup();
  expect(old.reference.details).toEqual({ pagination: "none", maxCardinality: 1, costClass: "low" });
  expect(old.reference.schemaHash).toBe(next.reference.schemaHash);
  expect(old.reference.contractHash).not.toBe(next.reference.contractHash);
  expect(next.registry.checkCompatibility([old.reference])).toHaveLength(1);
  expect(await old.registry.invoke(session, old.reference, {})).toEqual({ organisationId: "company" });
  await expect(old.registry.invokeQueryInTransaction({ session, transaction }, old.reference, {})).rejects.toThrow("opted-in");
  expect(old.execute).toHaveBeenCalledTimes(1);
});

it("cannot use the query method to bypass protected command idempotency", async () => {
  const registry = new CapabilityRegistry(async () => true), invoke = vi.fn(async () => "done");
  registry.register("tickets", { contributions: [command({ ...base, kind: "command", input: z.strictObject({}), output: z.string(),
    execution: "transactional", sideEffect: "internal", idempotency: "required", invoke })] });
  const reference = registry.describe(base.id, 1);
  await expect(registry.invokeQueryInTransaction({ session, transaction }, reference, {})).rejects.toThrow("opted-in");
  await expect(registry.invoke(session, reference, {})).rejects.toThrow("idempotency");
  expect(invoke).not.toHaveBeenCalled();
});

it("validates owner output inside transactional invocation", async () => {
  const { registry, reference, execute } = setup();
  execute.mockResolvedValueOnce({ organisationId: 3 as unknown as string });
  await expect(registry.invokeQueryInTransaction({ session, transaction }, reference, {})).rejects.toThrow();
});

it("keeps the required-transaction execution rule sealed when the source descriptor is later mutated", async () => {
  const execute = vi.fn(async () => "result");
  const source = { ...base, kind: "query" as const, input: z.strictObject({}), output: z.string(),
    pagination: "none" as const, maxCardinality: 1, costClass: "low" as const,
    transaction: "required" as "required" | undefined, execute };
  const descriptor = query(source), registry = new CapabilityRegistry(async () => true);
  registry.register("tickets", { contributions: [descriptor] }); source.transaction = undefined;
  await expect(descriptor.run!({ session }, {})).rejects.toThrow("shared server transaction");
  await expect(registry.invoke(session, registry.describe(base.id, 1), {})).rejects.toThrow("shared server transaction");
  expect(execute).not.toHaveBeenCalled();
});
