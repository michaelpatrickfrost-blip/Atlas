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

it("requires actual stored format2 parent identity before reading its requirement archive", async () => {
  const { retainedCutoverFixture } = await import("./fixtures/studio-field-cutover");
  const { conditionalFieldPayloadSchema } = await import("@/core/studio/fields/required-contract");
  const { sealRequiredFieldMigrationIntent } = await import("@/core/studio/fields/migrations/required-contracts");
  const { digestRequiredFieldMigrationArchive } = await import("@/core/studio/fields/migrations/archive-digest");
  const f = await retainedCutoverFixture(), payload = conditionalFieldPayloadSchema.parse({ ...f.intent.target.payload, schemaVersion: 2,
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } });
  const modern = sealRequiredFieldMigrationIntent({ ...f.intent, schemaVersion: 2, target: { ...f.intent.target, payload } });
  const raw = vi.fn(), tx = { $queryRaw: raw } as unknown as Prisma.TransactionClient;
  for (const parents of [[], [{ format: 1 }], [{ format: "2" }], [{ format: 2 }, { format: 2 }]]) {
    raw.mockReset(); raw.mockResolvedValueOnce(parents);
    await expect(digestRequiredFieldMigrationArchive(tx, modern.intent)).rejects.toThrow("observation is invalid"); expect(raw).toHaveBeenCalledTimes(1);
  }
  raw.mockReset(); raw.mockResolvedValueOnce([{ format: 2 }]).mockResolvedValueOnce([valid]);
  expect(await digestRequiredFieldMigrationArchive(tx, modern.intent)).toEqual({ recordCount: 3, observationDigest: valid.observationDigest,
    summary: { validCount: 2, invalidCount: 1, lossyCount: 1 }, duplicateTarget: false });
  expect(raw.mock.calls[0].slice(1)).toContain(modern.checksum);
  expect(raw.mock.calls[1].slice(1)).toContain("atlas.studio.field-observations@2\n");
  raw.mockReset(); raw.mockResolvedValueOnce([valid]); await digestFieldMigrationArchive(tx, f.intent);
  expect(raw).toHaveBeenCalledTimes(1); expect(raw.mock.calls[0].slice(1)).toContain("atlas.studio.field-observations@1\n");
});
