import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  session: {
    userId: "rep",
    organisationId: "org",
    capabilities: new Set<string>(),
  },
  record: {} as Record<string, unknown>,
  update: vi.fn(),
  enabled: vi.fn(),
  activity: vi.fn(),
  emit: vi.fn(),
}));
vi.mock("@/core/auth/session", () => ({
  requireSession: async () => state.session,
}));
vi.mock("@/core/modules/access", () => ({
  assertModuleEnabled: state.enabled,
}));
vi.mock("@/core/db/client", () => ({
  db: { salesActivity: { update: state.update } },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/core/activity/log", () => ({ writeActivity: state.activity }));
vi.mock("@/core/events/bus", () => ({
  emit: state.emit,
  DOMAIN_EVENTS: { salesActivityCompleted: "sales.activity.completed" },
}));
import { completeActivity } from "@/modules/crm/services/activities";

beforeEach(() => {
  vi.clearAllMocks();
  state.session.capabilities = new Set(["sales.activity.manage"]);
  state.enabled.mockResolvedValue(undefined);
  state.record = {
    id: "activity",
    organisationId: "org",
    ownerUserId: "rep",
    subject: "Customer call",
    partyId: "customer",
    endsAt: null,
    completedAt: null,
    cancelledAt: null,
    version: 1,
    outcome: null,
  };
  state.update.mockImplementation(
    async ({
      where,
      data,
    }: {
      where: Record<string, unknown>;
      data: {
        completedAt: Date;
        outcome?: string;
        version: { increment: number };
      };
    }) => {
      if (
        !Object.entries(where).every(
          ([key, value]) => state.record[key] === value,
        )
      )
        throw Object.assign(new Error("Activity unavailable"), {
          code: "P2025",
        });
      state.record = {
        ...state.record,
        completedAt: data.completedAt,
        outcome: data.outcome,
        version: Number(state.record.version) + data.version.increment,
      };
      return state.record;
    },
  );
});

it("keeps booked appointments out of the legacy completion path", async () => {
  state.record.endsAt = new Date("2030-10-09T15:00:00Z");
  await expect(completeActivity("activity", "Bypass diary")).rejects.toThrow(
    "unavailable",
  );
  expect(state.record.completedAt).toBeNull();
  expect(state.record.version).toBe(1);
  expect(state.activity).not.toHaveBeenCalled();
  expect(state.emit).not.toHaveBeenCalled();
});

it("cannot complete cancelled activity through the older action", async () => {
  state.record.cancelledAt = new Date();
  await expect(completeActivity("activity")).rejects.toThrow("unavailable");
  expect(state.record.completedAt).toBeNull();
});

it("retains rep owner restrictions on the older action", async () => {
  state.record.ownerUserId = "manager";
  await expect(completeActivity("activity")).rejects.toThrow("unavailable");
  expect(state.record.completedAt).toBeNull();
});

it("permits authorised legacy completion once and advances the version", async () => {
  state.session.capabilities.add("sales.pipeline.manage");
  state.record.ownerUserId = "manager";
  await completeActivity("activity", "Follow-up agreed");
  const completion = state.record.completedAt;
  expect(completion).toBeInstanceOf(Date);
  expect(state.record.outcome).toBe("Follow-up agreed");
  expect(state.record.version).toBe(2);
  expect(state.activity).toHaveBeenCalledTimes(1);
  expect(state.emit).toHaveBeenCalledTimes(1);
  await expect(completeActivity("activity", "Replay")).rejects.toThrow(
    "unavailable",
  );
  expect(state.record.completedAt).toBe(completion);
  expect(state.record.outcome).toBe("Follow-up agreed");
  expect(state.emit).toHaveBeenCalledTimes(1);
});

it("requires the activity capability before reading or writing", async () => {
  state.session.capabilities.clear();
  await expect(completeActivity("activity")).rejects.toThrow("FORBIDDEN");
  expect(state.update).not.toHaveBeenCalled();
});

it("keeps legacy completion inside the signed tenant", async () => {
  state.session.capabilities.add("sales.pipeline.manage");
  state.record.organisationId = "other";
  await expect(completeActivity("activity")).rejects.toThrow("unavailable");
  expect(state.record.completedAt).toBeNull();
});

it("requires an enabled CRM before legacy completion", async () => {
  state.enabled.mockRejectedValueOnce(new Error("CRM disabled"));
  await expect(completeActivity("activity")).rejects.toThrow("disabled");
  expect(state.update).not.toHaveBeenCalled();
});
