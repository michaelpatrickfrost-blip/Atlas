import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  session: {
    organisationId: "tenant-a",
    userId: "actor",
    capabilities: new Set<string>(),
  },
  tx: {
    marketingProgram: {
      findFirstOrThrow: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    auditEntry: { create: vi.fn() },
  },
  enabled: vi.fn(),
}));
vi.mock("@/core/auth/session", () => ({
  requireSession: async () => state.session,
}));
vi.mock("@/modules/marketing/services/queries", () => ({
  requireMarketing: state.enabled,
}));
vi.mock("@/core/db/client", () => ({
  db: { $transaction: async (fn: (tx: unknown) => unknown) => fn(state.tx) },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import {
  editJourneyStage,
  editJourneyStageForm,
  editJourneyTouch,
  moveJourneyStage,
  saveJourneyPath,
} from "@/modules/marketing/services/journey-workspace";
const form = (values: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries({
    journeyId: "map",
    expected: "2026-10-09T10:00:00Z",
    ...values,
  }))
    f.set(k, v);
  return f;
};
const stage = {
  id: "stage",
  name: "Choose",
  definition: { journeyId: "map", order: 0, customerIntent: "Compare" },
};
beforeEach(() => {
  vi.clearAllMocks();
  state.session.capabilities = new Set(["marketing.program.manage"]);
  state.enabled.mockResolvedValue(undefined);
  state.tx.marketingProgram.findFirstOrThrow
    .mockReset()
    .mockResolvedValueOnce({ id: "map", campaignId: null })
    .mockResolvedValue(stage);
  state.tx.marketingProgram.updateMany.mockResolvedValue({ count: 1 });
  state.tx.marketingProgram.findFirst.mockResolvedValue(null);
  state.tx.marketingProgram.create.mockResolvedValue({ id: "path" });
});
describe("Journey map command safety", () => {
  it("requires manage permission before reading a map", async () => {
    state.session.capabilities.clear();
    await expect(editJourneyStage(form({ id: "stage" }))).rejects.toThrow();
    expect(state.tx.marketingProgram.findFirstOrThrow).not.toHaveBeenCalled();
  });
  it("rejects a stale map revision before editing or auditing the stage", async () => {
    state.tx.marketingProgram.updateMany.mockResolvedValue({ count: 0 });
    await expect(editJourneyStage(form({ id: "stage" }))).rejects.toThrow(
      "changed",
    );
    expect(state.tx.marketingProgram.update).not.toHaveBeenCalled();
    expect(state.tx.auditEntry.create).not.toHaveBeenCalled();
  });
  it("binds stage changes to the tenant, parent map and audited transaction", async () => {
    await editJourneyStage(
      form({
        id: "stage",
        name: "Decision",
        customerIntent: "Compare service",
        emotion: "NEUTRAL",
        painPoint: "Slow quote",
        opportunity: "Follow up",
        successMeasure: "Quote within one day",
      }),
    );
    expect(state.tx.marketingProgram.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "map",
          organisationId: "tenant-a",
          kind: "JOURNEY_MAP",
          updatedAt: new Date("2026-10-09T10:00:00Z"),
        },
      }),
    );
    expect(state.tx.marketingProgram.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "stage", organisationId: "tenant-a" },
        data: expect.objectContaining({
          definition: expect.objectContaining({ painPoint: "Slow quote" }),
        }),
      }),
    );
    expect(state.tx.auditEntry.create).toHaveBeenCalledOnce();
  });
  it("rejects cross-map branch endpoints and duplicate paths", async () => {
    state.tx.marketingProgram.findMany.mockResolvedValue([
      stage,
      {
        ...stage,
        id: "other",
        definition: { ...stage.definition, journeyId: "foreign-map" },
      },
    ]);
    await expect(
      saveJourneyPath(
        form({
          fromStageId: "stage",
          toStageId: "other",
          label: "Needs help",
          kind: "BRANCH",
        }),
      ),
    ).rejects.toThrow("this journey");
    expect(state.tx.marketingProgram.create).not.toHaveBeenCalled();
  });
  it("archives touchpoints without erasing their history", async () => {
    state.tx.marketingProgram.findFirstOrThrow
      .mockReset()
      .mockResolvedValueOnce({ id: "map" })
      .mockResolvedValueOnce({
        id: "touch",
        definition: {
          journeyId: "map",
          stageId: "stage",
          channel: "Email",
          moment: "Follow up",
          owner: "Sales",
        },
      });
    await editJourneyTouch(form({ id: "touch", remove: "yes" }));
    expect(state.tx.marketingProgram.update).toHaveBeenCalledWith({
      where: { id: "touch", organisationId: "tenant-a" },
      data: { status: "ARCHIVED" },
    });
    expect(state.tx.auditEntry.create).toHaveBeenCalledOnce();
  });
  it("keeps reordering inside the selected map and normalises every stage rank", async () => {
    state.tx.marketingProgram.findMany.mockResolvedValue([
      stage,
      { ...stage, id: "next", definition: { ...stage.definition, order: 1 } },
    ]);
    await moveJourneyStage(form({ id: "next", direction: "left" }));
    expect(state.tx.marketingProgram.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organisationId: "tenant-a",
          definition: { path: ["journeyId"], equals: "map" },
        }),
      }),
    );
    expect(
      state.tx.marketingProgram.update.mock.calls.map((call) => [
        call[0].where.id,
        call[0].data.definition.order,
      ]),
    ).toEqual([
      ["next", 0],
      ["stage", 1],
    ]);
  });
});

it("returns a safe stale-write message for production forms", async () => {
  state.tx.marketingProgram.updateMany.mockResolvedValueOnce({ count: 0 });
  await expect(
    editJourneyStageForm(
      form({ id: "stage", name: "Awareness", emotion: "UNKNOWN" }),
    ),
  ).resolves.toEqual({
    error: "This journey changed. Refresh before saving your changes.",
  });
});
