import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import type { PageApprovals } from "@/core/studio/pages/approvals";
import { compilePage } from "@/core/studio/pages/compiler";
import { checksum } from "@/core/studio/registry/contracts";
const m = vi.hoisted(() => ({ stamps: new WeakMap<object, object>(), refresh: vi.fn(), withAuthority: vi.fn(), profile: vi.fn(), owner: vi.fn(), version: vi.fn(), definition: vi.fn(), read: vi.fn(), approvals: vi.fn(), resolve: vi.fn(), invoke: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ sessionAuthorityStamp: (session: object) => m.stamps.get(session) }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh, withFieldRuntimeAuthority: m.withAuthority }));
vi.mock("@/core/studio/record-types/runtime-profile", () => ({ resolveRecordProfileInTransaction: m.profile }));
vi.mock("@/core/studio/pages/server-approvals", () => ({ reconstructPageApprovalsInTransaction: m.approvals }));
vi.mock("@/core/studio/pages/runtime", () => ({ readPublishedPageInTransaction: m.read }));
import { readRecordDefaultCustomerPage, readRecordDefaultCustomerPageInTransaction, prepareVisibleRecordDefaultActionInTransaction, prepareVisibleRecordDefaultSurfaceInTransaction, recordDefaultCustomerPageTarget, recordDefaultCustomerPageTargetInTransaction } from "@/core/studio/pages/record-default";

