import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({
  findMany: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/core/db/client", () => ({
  db: { party: { findMany } },
}));

import { listCustomers } from "@/core/customers/queries";

describe("listCustomers archive filtering", () => {
  beforeEach(() => findMany.mockClear());

  it("keeps archived customers out of the default list", async () => {
    await listCustomers("org_1");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organisationId: "org_1", archived: false, identityScrubbed: false },
      }),
    );
  });

  it("returns only archived customers for the archive section", async () => {
    await listCustomers("org_1", { filter: "archived", search: "Northbridge" });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organisationId: "org_1",
          archived: true,
          identityScrubbed: false,
          OR: [
            { name: { contains: "Northbridge", mode: "insensitive" } },
            { tradingName: { contains: "Northbridge", mode: "insensitive" } },
            { customerCode: { contains: "Northbridge", mode: "insensitive" } },
            { registrationNumber: { contains: "Northbridge", mode: "insensitive" } },
          ],
        },
      }),
    );
  });
});
