import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  family: vi.fn(),
  parties: vi.fn(),
  users: vi.fn(),
  links: vi.fn(),
}));
vi.mock("@/core/db/client", () => ({
  db: {
    $queryRaw: m.family,
    party: { findMany: m.parties },
    user: { findMany: m.users },
    customerTradingLink: { findMany: m.links },
  },
}));
import { loadCustomerMap } from "@/core/customers/map-data";
beforeEach(() => {
  vi.clearAllMocks();
  m.users.mockResolvedValue([]);
  m.links.mockResolvedValue([]);
});
it("binds the family query to customer and tenant and excludes unrelated contacts from the payload", async () => {
  m.family.mockResolvedValue([{ id: "focus" }]);
  m.parties
    .mockResolvedValueOnce([
      {
        id: "focus",
        name: "Customer",
        customerCode: "C",
        parentPartyId: null,
        hierarchyRole: "CUSTOMER",
        customerGroup: null,
        status: "ACTIVE",
        accountManagerUserId: null,
        contacts: [
          {
            id: "person",
            partyId: "focus",
            firstName: "Alex",
            surname: "Buyer",
            jobTitle: null,
            reportsToContactId: null,
          },
        ],
      },
    ])
    .mockResolvedValueOnce([
      {
        id: "other",
        name: "Other",
        customerCode: "O",
        parentPartyId: null,
        hierarchyRole: "CUSTOMER",
        customerGroup: null,
        status: "ACTIVE",
      },
    ]);
  const map = await loadCustomerMap("tenant-a", false, "focus");
  expect(m.family.mock.calls[0].slice(1)).toEqual([
    "focus",
    "tenant-a",
    "tenant-a",
  ]);
  expect(m.parties.mock.calls[0][0].where).toMatchObject({
    organisationId: "tenant-a",
    identityScrubbed: false,
    id: { in: ["focus"] },
  });
  expect(map.accounts.map((account) => account.id)).toEqual(["focus"]);
  expect(map.people.map((person) => person.partyId)).toEqual(["focus"]);
  expect(map.choices[0].id).toBe("other");
  expect(map.choices[0]).not.toHaveProperty("contacts");
  expect(m.links).not.toHaveBeenCalled();
});
it("keeps the selected account in a bounded large family and signals truncation", async () => {
  const parties = Array.from({ length: 501 }, (_, i) => ({
    id: `p${i}`,
    name: `Account ${i}`,
    customerCode: `C${i}`,
    parentPartyId: null,
    hierarchyRole: "CUSTOMER",
    customerGroup: null,
    status: "ACTIVE",
    accountManagerUserId: null,
    contacts: [],
  }));
  m.family.mockResolvedValue(parties.map(({ id }) => ({ id })));
  m.parties.mockResolvedValueOnce(parties).mockResolvedValueOnce([]);
  const map = await loadCustomerMap("tenant-a", false, "p500");
  expect(map.accounts).toHaveLength(500);
  expect(map.accounts.some((account) => account.id === "p500")).toBe(true);
  expect(map.truncated).toBe(true);
});
