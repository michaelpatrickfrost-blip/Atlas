import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  findParty: vi.fn(),
  findOwnedParty: vi.fn(),
  deleteParty: vi.fn(),
  findContact: vi.fn(),
  deleteContact: vi.fn(),
  writeAudit: vi.fn(),
  revalidatePath: vi.fn(),
  tx: {
    fieldServiceJob: { updateMany: vi.fn() },
    fieldServiceEntry: { updateMany: vi.fn() },
    address: { updateMany: vi.fn() },
    communicationDestination: { updateMany: vi.fn() },
    contact: { findMany: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    marketingProfile: { updateMany: vi.fn() },
    taxRegistration: { updateMany: vi.fn() },
    directDebitMandate: { findMany: vi.fn(), update: vi.fn() },
    bankAccount: { updateMany: vi.fn() },
    document: { updateMany: vi.fn() },
    note: { deleteMany: vi.fn() },
    customerCommercialSettings: { deleteMany: vi.fn() },
    customerCreditProfile: { deleteMany: vi.fn() },
    party: { updateMany: vi.fn(), update: vi.fn() },
    activity: { updateMany: vi.fn() },
    echoNote: { updateMany: vi.fn() },
    auditEntry: { updateMany: vi.fn() },
  },
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
    },
    contact: {
      findFirstOrThrow: mocks.findContact,
      delete: mocks.deleteContact,
    },
    $transaction: (callback: (tx: typeof mocks.tx) => Promise<unknown>) => callback(mocks.tx),
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
    mocks.findParty.mockResolvedValue({
      id: "party_1",
      status: "ACTIVE",
      name: "Example Ltd",
      identityScrubbed: false,
      parentPartyId: null,
    });
    mocks.findOwnedParty.mockResolvedValue({ id: "party_1" });
    mocks.tx.contact.findMany.mockResolvedValue([]);
    mocks.tx.directDebitMandate.findMany.mockResolvedValue([]);
    mocks.findContact.mockResolvedValue({
      id: "contact_1",
      firstName: "Ari",
      surname: "Example",
      status: "ACTIVE",
      identityScrubbed: false,
    });
  });

  it("scrubs customer details when historical links prevent physical removal", async () => {
    mocks.deleteParty.mockRejectedValueOnce(foreignKeyError());

    await expect(deleteCustomer("party_1")).resolves.toBeUndefined();

    expect(mocks.deleteParty).toHaveBeenCalledWith({
      where: { id: "party_1", organisationId: "org_1" },
    });
    expect(mocks.tx.party.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "party_1", organisationId: "org_1" },
        data: expect.objectContaining({
          name: "Deleted customer",
          status: "CLOSED",
          archived: true,
          identityScrubbed: true,
        }),
      }),
    );
    expect(mocks.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "customer.scrubbed",
        after: { status: "CLOSED", archived: true, identityScrubbed: true },
      }),
    );
  });

  it("scrubs contact details when linked history prevents physical removal", async () => {
    mocks.deleteContact.mockRejectedValueOnce(foreignKeyError());

    await expect(deleteContact("contact_1", "party_1")).resolves.toBeUndefined();

    expect(mocks.tx.contact.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "contact_1", partyId: "party_1" },
        data: expect.objectContaining({
          firstName: "Deleted",
          surname: "Contact",
          email: null,
          status: "INACTIVE",
          identityScrubbed: true,
        }),
      }),
    );
    expect(mocks.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "customer.contact.scrubbed",
        after: { status: "INACTIVE", identityScrubbed: true },
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/customers/party_1");
  });

  it("lets a previously closed customer retry deletion and scrub", async () => {
    mocks.findParty.mockResolvedValueOnce({
      id: "party_1",
      status: "CLOSED",
      name: "Example Ltd",
      identityScrubbed: false,
      parentPartyId: null,
    });
    mocks.deleteParty.mockRejectedValueOnce(foreignKeyError());

    await expect(deleteCustomer("party_1")).resolves.toBeUndefined();
    expect(mocks.tx.party.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ identityScrubbed: true }),
      }),
    );
  });

  it("does not turn unrelated database failures into a successful scrub", async () => {
    const databaseError = new Error("Database unavailable");
    mocks.deleteParty.mockRejectedValueOnce(databaseError);

    await expect(deleteCustomer("party_1")).rejects.toBe(databaseError);
    expect(mocks.tx.party.update).not.toHaveBeenCalled();
  });
});

it('erases copied field service address/contact and notes when canonical identity is scrubbed',async()=>{mocks.findParty.mockResolvedValue({id:'party_1',identityScrubbed:false});mocks.deleteParty.mockRejectedValue(foreignKeyError());mocks.tx.contact.findMany.mockResolvedValue([]);mocks.tx.directDebitMandate.findMany.mockResolvedValue([]);await deleteCustomer('party_1');expect(mocks.tx.fieldServiceJob.updateMany).toHaveBeenCalledWith(expect.objectContaining({where:{organisationId:'org_1',partyId:'party_1'},data:expect.objectContaining({site:'Deleted address',contactName:null,contactPhone:null,resolution:null,status:'CANCELLED'})}));expect(mocks.tx.fieldServiceEntry.updateMany).toHaveBeenCalledWith({where:{organisationId:'org_1',job:{partyId:'party_1'}},data:{body:'Content removed after customer identity scrub'}});});
