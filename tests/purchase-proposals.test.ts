import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import { Prisma } from "@/generated/prisma/client";
const state = vi.hoisted(() => ({ db: { manufacturingSupplySuggestion: { findFirst: vi.fn(), updateMany: vi.fn() }, manufacturingPlanningRun: { findFirst: vi.fn() }, auditEntry: { create: vi.fn() } }, enabled: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: state.db }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: state.enabled }));
import { supplyPurchaseProvider } from "@/modules/manufacturing/services/purchase-proposals";
const session = { organisationId: "tenant", userId: "planner", capabilities: new Set(["manufacturing.plan.read", "manufacturing.plan.firm"]) } as Session;
const row = () => ({ id: "buy", organisationId: "tenant", productId: "material", runId: "latest", quantity: new Prisma.Decimal("12.75"), updatedAt: new Date("2026-10-09T12:00:00Z"), product: { name: "Material", code: "RAW", unitOfMeasure: "kg" } });
const input = { id: "buy", version: "2026-10-09T12:00:00.000Z", documentId: "purchase", productId: "material", quantity: "12.75" };
beforeEach(() => { vi.clearAllMocks(); state.db.manufacturingSupplySuggestion.findFirst.mockResolvedValue(row()); state.db.manufacturingPlanningRun.findFirst.mockResolvedValue({ id: "latest" }); state.db.manufacturingSupplySuggestion.updateMany.mockResolvedValue({ count: 1 }); });
describe("MRP Buy handoff", () => {
  it("retains exact decimal quantities and tenant scoping", async () => {
    expect((await supplyPurchaseProvider.read(session, "buy")).quantity).toBe("12.75");
    expect(state.db.manufacturingSupplySuggestion.findFirst.mock.calls[0][0].where).toMatchObject({ organisationId: "tenant", kind: "BUY", status: "PENDING" });
  });
  it("claims once with a linked document and transaction audit", async () => {
    await supplyPurchaseProvider.claim(session, state.db as unknown as Prisma.TransactionClient, input);
    expect(state.db.manufacturingSupplySuggestion.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organisationId: "tenant", status: "PENDING", updatedAt: row().updatedAt }), data: { status: "FIRMED", resultingOrderId: "purchase" } }));
    expect(state.db.auditEntry.create).toHaveBeenCalledOnce();
  });
  it("refuses a stale plan, forged product or changed quantity before claiming", async () => {
    await expect(supplyPurchaseProvider.claim(session, state.db as unknown as Prisma.TransactionClient, { ...input, quantity: "13" })).rejects.toThrow("product and quantity");
    await expect(supplyPurchaseProvider.claim(session, state.db as unknown as Prisma.TransactionClient, { ...input, productId: "foreign" })).rejects.toThrow("product and quantity");
    state.db.manufacturingPlanningRun.findFirst.mockResolvedValue({ id: "newer" });
    await expect(supplyPurchaseProvider.read(session, "buy")).rejects.toThrow("older run");
    expect(state.db.manufacturingSupplySuggestion.updateMany).not.toHaveBeenCalled();
  });
  it("detects a concurrent conversion and never records a second successful audit", async () => {
    state.db.manufacturingSupplySuggestion.updateMany.mockResolvedValue({ count: 0 });
    await expect(supplyPurchaseProvider.claim(session, state.db as unknown as Prisma.TransactionClient, input)).rejects.toThrow("already been converted");
    expect(state.db.auditEntry.create).not.toHaveBeenCalled();
  });
  it("enforces the firm capability before any claim query", async () => {
    await expect(supplyPurchaseProvider.claim({ ...session, capabilities: new Set(["manufacturing.plan.read"]) }, state.db as unknown as Prisma.TransactionClient, input)).rejects.toThrow("FORBIDDEN");
    expect(state.db.manufacturingSupplySuggestion.findFirst).not.toHaveBeenCalled();
  });
});
