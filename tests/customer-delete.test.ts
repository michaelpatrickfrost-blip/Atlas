import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  findParty: vi.fn(),
  findOwnedParty: vi.fn(),
  deleteParty: vi.fn(),
  updateParty: vi.fn(),
  findContact: vi.fn(),
  deleteContact: vi.fn(),
  updateContact: vi.fn(),
  writeAudit: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/core/auth/session", () => ({
  requireSession: async () => ({ userId: "user_1", organisationId: "org_1" }),
}));
vi.mock("@/core/permissions/check", () => ({ assertCapability: vi.fn() }));
vi.mock("@/core/db/client", () => ({
  db: {
    party: {
      findFirstOrThrow: mocks.findParty,
      findFirst: mocks.findOwnedParty,
      delete: mocks.deleteParty,
      update: mocks.updateParty,
    },
    contact: {
      findFirstOrThrow: mocks.findContact,
      delete: mocks.deleteContact,
      update: mocks.updateContact,
    },
  },
}));
vi.mock("@/core/audit/log", () => ({ writeAudit: mocks.writeAudit }));
vi.mock("@/core/activity/log", () => ({ writeActivity: vi.fn() }));
vi.mock("@/core/events/bus", () => ({
  emit: vi.fn(),
  DOMAIN_EVENTS: {
    customerCreated: "customer.created",
    customerActivated: "customer.activated",
    customerContactCreated: "customer.contact.created",
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { deleteContact, deleteCustomer } from "@/core/customers/commands";

function foreignKeyError() {
  return new Prisma.PrismaClientKnownRequestError("Foreign key constraint", {
    code: "P2003",
    clientVersion: "test",
  });
}

describe("customer and contact deletion fallbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findParty.mockResolvedValue({ id: "party_1", status: "ACTIVE", name: "Example Ltd" });
    mocks.findOwnedParty.mockResolvedValue({ id: "party_1" });
    mocks.findContact.mockResolvedValue({
      id: "contact_1",
      firstName: "Ari",
      surname: "Example",
      status: "ACTIVE",
    });
  });

  it("closes a customer with historical links without returning a failed action", async () => {
    mocks.deleteParty.mockRejectedValueOnce(foreignKeyError());
    mocks.updateParty.mockResolvedValue({ status: "CLOSED" });

    await expect(deleteCustomer("party_1")).resolves.toBeUndefined();

    expect(mocks.deleteParty).toHaveBeenCalledWith({
      where: { id: "party_1", organisationId: "org_1" },
    });
    expect(mocks.updateParty).toHaveBeenCalledWith({
      where: { id: "party_1" },
      data: { status: "CLOSED" },
    });
    expect(mocks.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "customer.deleted", after: { status: "CLOSED" } }),
    );
  });

  it("deactivates a contact with historical links and revalidates its customer", async () => {
    mocks.deleteContact.mockRejectedValueOnce(foreignKeyError());
    mocks.updateContact.mockResolvedValue({ status: "INACTIVE" });

    await expect(deleteContact("contact_1", "party_1")).resolves.toBeUndefined();

    expect(mocks.updateContact).toHaveBeenCalledWith({
      where: { id: "contact_1" },
      data: { status: "INACTIVE" },
    });
    expect(mocks.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "customer.contact.deactivated",
        after: { status: "INACTIVE" },
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/customers/party_1");
  });

  it("does not turn unrelated database failures into a close/deactivation", async () => {
    const databaseError = new Error("Database unavailable");
    mocks.deleteParty.mockRejectedValueOnce(databaseError);

    await expect(deleteCustomer("party_1")).rejects.toBe(databaseError);
    expect(mocks.updateParty).not.toHaveBeenCalled();
  });
});
