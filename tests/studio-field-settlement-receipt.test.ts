import { expect, it } from "vitest";
import { readFieldMigrationSettlementReceipt } from "@/core/studio/fields/migrations/settlement-receipt";
import { readFieldMigrationCutoverReceipt } from "@/core/studio/fields/migrations/cutover-receipt";
import { checksum } from "@/core/studio/registry/contracts";
import { retainedCutoverFixture, settleCutoverFixture } from "./fixtures/studio-field-cutover";

type Fixture = Awaited<ReturnType<typeof retainedCutoverFixture>>;
const receipt = (f: Fixture) => ({ ...f.receipt, settledAt: f.receipt.settledAt?.toISOString() ?? null });
const read = (f: Fixture) => readFieldMigrationSettlementReceipt(f.stored, f.execution, f.publication, receipt(f));
const strictRead = (f: Fixture) => {
  const { settlementPin, settlementChecksum, settledBy, settledAt, ...original } = f.receipt;
  void [settlementPin, settlementChecksum, settledBy, settledAt];
  return readFieldMigrationCutoverReceipt(f.stored, f.execution, f.publication, f.definition, original);
};

it("reads the actual open receipt without inferring today's pointer", async () => {
  const f = await retainedCutoverFixture();
  expect(read(f)).toEqual({ retained: f.retained, state: "ACTIVATED", settlement: null });
  expect(strictRead(f)).toEqual(f.retained);
  f.definition.activeVersionId = f.source.id;
  expect(read(f).retained).toEqual(f.retained);
  expect(() => strictRead(f)).toThrow("stale or has changed");
});
it.each(["ROLLED_BACK", "FINALIZED"] as const)("retains %s history after subsequent legitimate configuration changes", async disposition => {
  const f = await retainedCutoverFixture(), settled = settleCutoverFixture(f, disposition);
  expect(read(f)).toEqual({ retained: f.retained, state: disposition, settlement: settled });
  f.definition.revision += 20; f.definition.latestVersion += 3; f.definition.retiredAt = new Date();
  f.definition.activeVersionId = "00000000-0000-4000-8000-000000000099";
  expect(read(f).settlement).toEqual(settled);
  expect(() => strictRead(f)).toThrow();
});
it("requires closed actual ACT/publication/revision pairing and null settlement metadata", async () => {
  for (const patch of [{ revision: 1 }, { settledBy: "actor" }, { settlementPin: {} }, { settlementChecksum: "f".repeat(64) },
    { settledAt: "2026-10-10T10:00:00.000Z" }, { canRollback: true }]) {
    const f = await retainedCutoverFixture();
    expect(() => readFieldMigrationSettlementReceipt(f.stored, f.execution, f.publication, { ...receipt(f), ...patch })).toThrow();
  }
  for (const patch of [{ state: "COMPLETED" }, { revision: 2 }, { canActivate: true }]) {
    const f = await retainedCutoverFixture();
    expect(() => readFieldMigrationSettlementReceipt(f.stored, f.execution, { ...f.publication, ...patch }, receipt(f))).toThrow();
  }
});
it.each(["ROLLED_BACK", "FINALIZED"] as const)("rejects forged %s settlement pairing, actor, closed pin and checksum", async disposition => {
  for (const patch of [{ revision: 0 }, { settledBy: "another-actor" }, { settlementPin: null }, { settlementChecksum: null }, { settledAt: null },
    { settlementChecksum: "f".repeat(64) }, { settledAt: "yesterday" }]) {
    const f = await retainedCutoverFixture(); settleCutoverFixture(f, disposition);
    expect(() => readFieldMigrationSettlementReceipt(f.stored, f.execution, f.publication, { ...receipt(f), ...patch })).toThrow();
  }
  const f = await retainedCutoverFixture(), packet = settleCutoverFixture(f, disposition);
  const forged = { ...packet.pin, organisationId: "foreign" };
  expect(() => readFieldMigrationSettlementReceipt(f.stored, f.execution, f.publication,
    { ...receipt(f), settlementPin: forged, settlementChecksum: checksum(forged) })).toThrow();
  f.publication.state = disposition === "ROLLED_BACK" ? "COMPLETED" : "ROLLED_BACK";
  expect(() => read(f)).toThrow();
});
it("does not substitute retained execution pin identity for altered actual publication or original receipt", async () => {
  const f = await retainedCutoverFixture(); settleCutoverFixture(f, "FINALIZED");
  f.publication.targetChecksum = "f".repeat(64); expect(() => read(f)).toThrow();
  const g = await retainedCutoverFixture(); settleCutoverFixture(g, "ROLLED_BACK");
  g.receipt.createdBy = "current-actor"; expect(() => read(g)).toThrow();
  const h = await retainedCutoverFixture(); settleCutoverFixture(h, "FINALIZED");
  h.execution.state = "RUNNING"; expect(() => read(h)).toThrow();
});
