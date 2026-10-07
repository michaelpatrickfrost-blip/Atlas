import { describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ parties: vi.fn().mockResolvedValue([]), users: vi.fn().mockResolvedValue([]), links: vi.fn().mockResolvedValue([]) }));
vi.mock("@/core/db/client", () => ({ db: { party: { findMany: state.parties }, user: { findMany: state.users }, customerTradingLink: { findMany: state.links } } }));
import { loadCustomerMap } from "@/core/customers/map-data";
describe("Customer Map deleted records", () => {
  it("keeps scrubbed account/contact identities and invoice endpoints out of the tenant map", async () => {
    await loadCustomerMap("tenant", true);
    expect(state.parties).toHaveBeenCalledWith(expect.objectContaining({ where: { organisationId: "tenant", identityScrubbed: false }, select: expect.objectContaining({ contacts: expect.objectContaining({ where: { status: "ACTIVE", identityScrubbed: false } }) }) }));
    expect(state.links).toHaveBeenCalledWith(expect.objectContaining({ where: { organisationId: "tenant", active: true, account: { identityScrubbed: false }, tradingAccount: { identityScrubbed: false } } }));
  });
});
