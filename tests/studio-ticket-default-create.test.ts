import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import type { TicketFieldFormManifest } from "@/core/service-work/field-form-contract";
import type { FieldFormPacket } from "@/core/studio/fields/form-packet";
const m = vi.hoisted(() => ({ company: vi.fn(), authority: vi.fn(), manifest: vi.fn(), stage: vi.fn(), replay: vi.fn(), complete: vi.fn(),
  initial: vi.fn(), insert: vi.fn(), event: vi.fn(), final: vi.fn(), redirect: vi.fn() }));
const session = { userId: "actor", organisationId: "company", membershipId: "member", capabilities: new Set(["tickets.ticket.create"]) } as Session;
const tx = { organisation: { findFirst: m.company }, serviceQueue: { findFirst: vi.fn(async () => ({ id: "queue", name: "Support", configuration: {} })) } };
vi.mock("@/core/auth/session", () => ({ requireSession: async () => session }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: async (run: (tx: Prisma.TransactionClient) => unknown) => run(tx as unknown as Prisma.TransactionClient) } }));
vi.mock("@/core/service-work/access", () => ({ requireWork: vi.fn(), workScope: vi.fn() }));
vi.mock("@/core/service-work/engine", () => ({ workNumber: async () => "TKT-1", workEvent: m.event, lockWork: vi.fn() }));
vi.mock("@/core/service-work/config", () => ({ queueConfig: () => ({ services: [], sla: { responseMinutes: 60, resolutionMinutes: 60, calendar: {} } }),
  validateAnswers: () => ({}), suggestedPriority: () => "NORMAL", FINAL_WORK: ["CLOSED"], WORK_STATUSES: ["NEW"] }));
vi.mock("@/core/service-work/sla", () => ({ addBusinessMinutes: (date: Date) => date }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.authority, nativeFieldMutationSessionInTransaction: vi.fn() }));
vi.mock("@/core/service-work/field-forms", () => ({ ticketFieldFormManifestInTransaction: m.manifest, stageTicketFieldFormPacket: m.stage,
  parseTicketFieldFormPacket: (_authority: unknown, raw: string) => JSON.parse(raw), ticketNativeFormChecksum: () => "a".repeat(64) }));
vi.mock("@/core/service-work/studio-create", () => ({ createTicketWithFieldInitialisation: m.initial }));
vi.mock("@/core/service-work/studio-native", () => ({ insertWorkWithFieldReceipt: m.insert }));
vi.mock("@/core/service-work/form-receipt", () => ({ replayTicketFormInTransaction: m.replay, completeTicketFormInTransaction: m.complete,
  throwTicketFormReceiptError: (error: unknown) => { throw error; } }));
vi.mock("@/core/service-work/studio-enforcement", () => ({ withValidatedTicketMutation: async (context: { session: Session }, _operation: string, run: (session: Session) => Promise<unknown>) => {
  const result = await run(context.session); await m.final(); return result;
} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: m.redirect }));
import { createWork } from "@/core/service-work/actions";
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const field = { definitionId: uuid(2), definitionRevision: 2, versionId: uuid(3), generationId: uuid(4), operationId: uuid(5), slotRevision: null,
  valueRevision: null, label: "Extra", help: "", storage: { type: "integer" as const }, required: false, conditionalRequired: false, value: null,
  defaultValue: { type: "integer" as const, value: 0 } };
const manifest: TicketFieldFormManifest = { schemaVersion: 1, operation: "create", operationId: uuid(1), recordRevision: null, extensionRevision: null, manifestChecksum: "b".repeat(64), fields: [field] };
const defaults: FieldFormPacket["fields"] = [{ operationId: uuid(6), definitionId: uuid(2), definitionRevision: 2, versionId: uuid(3), generationId: uuid(4), slotRevision: null,
  valueRevision: null, value: { type: "integer", value: 0 } }];
