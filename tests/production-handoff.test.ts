import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const m = vi.hoisted(() => ({
  transaction: vi.fn(),
  enabled: vi.fn(),
  movement: vi.fn(),
  replenished: vi.fn(),
  batch: vi.fn(),
  prior: vi.fn(),
  target: vi.fn(),
  hold: vi.fn(),
  cas: vi.fn(),
  create: vi.fn(),
  audit: vi.fn(),
  saved: { collected: 0, version: 1, collections: 0 },
}));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction } }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
vi.mock("@/modules/stock/services/provider", () => ({
  stockProvider: { executeMovement: m.movement },
}));
vi.mock("@/core/stock/replenishment", () => ({
  stockReplenished: m.replenished,
}));
import {
  collectProductionBatch,
  readCollection,
} from "@/modules/stock/services/production-handoff";
const session = {
  organisationId: "company",
  userId: "warehouse",
  capabilities: new Set(["stock.manage"]),
} as Session;
const input = {
  batchId: "batch",
  version: 1,
  quantity: 4,
  locationId: "yard",
  requestKey: "collect-1",
  note: "Collected to north bay",
};
const batch = {
  id: "batch",
  organisationId: "company",
  manufacturingOrderId: "order",
  workOrderId: "work",
  productId: "product",
  warehouseId: "production",
  locationId: "holding",
  lotCode: "MO-1",
  quantity: 10,
  collectedQuantity: 0,
  version: 1,
  location: { active: true, capabilities: ["PRODUCTION_STAGING"] },
};
const tx = {
  stockProductionCollection: { findUnique: m.prior, create: m.create },
  stockProductionBatch: { findFirst: m.batch, updateMany: m.cas },
  stockLocation: { findFirst: m.target },
  qualityHold: { count: m.hold },
  auditEntry: { create: m.audit },
};
beforeEach(() => {
  vi.resetAllMocks();
  m.saved = { collected: 0, version: 1, collections: 0 };
  m.enabled.mockResolvedValue(undefined);
  m.hold.mockResolvedValue(0);
  m.prior.mockResolvedValue(null);
  m.batch.mockResolvedValue(batch);
  m.target.mockResolvedValue({
    id: "yard",
    warehouseId: "destination",
    active: true,
    capabilities: ["STORAGE"],
  });
  m.cas.mockImplementation(async ({ data }) => {
    m.saved.collected += data.collectedQuantity.increment;
    m.saved.version++;
    return { count: 1 };
  });
  m.create.mockImplementation(async () => {
    m.saved.collections++;
    return { id: "collection" };
  });
  // A failing ledger/audit operation rolls back the same pending transaction.
  m.transaction.mockImplementation(async (work) => {
    const previous = { ...m.saved };
    try {
      return await work(tx);
    } catch (error) {
      m.saved = previous;
      throw error;
    }
  });
});
it("collects the actual partial quantity, moves its held lot in the same transaction and refreshes supply after commit", async () => {
  await collectProductionBatch(session, input);
  expect(m.saved).toEqual({ collected: 4, version: 2, collections: 1 });
  expect(m.movement).toHaveBeenCalledWith(
    session,
    expect.objectContaining({
      quantity: 4,
      status: "BLOCKED",
      toStatus: "AVAILABLE",
      lotCode: "MO-1",
      warehouseId: "production",
      locationId: "holding",
      toWarehouseId: "destination",
      toLocationId: "yard",
      manufacturingOrderId: "order",
      workOrderId: "work",
    }),
    tx,
  );
  expect(m.cas.mock.calls[0][0].data.fullyCollected).toBe(false);
  expect(m.audit).toHaveBeenCalledOnce();
  expect(m.replenished).toHaveBeenCalledOnce();
  expect(m.audit.mock.invocationCallOrder[0]).toBeLessThan(
    m.replenished.mock.invocationCallOrder[0],
  );
});
it("marks the final collection complete and retains the original produced quantity", async () => {
  await collectProductionBatch(session, { ...input, quantity: 10 });
  expect(m.cas.mock.calls[0][0]).toMatchObject({
    where: { organisationId: "company", version: 1, collectedQuantity: 0 },
    data: { fullyCollected: true },
  });
  expect(m.cas.mock.calls[0][0].data.quantity).toBeUndefined();
});
it.each(["ledger", "audit"])(
  "rolls back quantity, version and history if %s fails",
  async (failure) => {
    (failure === "ledger" ? m.movement : m.audit).mockRejectedValue(
      new Error("storage failure"),
    );
    await expect(collectProductionBatch(session, input)).rejects.toThrow(
      "storage failure",
    );
    expect(m.saved).toEqual({ collected: 0, version: 1, collections: 0 });
    expect(m.replenished).not.toHaveBeenCalled();
  },
);
it("replaying a committed request never moves stock or advances a batch twice", async () => {
  m.prior.mockResolvedValue({ ...input });
  await collectProductionBatch(session, input);
  expect(m.movement).not.toHaveBeenCalled();
  expect(m.cas).not.toHaveBeenCalled();
  expect(m.replenished).not.toHaveBeenCalled();
  await expect(
    collectProductionBatch(session, { ...input, quantity: 5 }),
  ).rejects.toThrow("different details");
});
it.each(["foreign", "stale", "over", "inactive", "hold", "destination", "cas"])(
  "rejects %s before committing a collection",
  async (scenario) => {
    if (scenario === "foreign") m.batch.mockResolvedValue(null);
    if (scenario === "stale")
      m.batch.mockResolvedValue({ ...batch, version: 2 });
    if (scenario === "over")
      m.batch.mockResolvedValue({ ...batch, collectedQuantity: 8 });
    if (scenario === "inactive")
      m.batch.mockResolvedValue({
        ...batch,
        location: { active: false, capabilities: ["PRODUCTION_STAGING"] },
      });
    if (scenario === "hold") m.hold.mockResolvedValue(1);
    if (scenario === "destination")
      m.target.mockResolvedValue({
        id: "yard",
        warehouseId: "destination",
        capabilities: ["STORAGE", "QUARANTINE"],
      });
    if (scenario === "cas") m.cas.mockResolvedValue({ count: 0 });
    await expect(collectProductionBatch(session, input)).rejects.toThrow();
    expect(m.movement).not.toHaveBeenCalled();
    expect(m.create).not.toHaveBeenCalled();
    expect(m.batch).toHaveBeenCalledWith({
      where: { id: "batch", organisationId: "company" },
      include: { location: true, product: { select: { trackingMode: true } } },
    });
  },
);
it("checks mutation capability and app enablement before reading business records", async () => {
  await expect(
    collectProductionBatch(
      { ...session, capabilities: new Set(["stock.read"]) },
      input,
    ),
  ).rejects.toThrow("FORBIDDEN");
  expect(m.transaction).not.toHaveBeenCalled();
  m.enabled.mockRejectedValue(new Error("disabled"));
  await expect(collectProductionBatch(session, input)).rejects.toThrow(
    "disabled",
  );
  expect(m.transaction).not.toHaveBeenCalled();
});
it.each([0, -1, 0.0000001, NaN, Infinity, 1000001])(
  "rejects invalid quantity %s without entering a transaction",
  async (quantity) => {
    await expect(
      collectProductionBatch(session, { ...input, quantity }),
    ).rejects.toThrow("six decimal places");
    expect(m.transaction).not.toHaveBeenCalled();
  },
);
it("requires a useful reference and accepts an ordinary browser form", () => {
  const form = new FormData();
  Object.entries(input).forEach(([key, value]) => form.set(key, String(value)));
  expect(readCollection(form)).toEqual({ ...input, serials: [] });
  form.set("note", "");
  expect(() => readCollection(form)).toThrow("reference");
});

it("collects fractional output exactly and treats the same request as a replay", async () => {
  m.batch.mockResolvedValue({ ...batch, quantity: 1.25 });
  const fractional = { ...input, quantity: 0.125 };
  await collectProductionBatch(session, fractional);
  expect(m.saved.collected).toBe(0.125);
  expect(m.movement.mock.calls[0][1].quantity).toBe(0.125);
  m.prior.mockResolvedValue({ ...fractional, serials: [] });
  await collectProductionBatch(session, fractional);
  expect(m.movement).toHaveBeenCalledOnce();
  expect(m.replenished).toHaveBeenCalledOnce();
});
