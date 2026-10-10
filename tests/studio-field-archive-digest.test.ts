import { expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldMigrationIntent } from "@/core/studio/fields/migrations/contracts";
import { digestFieldMigrationArchive } from "@/core/studio/fields/migrations/archive-digest";

const intent = { id: "operation", organisationId: "company", definitionId: "definition", source: { payload: { entity: { id: "tickets.ticket" }, storageGeneration: "generation" } } } as FieldMigrationIntent;
const valid = { recordCount: "3", validCount: "2", invalidCount: "1", lossyCount: "1", observationDigest: "a".repeat(64), duplicateTarget: false };
it("accepts exact safe SQL count strings and rejects unsafe/malformed/inconsistent aggregate output", async () => {
  const raw = vi.fn(async () => [valid]), tx = { $queryRaw: raw } as unknown as Prisma.TransactionClient;
  expect(await digestFieldMigrationArchive(tx, intent)).toEqual({ recordCount: 3, observationDigest: "a".repeat(64), summary: { validCount: 2, invalidCount: 1, lossyCount: 1 }, duplicateTarget: false });
  const invalid = [{ ...valid, recordCount: "9007199254740992" }, { ...valid, recordCount: "03" }, { ...valid, recordCount: 3 }, { ...valid, invalidCount: "0" },
    { ...valid, lossyCount: "3" }, { ...valid, duplicateTarget: "false" }, { ...valid, observationDigest: "bad" }];
  for (const result of invalid) {
    raw.mockResolvedValueOnce([result as typeof valid]); await expect(digestFieldMigrationArchive(tx, intent)).rejects.toThrow("observation is invalid");
  }
  raw.mockResolvedValueOnce([]); await expect(digestFieldMigrationArchive(tx, intent)).rejects.toThrow("observation is invalid");
});
