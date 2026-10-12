import { beforeEach, expect, it, vi } from "vitest";
import { z } from "zod";
import type { Session } from "@/core/auth/session";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import type { Prisma } from "@/generated/prisma/client";
import type { SealedConfigurationVersion } from "@/core/studio/configuration/pins";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { declarative } from "@/core/studio/registry/contracts";
import { pageSource } from "@/core/studio/registry/page-contracts";
import { ticketStudioContract } from "@/core/service-work/studio";
import { ticketPageContract, ticketPagePolicy } from "@/core/service-work/studio-pages";
import { pagePayloadSchema } from "@/core/studio/pages/schema";
import { compileStructuredPage, compileRetainedStructuredPage, resolveAuthoringPageSource } from "@/core/studio/pages/definition-compiler";
import { studioRuntimeFeaturesForCompiledDefinition } from "@/core/studio/runtime-features";
const m = vi.hoisted(() => ({ stamps: new WeakMap<object, object>(), enabled: vi.fn(), approvals: vi.fn(), protected: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ sessionAuthorityStamp: (session: object) => m.stamps.get(session), getSession: vi.fn(), requireSession: vi.fn(), sessionForUser: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: vi.fn() }));
vi.mock("@/core/modules/runtime", () => ({ getEnabledModuleIds: vi.fn() }));
vi.mock("@/core/studio/runtime-features", async original => ({ ...await original<object>(), isStudioRuntimeFeatureEnabled: m.enabled }));
vi.mock("@/core/studio/pages/server-approvals", () => ({ reconstructPageApprovalsInTransaction: m.approvals }));
// Actual existing Ticket registry + Page source registration, strict seals and
// pure Page compiler. Approval catalogue, current identity and SQL are bounded
// collaborators; no actual data/protected query or central SQL is claimed.
const id = (n: number) => `80000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
let authority: FieldRuntimeAuthority, registry: CapabilityRegistry, session: Session, row: SealedConfigurationVersion;
const exact = (id: string, version: number) => { const value = registry.describe(id, version); return { id, version, schemaHash: value.schemaHash, contractHash: value.contractHash }; };
const approval = (id: string, version: number) => { const value = registry.describe(id, version); return { ...exact(id, version), ownerModuleId: value.ownerModuleId, kind: value.kind, classification: value.classification, capability: value.capability }; };
beforeEach(async () => {
  vi.clearAllMocks(); session = { userId: "actor", membershipId: "member", organisationId: "company", capabilities: new Set(["tickets.ticket.read"]) } as Session;
  const stamp = { userId: session.userId, membershipId: session.membershipId, organisationId: session.organisationId }; m.stamps.set(session, stamp);
  registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract); registry.register("tickets", { contributions: ticketPageContract.contributions.filter(entry => entry.metadata.id !== "tickets.ticket.page" || entry.metadata.version === 1) });
  const old = ticketPagePolicy, policy = { ...old, surfaces: [...old.surfaces, { surface: { id: "tickets.ticket.new_panel", version: 1 }, family: "module" as const,
    queries: [], formFactors: ["desktop" as const] }], maxQueryCost: 24 };
  registry.register("tickets", { contributions: [declarative({ id: "tickets.ticket.new_panel", version: 1, label: "New panel", capability: "tickets.ticket.read", kind: "surface", lifecycle: "active", classification: "confidential", schema: z.strictObject({}), references: [] }),
    pageSource({ id: "tickets.ticket.page", version: 2, label: "New Ticket layout", capability: "tickets.ticket.read", lifecycle: "active", classification: "confidential", policy,
      callbacks: { authoriseRead: m.protected, bindQueryInput: m.protected, projectQueryOutput: m.protected } })] });
  authority = { session, stamp: stamp as FieldRuntimeAuthority["stamp"], transaction: {} as Prisma.TransactionClient, registry };
  m.approvals.mockImplementation(async (_authority, request) => ({ entity: approval("tickets.ticket", 9), sourcePage: approval(request.sourcePage.id, request.sourcePage.version),
    variants: true, fieldSourceVersions: [...old.fieldSourceVersions], nativeFields: [], customFields: [], facts: [], contracts: [], queries: [], commands: [], metrics: [], surfaces: [],
    maxQueryCost: request.sourcePage.version === 1 ? 12 : 24 }));
  m.enabled.mockReturnValue(false);
  const payload = pagePayloadSchema.parse({ schemaVersion: 1, entity: exact("tickets.ticket", 9), formFactors: ["desktop", "tablet", "phone"], sections: [{ id: "main", label: "Ticket", columns: { desktop: 1, tablet: 1, phone: 1 },
    formFactors: ["desktop", "tablet", "phone"], components: [{ id: "help", type: "instructions", text: "Ticket help", formFactors: ["desktop", "tablet", "phone"] }] }] });
  const compiled = await compileStructuredPage(authority, payload);
  row = { id: id(2), definitionId: id(1), organisationId: "company", schemaVersion: 1, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum,
    definition: { kind: "page", retiredAt: null }, configurationDependencies: [] };
});
it("new authoring selects approved retained @1 while panel pair is closed, then current @2 only with evidence", async () => {
  expect(resolveAuthoringPageSource(authority, pagePayloadSchema.parse(row.payload).entity).metadata.version).toBe(1);
  expect(studioRuntimeFeaturesForCompiledDefinition("page", row.payload, row.compiledPlan)).toEqual(["structuredPages.v1"]);
  m.enabled.mockReturnValue(true);
  const latest = await compileStructuredPage(authority, row.payload);
  expect(latest.plan.approvals.sourcePage.version).toBe(2); expect(latest.checksum).not.toBe(row.checksum);
  expect(studioRuntimeFeaturesForCompiledDefinition("page", latest.payload, latest.plan)).toEqual(["structuredPages.v1", "ticketRecordPanels.v1"]);
  expect(m.protected).not.toHaveBeenCalled();
});
it("retained activation reconstructs exact @1 source even after @2 becomes authoring default", async () => {
  m.enabled.mockReturnValue(true); m.approvals.mockClear();
  const retained = await compileRetainedStructuredPage(authority, row);
  expect(retained.checksum).toBe(row.checksum); expect(retained.plan.approvals.sourcePage.version).toBe(1);
  expect(m.approvals.mock.calls[0][1].sourcePage).toEqual(exact("tickets.ticket.page", 1));
  expect(m.protected).not.toHaveBeenCalled();
});
it.each(["tenant", "payload", "seal", "retired", "edge", "recompiled", "capability", "forged"])("retained compilation rejects %s corruption/current denial", async mode => {
  if (mode === "tenant") row.organisationId = "foreign";
  if (mode === "payload") row.payload = {};
  if (mode === "seal") row.checksum = "f".repeat(64);
  if (mode === "retired") row.definition.retiredAt = new Date();
  if (mode === "edge") row.configurationDependencies = [{}] as never;
  if (mode === "recompiled") m.approvals.mockImplementationOnce(async () => ({ ...await m.approvals.getMockImplementation()!(authority, { sourcePage: exact("tickets.ticket.page", 2) }) }));
  if (mode === "capability") session.capabilities.clear();
  if (mode === "forged") authority = { ...authority, session: { ...session } };
  await expect(compileRetainedStructuredPage(authority, row)).rejects.toThrow(); expect(m.protected).not.toHaveBeenCalled();
});
it("source-family feature detection fails closed when actual compiled owner evidence is absent/corrupt", () => {
  expect(() => studioRuntimeFeaturesForCompiledDefinition("page", row.payload, {})).toThrow();
  const plan = structuredClone(row.compiledPlan) as { approvals: { sourcePage: { id: string; version: number; ownerModuleId: string } } };
  plan.approvals.sourcePage.version = 2; plan.approvals.sourcePage.ownerModuleId = "foreign";
  expect(() => studioRuntimeFeaturesForCompiledDefinition("page", row.payload, plan)).toThrow("INVALID");
  expect(studioRuntimeFeaturesForCompiledDefinition("customField", { field: { key: "unchanged" } }, undefined)).toEqual([]);
});
