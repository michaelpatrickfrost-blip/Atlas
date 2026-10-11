import { expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { lockBoundFieldEntityInTransaction, lockFieldEntitiesInTransaction } from "@/core/studio/fields/entity-lock";

// These are SQL/key/order contracts, not evidence of PostgreSQL concurrency or
// post-wait snapshot freshness. Actual Serializable/CAS races remain required.
it("deduplicates and sorts the complete owning set using the retained tenant/entity key", async () => {
  const raw = vi.fn().mockResolvedValue([]), tx = { $queryRaw: raw } as unknown as Prisma.TransactionClient;
  await lockFieldEntitiesInTransaction(tx, "company-a", ["tickets.ticket", "service.case", "tickets.ticket"]);
  expect(raw.mock.calls.map(call => call.slice(1))).toEqual([
    [JSON.stringify(["company-a", "service.case"])], [JSON.stringify(["company-a", "tickets.ticket"])],
  ]);
  for (const [sql] of raw.mock.calls) expect(sql.join("?")).toContain("hashtextextended(?, 0)");
  raw.mockClear();
  await lockFieldEntitiesInTransaction(tx, "company-b", ["tickets.ticket"]);
  expect(raw.mock.calls[0][1]).toBe(JSON.stringify(["company-b", "tickets.ticket"]));
});

it("stops acquiring the set when the owning transaction's lock fails", async () => {
  const raw = vi.fn().mockRejectedValue(new Error("transaction aborted")), tx = { $queryRaw: raw } as unknown as Prisma.TransactionClient;
  await expect(lockFieldEntitiesInTransaction(tx, "company", ["tickets.ticket", "service.case"])).rejects.toThrow("transaction aborted");
  expect(raw).toHaveBeenCalledOnce();
});

it("derives only a tenant-scoped existing primary binding and grants nothing for an empty result", async () => {
  const raw = vi.fn().mockResolvedValue([]), tx = { $queryRaw: raw } as unknown as Prisma.TransactionClient;
  const definitionId = "00000000-0000-4000-8000-000000000001";
  expect(await lockBoundFieldEntityInTransaction(tx, "company", definitionId)).toBeUndefined();
  expect(raw.mock.calls[0].slice(1)).toEqual(["company", definitionId]);
  const sql = raw.mock.calls[0][0].join("?");
  expect(sql).toContain('FROM studio_field_bindings b WHERE b."organisationId"=? AND b."definitionId"=?::uuid');
  expect(sql).toContain('to_json(b."entityId")::text');
  expect(sql).toContain("pg_advisory_xact_lock(hashtextextended(");
  expect(sql).not.toContain("service_work_items");
});