// Real strict Page compiler and exact retained configuration seal/edge verifier.
// Native owner/private access, fresh identity, canonical assignment/profile and
// shared field/data reader are explicit collaborators; no SQL/live proof inferred.
const uuid = (n: number) => `70000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ref = (id: string, version = 1) => ({ id, version, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) });
const entity = ref("tickets.ticket", 9), storedSource = ref("tickets.ticket.page"), currentSource = ref("tickets.ticket.page", 2), header = ref("tickets.ticket.page.header");
const command = ref("tickets.ticket.preview"), surface = ref("tickets.ticket.progress_form");
const identity = { ownerModuleId: "tickets", capability: "tickets.ticket.read", classification: "confidential" as const };
const source = { ...entity, ...identity, label: "Tickets", kind: "entity" as const };
const session: Session = { userId: "actor", organisationId: "company", membershipId: "member", userName: "Actor", userEmail: "actor@example.test",
  organisationName: "Company", capabilities: new Set(["tickets.ticket.read"]) };
const stamp = { userId: session.userId, organisationId: session.organisationId, membershipId: session.membershipId, authVersion: 1, sessionVersion: 1 };
const anchor = { kind: "record" as const, organisationId: "company", recordId: "native-ticket", revision: "3@2026-10-11T12:00:00Z", nativeRevision: 3 };
const tx = { studioDefinitionVersion: { findFirst: m.version }, studioDefinition: { findFirst: m.definition } } as unknown as Prisma.TransactionClient;
const registry = { describe: vi.fn(() => source), describePageSourceForEntity: vi.fn(() => ({ metadata: { ...currentSource, ...identity, kind: "surface" }, source })),
  authorisePageRead: m.owner, resolve: m.resolve, invoke: m.invoke } as unknown as FieldRuntimeAuthority["registry"];
const authority: FieldRuntimeAuthority = { session, stamp, transaction: tx, registry };
const input = { mode: "record_default", entityId: "tickets.ticket", recordId: "native-ticket", formFactor: "phone" };
let stored: ReturnType<typeof version>, pin: { kind: "page"; definitionId: string; versionId: string; schemaVersion: number; checksum: string };
const fingerprint = "c".repeat(64), profile = () => ({ baseProfile: null, recordType: null, assignmentId: null, fingerprint,
  profile: { page: pin, requiredFields: [], allowedProcesses: [], defaultDecisions: [] } });
function version() {
  const approvals: PageApprovals = { entity: { ...entity, ...identity, kind: "entity" }, sourcePage: { ...storedSource, ...identity, kind: "surface" }, variants: true, fieldSourceVersions: [9],
    nativeFields: [{ id: "subject", classification: "confidential", editable: false, query: header }], customFields: [], facts: [], contracts: [],
    commands: [{ ...command, ...identity, kind: "command", sourceEntityId: entity.id, confirmation: "required", previewQuery: null, formFactors: ["phone"] }], metrics: [],
    surfaces: [{ ...surface, ...identity, kind: "surface", sourceEntityId: entity.id, family: "module", queries: [], formFactors: ["phone"] }], maxQueryCost: 4,
    queries: [{ ...header, ...identity, kind: "query", sourceEntityId: entity.id, purpose: "fact", pagination: "none", maxCardinality: 1, costClass: "low",
      columns: [{ id: "subject", classification: "confidential" }] }] };
  const plan = compilePage({ schemaVersion: 1, entity, formFactors: ["desktop", "tablet", "phone"], sections: [{ id: "main", label: "Details",
    formFactors: ["desktop", "tablet", "phone"], columns: { desktop: 1, tablet: 1, phone: 1 }, components: [{ id: "details", type: "fields", label: "Details",
      formFactors: ["desktop", "tablet", "phone"], fields: [{ source: "native", fieldId: "subject", mode: "read" }] },
      { id: "preview", type: "action", label: "Preview", command, collectInput: "owner_schema", confirm: true, preview: false, formFactors: ["phone"] },
      { id: "progress", type: "surface", label: "Update ticket", surface, family: "module", formFactors: ["phone"] }] }], variants: [] }, approvals);
  return { id: uuid(2), definitionId: uuid(1), organisationId: "company", schemaVersion: 1, payload: plan.payload, compiledPlan: plan,
    checksum: checksum(plan), definition: { kind: "page", retiredAt: null as Date | null }, configurationDependencies: [] };
}
beforeEach(() => {
  vi.clearAllMocks(); m.stamps.set(session, stamp); m.refresh.mockResolvedValue(authority); m.withAuthority.mockImplementation(async (_authenticated, callback) => callback(authority));
  stored = version(); pin = { kind: "page", definitionId: stored.definitionId, versionId: stored.id, schemaVersion: 1, checksum: stored.checksum };
  m.approvals.mockImplementation(async () => stored.compiledPlan.approvals);
  m.profile.mockImplementation(async () => profile()); m.owner.mockResolvedValue({ source, anchor, policy: { queries: [{ query: header, scope: "record", purpose: "fact" }],
    commands: [{ command, confirmation: "required", formFactors: ["phone"] }], surfaces: [{ surface, family: "module", formFactors: ["phone"] }] } });
  m.version.mockImplementation(async ({ where }) => where.id === stored.id && where.definitionId === stored.definitionId && where.organisationId === stored.organisationId ? stored : null);
  m.definition.mockResolvedValue({ id: uuid(1), organisationId: "company", name: "Ticket layout", revision: 10 });
  m.resolve.mockImplementation(async (principal, reference) => ({ ...reference, ownerModuleId: "tickets", kind: reference.id === command.id ? "command" : "surface", details: { sideEffect: "none" } }));
  m.read.mockResolvedValue({ formFactor: "phone", variantId: null, sections: [] });
});
it("uses the exact profile-selected retained Page and genuine current native/profile rights without following its active pointer", async () => {
  const view = await readRecordDefaultCustomerPageInTransaction(authority, input);
  expect(view).toMatchObject({ mode: "record_default", definitionId: uuid(1), versionId: uuid(2), definitionRevision: 10, profileFingerprint: fingerprint,
    recordId: "native-ticket", entityId: "tickets.ticket", nativeRevision: 3, recordTypeDefinitionId: null });
  expect(m.owner).toHaveBeenNthCalledWith(1, { session, transaction: tx }, currentSource, { kind: "record", recordId: "native-ticket" });
  expect(m.owner).toHaveBeenNthCalledWith(2, { session, transaction: tx }, storedSource, { kind: "record", recordId: "native-ticket" });
  expect(m.profile).toHaveBeenCalledWith(authority, { entity, recordId: "native-ticket", expectedRevision: 3 }, { kind: "ordinary" });
  expect(m.owner.mock.invocationCallOrder[0]).toBeLessThan(m.profile.mock.invocationCallOrder[0]);
  expect(m.profile.mock.invocationCallOrder[0]).toBeLessThan(m.version.mock.invocationCallOrder[0]);
  expect(m.read).toHaveBeenCalledWith(authority, { page: pin, request: { kind: "record", recordId: "native-ticket" }, formFactor: "phone", cursors: {} });
  expect(m.definition.mock.calls[0][0]).toEqual({ where: { id: uuid(1), organisationId: "company", kind: "page", retiredAt: null },
    select: { id: true, organisationId: true, name: true, revision: true } });
  expect(view).not.toHaveProperty("page"); expect(view).not.toHaveProperty("authority");
});
it("wrapper reuses one fresh ordinary authority transaction without needing Studio authoring permissions", async () => {
  await readRecordDefaultCustomerPage(session, input);
  expect(m.withAuthority).toHaveBeenCalledWith(session, expect.any(Function)); expect(m.refresh).not.toHaveBeenCalled();
});
it("propagates the stable current type and validated component cursors from the canonical resolver", async () => {
  m.profile.mockResolvedValue({ ...profile(), recordType: { kind: "recordType", definitionId: uuid(8), versionId: uuid(9), schemaVersion: 1, checksum: "d".repeat(64) } });
  const view = await readRecordDefaultCustomerPageInTransaction(authority, { ...input, cursors: { child: { id: "next" } } });
  expect(view?.recordTypeDefinitionId).toBe(uuid(8)); expect(m.read.mock.calls[0][1].cursors).toEqual({ child: { id: "next" } });
});
it("returns no layout only after authorized current profile explicitly has no Page, keeping native detail available", async () => {
  m.profile.mockResolvedValue({ ...profile(), profile: null });
  expect(await readRecordDefaultCustomerPageInTransaction(authority, input)).toBeNull();
  expect(m.owner).toHaveBeenCalledTimes(1); expect(m.profile).toHaveBeenCalledOnce(); expect(m.version).not.toHaveBeenCalled(); expect(m.read).not.toHaveBeenCalled();
  await expect(readRecordDefaultCustomerPageInTransaction(authority, { ...input, definitionId: uuid(1) })).rejects.toThrow("CONFLICT");
});
it.each([{ definitionId: uuid(3) }, { expectedVersionId: uuid(3) }, { expectedDefinitionRevision: 9 },
  { expectedProfileFingerprint: "d".repeat(64) }, { expectedNativeRevision: 2 }])("stale route/selection assertions never select another Page %#", async extra => {
  await expect(readRecordDefaultCustomerPageInTransaction(authority, { ...input, ...extra })).rejects.toThrow("CONFLICT");
  expect(m.read).not.toHaveBeenCalled();
});
it.each(["kind", "tenant", "record", "entity", "nativeRevision"])("denies wrong initial native owner %s before profile metadata", async mode => {
  const owner = { source: { ...source }, anchor: { ...anchor } };
  if (mode === "kind") Object.assign(owner.anchor, { kind: "list" });
  if (mode === "tenant") owner.anchor.organisationId = "foreign";
  if (mode === "record") owner.anchor.recordId = "other";
  if (mode === "entity") owner.source.id = "sales.order";
  if (mode === "nativeRevision") Object.assign(owner.anchor, { nativeRevision: undefined });
  m.owner.mockResolvedValueOnce(owner);
  await expect(readRecordDefaultCustomerPageInTransaction(authority, input)).rejects.toThrow("unavailable");
  expect(m.profile).not.toHaveBeenCalled(); expect(m.version).not.toHaveBeenCalled(); expect(m.read).not.toHaveBeenCalled();
});
it.each(["private_native", "current_profile_field", "retained_written_grant", "current_source_module"])("propagates %s denied access without falling back to another layout", async mode => {
  if (mode === "private_native" || mode === "current_source_module") m.owner.mockRejectedValueOnce(new Error("FORBIDDEN: current owning access"));
  else m.profile.mockRejectedValueOnce(new Error("FORBIDDEN: current/retained profile field access"));
  await expect(readRecordDefaultCustomerPageInTransaction(authority, input)).rejects.toThrow("FORBIDDEN"); expect(m.read).not.toHaveBeenCalled();
});
it.each(["foreign", "retired", "checksum", "edge", "plan"])("retained selected Page %s corruption fails closed before data reader", async mode => {
  if (mode === "foreign") stored.organisationId = "other";
  if (mode === "retired") stored.definition.retiredAt = new Date();
  if (mode === "checksum") stored.checksum = "d".repeat(64);
  if (mode === "edge") Object.assign(stored, { configurationDependencies: [{ targetDefinitionId: uuid(5) }] });
  if (mode === "plan") stored.compiledPlan.base.queryCost += 1;
  await expect(readRecordDefaultCustomerPageInTransaction(authority, input)).rejects.toThrow("DEPENDENCY_BROKEN"); expect(m.read).not.toHaveBeenCalled();
});
it("checks selected source/native freshness and record-only scope before native/typed projections", async () => {
  m.owner.mockResolvedValueOnce({ source, anchor, policy: { queries: [] } }).mockResolvedValueOnce({ source, anchor: { ...anchor, nativeRevision: 4 }, policy: { queries: [] } });
  await expect(readRecordDefaultCustomerPageInTransaction(authority, input)).rejects.toThrow("CONFLICT"); expect(m.read).not.toHaveBeenCalled();
  m.owner.mockReset().mockResolvedValue({ source, anchor, policy: { queries: [{ query: header, scope: "list", purpose: "fact" }] } });
  await expect(readRecordDefaultCustomerPageInTransaction(authority, input)).rejects.toThrow("unavailable"); expect(m.read).not.toHaveBeenCalled();
});
it("shared current/written field/value reader remains the sole projection engine and its denials propagate", async () => {
  m.read.mockRejectedValueOnce(new Error("FORBIDDEN: written value/reference policy"));
  await expect(readRecordDefaultCustomerPageInTransaction(authority, input)).rejects.toThrow("FORBIDDEN");
});
it("forged/stale principals and client pins/tenant/capabilities/type assertions fail closed", async () => {
  await expect(readRecordDefaultCustomerPageInTransaction({ ...authority, session: { ...session } }, input)).rejects.toThrow("FORBIDDEN");
  for (const extra of [{ page: pin }, { organisationId: "other" }, { capabilities: ["studio.definition.publish"] }, { recordTypeDefinitionId: uuid(8) },
    { entityId: "sales.order" }, { mode: "active" }]) await expect(readRecordDefaultCustomerPageInTransaction(authority, { ...input, ...extra })).rejects.toThrow();
  expect(m.refresh).not.toHaveBeenCalled(); expect(m.version).not.toHaveBeenCalled();
  m.refresh.mockRejectedValueOnce(new Error("FORBIDDEN: stale membership"));
  await expect(readRecordDefaultCustomerPageInTransaction(authority, input)).rejects.toThrow("FORBIDDEN"); expect(m.owner).not.toHaveBeenCalled();
});


const control = (componentId: string) => ({ ...input, componentId, definitionId: pin.definitionId, expectedVersionId: pin.versionId,
  expectedDefinitionRevision: 10, expectedProfileFingerprint: fingerprint, expectedNativeRevision: 3 });
function visible(type: "action" | "surface") {
  m.read.mockResolvedValue({ formFactor: "phone", variantId: null, sections: [{ id: "main", label: "Details", help: "", columns: 1,
    components: [type === "action" ? { id: "preview", type, label: "Preview", help: "", command, confirm: true, preview: false }
      : { id: "progress", type, label: "Update", help: "", surface, family: "module", outputs: [] }] }] });
}
it("prepares a retained default Page visible command with the same shared selector and exact fresh profile/native assertions without invocation", async () => {
  visible("action");
  const prepared = await prepareVisibleRecordDefaultActionInTransaction(authority, control("preview"));
  expect(prepared).toMatchObject({ authority, mode: "record_default", definitionId: pin.definitionId, versionId: pin.versionId,
    definitionRevision: 10, sourcePage: storedSource, command, anchor, ownerModuleId: "tickets", profileFingerprint: fingerprint, nativeRevision: 3 });
  expect(m.resolve).toHaveBeenCalledWith(session, command); expect(m.invoke).not.toHaveBeenCalled();
  expect(m.owner).toHaveBeenCalledTimes(3); expect(m.definition.mock.calls[0][0].select).not.toHaveProperty("activeVersionId");
});
it("prepares the exact retained default Page visible native form without borrowing Write or generating a replacement form", async () => {
  visible("surface");
  const prepared = await prepareVisibleRecordDefaultSurfaceInTransaction(authority, control("progress"));
  expect(prepared).toMatchObject({ authority, mode: "record_default", surface, anchor, ownerModuleId: "tickets", definitionId: pin.definitionId,
    definitionRevision: 10, versionId: pin.versionId, profileFingerprint: fingerprint, nativeRevision: 3 });
  expect(m.resolve).toHaveBeenCalledWith(session, surface); expect(m.invoke).not.toHaveBeenCalled();
});
it.each(["definitionId", "expectedVersionId", "expectedDefinitionRevision", "expectedProfileFingerprint", "expectedNativeRevision"])("default controls require %s before refresh", async omitted => {
  const request: Record<string, unknown> = control("preview"); delete request[omitted];
  await expect(prepareVisibleRecordDefaultActionInTransaction(authority, request)).rejects.toThrow();
  await expect(prepareVisibleRecordDefaultSurfaceInTransaction(authority, request)).rejects.toThrow();
  expect(m.refresh).not.toHaveBeenCalled(); expect(m.profile).not.toHaveBeenCalled();
});
it.each([{ expectedVersionId: uuid(4) }, { expectedDefinitionRevision: 9 }, { expectedProfileFingerprint: "e".repeat(64) }, { expectedNativeRevision: 2 }])("default controls reject stale selection before component/action preparation %#", async extra => {
  visible("action"); await expect(prepareVisibleRecordDefaultActionInTransaction(authority, { ...control("preview"), ...extra })).rejects.toThrow("CONFLICT");
  expect(m.read).not.toHaveBeenCalled(); expect(m.resolve).not.toHaveBeenCalled(); expect(m.invoke).not.toHaveBeenCalled();
});
it.each(["hidden", "wrongType", "duplicate"])("default controls reject %s nodes after the shared visibility reader", async mode => {
  visible("action");
  if (mode === "hidden") m.read.mockResolvedValue({ formFactor: "phone", variantId: null, sections: [] });
  if (mode === "wrongType") visible("surface");
  if (mode === "duplicate") { const model = await m.read(); model.sections[0].components.push(model.sections[0].components[0]); m.read.mockClear(); }
  await expect(prepareVisibleRecordDefaultActionInTransaction(authority, control("preview"))).rejects.toThrow("unavailable");
  expect(m.resolve).not.toHaveBeenCalled(); expect(m.invoke).not.toHaveBeenCalled();
});
it("default controls reject native revision drift between profile selection and owning component preparation", async () => {
  visible("surface"); const owner = await m.owner(); m.owner.mockClear();
  m.owner.mockResolvedValueOnce(owner).mockResolvedValueOnce(owner).mockResolvedValueOnce({ ...owner, anchor: { ...anchor, nativeRevision: 4 } });
  await expect(prepareVisibleRecordDefaultSurfaceInTransaction(authority, control("progress"))).rejects.toThrow("CONFLICT"); expect(m.resolve).not.toHaveBeenCalled();
});
it.each(["otherOwner", "noApproval", "wrongDevice", "noConfirm", "mutation"])("default command retains actual shared %s policy guard", async mode => {
  visible("action"); const owner = await m.owner(); m.owner.mockClear();
  if (mode === "noApproval") owner.policy.commands = [];
  if (mode === "wrongDevice") owner.policy.commands[0].formFactors = ["desktop"];
  if (mode === "noConfirm") { const model = await m.read(); model.sections[0].components[0].confirm = false; m.read.mockClear(); }
  if (mode === "otherOwner" || mode === "mutation") m.resolve.mockResolvedValue({ ...command, ownerModuleId: mode === "otherOwner" ? "other" : "tickets", kind: "command", details: { sideEffect: mode === "mutation" ? "business_mutation" : "none" } });
  m.owner.mockResolvedValue(owner);
  await expect(prepareVisibleRecordDefaultActionInTransaction(authority, control("preview"))).rejects.toThrow("unavailable"); expect(m.invoke).not.toHaveBeenCalled();
});
it.each(["otherOwner", "noApproval", "wrongDevice", "wrongFamily", "currentGrant"])("default native surface retains actual shared %s policy guard", async mode => {
  visible("surface"); const owner = await m.owner(); m.owner.mockClear();
  if (mode === "noApproval") owner.policy.surfaces = [];
  if (mode === "wrongDevice") owner.policy.surfaces[0].formFactors = ["desktop"];
  if (mode === "wrongFamily") owner.policy.surfaces[0].family = "tasks";
  if (mode === "otherOwner") m.resolve.mockResolvedValue({ ...surface, ownerModuleId: "other", kind: "surface" });
  if (mode === "currentGrant") m.resolve.mockRejectedValueOnce(new Error("FORBIDDEN: current owning Manage"));
  m.owner.mockResolvedValue(owner);
  await expect(prepareVisibleRecordDefaultSurfaceInTransaction(authority, control("progress"))).rejects.toThrow(mode === "currentGrant" ? "FORBIDDEN" : "unavailable"); expect(m.invoke).not.toHaveBeenCalled();
});
it("default control strict shape rejects raw command/form/tenant/approval overrides before fresh access", async () => {
  for (const extra of [{ command }, { surface }, { input: { recordId: "other" } }, { page: pin }, { organisationId: "other" }, { approvals: {} }])
    await expect(prepareVisibleRecordDefaultSurfaceInTransaction(authority, { ...control("progress"), ...extra })).rejects.toThrow();
  expect(m.refresh).not.toHaveBeenCalled(); expect(m.resolve).not.toHaveBeenCalled();
});


it("provides a metadata-only authorized exact default target without querying Page data or typed values", async () => {
  const target = await recordDefaultCustomerPageTargetInTransaction(authority, input);
  expect(target).toMatchObject({ mode: "record_default", definitionId: pin.definitionId, versionId: pin.versionId,
    profileFingerprint: fingerprint, nativeRevision: 3, name: "Ticket layout" });
  expect(target).not.toHaveProperty("model"); expect(target).not.toHaveProperty("page"); expect(m.read).not.toHaveBeenCalled(); expect(m.resolve).not.toHaveBeenCalled();
  expect(m.approvals).toHaveBeenCalledWith(authority, { sourcePage: storedSource, customFields: [] });
  expect(m.approvals.mock.invocationCallOrder[0]).toBeLessThan(m.definition.mock.invocationCallOrder[0]);
  expect(await recordDefaultCustomerPageTarget(session, input)).toEqual(target); expect(m.withAuthority).toHaveBeenCalledOnce();
});
it("metadata-only target checks current reconstructed Page metadata before any name and propagates current rights or incompatibility", async () => {
  m.approvals.mockRejectedValueOnce(new Error("FORBIDDEN: current Page metadata/source access"));
  await expect(recordDefaultCustomerPageTargetInTransaction(authority, input)).rejects.toThrow("FORBIDDEN");
  expect(m.definition).not.toHaveBeenCalled(); expect(m.read).not.toHaveBeenCalled();
  m.approvals.mockImplementationOnce(async () => ({ ...stored.compiledPlan.approvals, nativeFields: [] }));
  await expect(recordDefaultCustomerPageTargetInTransaction(authority, input)).rejects.toThrow(); expect(m.definition).not.toHaveBeenCalled();
});
it("metadata-only target returns null only for genuinely authorized no-layout profile and rejects stale or forged selection", async () => {
  m.profile.mockResolvedValue({ ...profile(), profile: null });
  expect(await recordDefaultCustomerPageTargetInTransaction(authority, input)).toBeNull();
  await expect(recordDefaultCustomerPageTargetInTransaction(authority, { ...input, definitionId: uuid(1) })).rejects.toThrow("CONFLICT");
  await expect(recordDefaultCustomerPageTargetInTransaction({ ...authority, session: { ...session } }, input)).rejects.toThrow("FORBIDDEN");
  expect(m.version).not.toHaveBeenCalled(); expect(m.definition).not.toHaveBeenCalled(); expect(m.read).not.toHaveBeenCalled();
});