const native = { id: "created", version: 1 };
const proof = Object.freeze({});
function form(packet?: FieldFormPacket) {
  const result = new FormData(); for (const [key, value] of Object.entries({ kind: "TICKET", queueId: "queue", subject: "Request", description: "Please help" })) result.set(key, value);
  if (packet) result.set("studioFields", JSON.stringify(packet)); return result;
}
// Actual action branching/native request parsing; authentication, SQL, actual
// INSERT proof, writer/receipt and final validator are explicit collaborators.
// This suite proves orchestration/order, not database authority or atomicity.
beforeEach(() => {
  vi.clearAllMocks(); m.company.mockResolvedValue({ kind: "CUSTOMER" }); m.authority.mockResolvedValue({ session, transaction: tx });
  m.manifest.mockResolvedValue(manifest); m.stage.mockResolvedValue(defaults); m.replay.mockResolvedValue(null);
  m.insert.mockResolvedValue(native); m.initial.mockImplementation(async (context, _data, run) => ({ work: native, result: await run({ session, transaction: context.transaction }, native, proof) }));
  m.final.mockResolvedValue(undefined); m.complete.mockResolvedValue({ recordId: native.id });
});
it("legacy no-packet Ticket create supplies omitted defaults through actual owning callback and completes after final validation", async () => {
  await createWork(form());
  expect(m.initial).toHaveBeenCalledTimes(1); expect(m.insert).not.toHaveBeenCalled(); expect(m.replay).not.toHaveBeenCalled();
  const packet = m.stage.mock.calls[0][2]; expect(packet).toMatchObject({ fields: [], extensionRevision: null, manifestChecksum: manifest.manifestChecksum });
  expect(packet.operationId).not.toBe(manifest.operationId); expect(m.stage.mock.calls[0][5]).toBe(proof);
  expect(m.complete).toHaveBeenCalledWith(session, tx, expect.objectContaining({ operation: "create", packet }), { recordId: "created", recordRevision: 1, fieldRecordRevision: 1 }, defaults);
  expect(m.final.mock.invocationCallOrder[0]).toBeLessThan(m.complete.mock.invocationCallOrder[0]);
  await createWork(form()); expect(m.stage.mock.calls[1][2].operationId).not.toBe(packet.operationId); // legacy API never promised exact retries
});
it.each(["no_config", "internal"])("preserves %s native create with no default callback or whole-form receipt", async mode => {
  if (mode === "no_config") m.manifest.mockResolvedValue(null); else m.company.mockResolvedValue({ kind: "INTERNAL" });
  await createWork(form()); expect(m.insert).toHaveBeenCalledTimes(1); expect(m.initial).not.toHaveBeenCalled(); expect(m.stage).not.toHaveBeenCalled(); expect(m.complete).not.toHaveBeenCalled();
  if (mode === "internal") { expect(m.authority).not.toHaveBeenCalled(); expect(m.manifest).not.toHaveBeenCalled(); }
});
it("exact client retry occurs before current manifest/default discovery or any native initial effects", async () => {
  const packet: FieldFormPacket = { schemaVersion: 1, operationId: uuid(1), manifestChecksum: "c".repeat(64), extensionRevision: null, fields: [] };
  m.replay.mockResolvedValue({ recordId: "original", replayed: true });
  await createWork(form(packet)); expect(m.manifest).not.toHaveBeenCalled(); expect(m.initial).not.toHaveBeenCalled(); expect(m.stage).not.toHaveBeenCalled(); expect(m.complete).not.toHaveBeenCalled();
  expect(m.redirect).toHaveBeenCalledWith("/tickets/original");
});
it("final validator failure propagates before receipt completion", async () => {
  m.final.mockRejectedValue(new Error("Hidden required field missing"));
  await expect(createWork(form())).rejects.toThrow("Hidden required field missing"); expect(m.initial).toHaveBeenCalled(); expect(m.complete).not.toHaveBeenCalled();
});
