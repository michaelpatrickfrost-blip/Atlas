import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { assertProductsSellable } from "@/core/products/sales-eligibility";
describe("Internal manufacturing products", () => {
  it("requires tenant-owned active sellable items for a new commercial commitment", async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: "finished" }]);
    const client = { product: { findMany } } as unknown as Prisma.TransactionClient;
    await expect(assertProductsSellable(client, "tenant", ["finished", "finished", null])).resolves.toBeUndefined();
    expect(findMany).toHaveBeenCalledWith({ where: { organisationId: "tenant", id: { in: ["finished"] }, active: true, sellable: true }, select: { id: true } });
    await expect(assertProductsSellable(client, "tenant", ["finished", "internal"])).rejects.toThrow("internal");
  });
  it("allows historical free-text lines without inventing a product", async () => {
    const findMany = vi.fn();
    await expect(assertProductsSellable({ product: { findMany } } as unknown as Prisma.TransactionClient, "tenant", [null])).resolves.toBeUndefined();
    expect(findMany).not.toHaveBeenCalled();
  });
});
