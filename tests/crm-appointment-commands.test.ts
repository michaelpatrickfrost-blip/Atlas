import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  session: {
    organisationId: "tenant-a",
    userId: "rep",
    capabilities: new Set<string>(),
  },
  tx: {
    membership: { findFirstOrThrow: vi.fn() },
    party: { findFirstOrThrow: vi.fn() },
    prospect: { findFirstOrThrow: vi.fn() },
    opportunity: { findFirstOrThrow: vi.fn() },
    salesActivity: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findFirstOrThrow: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    auditEntry: { create: vi.fn() },
    activity: { create: vi.fn() },
  },
  enabled: vi.fn(),
}));
vi.mock("@/core/auth/session", () => ({
  requireSession: async () => state.session,
}));
vi.mock("@/core/modules/access", () => ({
  assertModuleEnabled: state.enabled,
}));
vi.mock("@/core/db/client", () => ({
  db: { $transaction: async (fn: (tx: unknown) => unknown) => fn(state.tx) },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import {
  saveAppointment,
  finishAppointment,
  saveAppointmentForm,
  finishAppointmentForm,
} from "@/modules/crm/services/appointments";
const values = {
  requestKey: "6f119a62-5fca-4ca3-b03d-632e0518a74f",
  subject: "Customer visit",
  type: "SITE_VISIT",
  startsAt: "2026-10-09T09:00:00Z",
  endsAt: "2026-10-09T10:00:00Z",
  partyId: "account",
};
const form = (extra: Record<string, string> = {}) => {
  const f = new FormData();
  for (const [k, v] of Object.entries({ ...values, ...extra })) f.set(k, v);
  return f;
};
beforeEach(() => {
  vi.clearAllMocks();
  state.session.capabilities = new Set([
    "sales.activity.manage",
    "sales.opportunity.read",
    "customers.read",
  ]);
  state.enabled.mockResolvedValue(undefined);
  state.tx.membership.findFirstOrThrow.mockResolvedValue({ userId: "rep" });
  state.tx.party.findFirstOrThrow.mockResolvedValue({ id: "account" });
  state.tx.salesActivity.findUnique.mockResolvedValue(null);
  state.tx.salesActivity.findFirst.mockResolvedValue(null);
  state.tx.salesActivity.findFirstOrThrow.mockResolvedValue({
    id: "appointment",
    partyId: "account",
    cancelledAt: null,
    completedAt: null,
  });
  state.tx.salesActivity.create.mockImplementation(async ({ data }) => ({
    ...data,
    id: "appointment",
    version: 1,
  }));
  state.tx.salesActivity.updateMany.mockResolvedValue({ count: 1 });
});
describe("Appointment persistence boundaries", () => {
  it("authorises before any record lookup and refuses disabled CRM", async () => {
    state.session.capabilities.clear();
    await expect(saveAppointment(form())).rejects.toThrow();
    expect(state.tx.membership.findFirstOrThrow).not.toHaveBeenCalled();
    state.session.capabilities.add("sales.activity.manage");
    state.enabled.mockRejectedValue(new Error("CRM disabled"));
    await expect(saveAppointment(form())).rejects.toThrow("disabled");
    expect(state.tx.salesActivity.create).not.toHaveBeenCalled();
  });
  it("creates one tenant-owned activity and atomic metadata audit/customer timeline", async () => {
    await saveAppointment(form());
    expect(state.tx.party.findFirstOrThrow).toHaveBeenCalledWith({
      where: {
        id: "account",
        organisationId: "tenant-a",
        identityScrubbed: false,
        archived: false,
      },
    });
    expect(state.tx.salesActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organisationId: "tenant-a",
          ownerUserId: "rep",
          partyId: "account",
          endsAt: new Date(values.endsAt),
        }),
      }),
    );
    expect(state.tx.auditEntry.create).toHaveBeenCalledOnce();
    expect(state.tx.activity.create).toHaveBeenCalledOnce();
  });
  it("prevents another owner and refuses overlaps before writing", async () => {
    await expect(
      saveAppointment(form({ ownerUserId: "another" })),
    ).rejects.toThrow("own appointments");
    state.tx.salesActivity.findFirst.mockResolvedValue({
      subject: "Existing visit",
    });
    await expect(saveAppointment(form())).rejects.toThrow("overlaps");
    expect(state.tx.salesActivity.create).not.toHaveBeenCalled();
  });
  it("deduplicates the same save while rejecting a reused key with different data", async () => {
    const previous = {
      id: "appointment",
      ownerUserId: "rep",
      subject: values.subject,
      dueAt: new Date(values.startsAt),
      endsAt: new Date(values.endsAt),
      partyId: "account",
      prospectId: null,
      opportunityId: null,
      location: null,
      notes: null,
      type: values.type,
    };
    state.tx.salesActivity.findUnique.mockResolvedValue(previous);
    await saveAppointment(form());
    expect(state.tx.salesActivity.create).not.toHaveBeenCalled();
    expect(state.tx.auditEntry.create).not.toHaveBeenCalled();
    await expect(
      saveAppointment(form({ subject: "Changed visit" })),
    ).rejects.toThrow("different appointment");
  });
  it("forces the rep owner and submitted version on completion, and rejects stale writes", async () => {
    state.tx.salesActivity.updateMany.mockResolvedValue({ count: 0 });
    const f = new FormData();
    f.set("id", "appointment");
    f.set("version", "2");
    f.set("outcome", "Follow up next week");
    await expect(finishAppointment(f)).rejects.toThrow("changed");
    expect(state.tx.salesActivity.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organisationId: "tenant-a",
          ownerUserId: "rep",
        }),
      }),
    );
    expect(state.tx.salesActivity.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organisationId: "tenant-a",
          version: 2,
          cancelledAt: null,
          completedAt: null,
        }),
      }),
    );
    expect(state.tx.auditEntry.create).not.toHaveBeenCalled();
  });
  it("validates linked deal ownership and rejects a mismatched account", async () => {
    state.tx.opportunity.findFirstOrThrow.mockResolvedValue({
      partyId: "other",
    });
    await expect(
      saveAppointment(form({ opportunityId: "deal" })),
    ).rejects.toThrow("belonging");
    expect(state.tx.opportunity.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organisationId: "tenant-a",
          ownerUserId: "rep",
        }),
      }),
    );
    expect(state.tx.salesActivity.create).not.toHaveBeenCalled();
  });
});

it("returns safe production feedback for input conflicts without exposing unexpected errors", async () => {
  state.tx.salesActivity.findFirst.mockResolvedValue({
    subject: "Existing visit",
  });
  await expect(saveAppointmentForm(form())).resolves.toEqual({
    error: "This time overlaps “Existing visit”. Choose another time.",
  });
  state.tx.membership.findFirstOrThrow.mockRejectedValueOnce(
    new Error("private database details"),
  );
  await expect(saveAppointmentForm(form())).rejects.toThrow(
    "private database details",
  );
  const f = new FormData();
  f.set("id", "appointment");
  f.set("version", "1");
  await expect(finishAppointmentForm(f)).resolves.toEqual({
    error: "Record an outcome of up to 3,000 characters.",
  });
});
