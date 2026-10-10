import { expect, it, vi } from "vitest";
import { z } from "zod";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { STANDARD_ROLES } from "@/core/permissions/capabilities";
import { missingAdminCapabilities } from "@/core/permissions/role-sync";
import { presetCapabilities, permissionLabel } from "@/core/permissions/access-levels";
import { platformCapabilities } from "@/core/admin/access";
import { studioManifest } from "@/modules/studio/manifest";
import { STUDIO_CAPABILITIES, STUDIO_DATA_CAPABILITIES } from "@/core/studio/permissions";
import { assertFieldMigrationPolicies, authoriseFieldMigrationReference } from "@/core/studio/fields/migrations/access";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { entity, query } from "@/core/studio/registry/contracts";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import type { EntityDescriptor } from "@/core/studio/registry/types";
vi.mock("@/core/db/client", () => ({ db: {} }));
const session: Session = { userId: "user", userName: "User", userEmail: "user@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set([STUDIO_CAPABILITIES.publish, "tickets.ticket.read", "tickets.ticket.manage"]) };
const company = { id: "company", kind: "CUSTOMER" as const, status: "ACTIVE" as const, archivedAt: null, isTest: true };
const field = customFieldPayloadSchema.parse({ schemaVersion: 1, storageGeneration: "00000000-0000-4000-8000-000000000001", entity: { id: "tickets.ticket", version: 2, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) },
  field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "string" } } });

it("registers live data separately without auto-granting through roles, staff uplift, sync or access presets", () => {
  const cap = STUDIO_DATA_CAPABILITIES.liveTest;
  expect(studioManifest.capabilities).toContain(cap); expect(Object.values(STUDIO_CAPABILITIES)).not.toContain(cap);
  for (const role of STANDARD_ROLES) expect(role.capabilities).not.toContain(cap);
  for (const role of ["OWNER", "ADMIN", "EMPLOYEE"]) expect(platformCapabilities({ role, active: true })).not.toContain(cap);
  expect(missingAdminCapabilities([], new Set(["studio"]))).not.toContain(cap);
  for (const level of ["none", "read", "write", "admin"] as const) expect(presetCapabilities({ id: "studio", name: "Studio", capabilities: studioManifest.capabilities }, level)).not.toContain(cap);
  expect(permissionLabel(cap)).toBe("Use live business data in Studio previews");
});

it("requires the live data grant for production, independent of publish, and valid server company identity", () => {
  expect(assertFieldMigrationPolicies(session, company, field).current).toEqual(field);
  expect(() => assertFieldMigrationPolicies(session, { ...company, isTest: false }, field)).toThrow(STUDIO_DATA_CAPABILITIES.liveTest);
  const granted = { ...session, capabilities: new Set([...session.capabilities, STUDIO_DATA_CAPABILITIES.liveTest]) };
  expect(assertFieldMigrationPolicies(granted, { ...company, isTest: false }, field).written).toEqual(field);
  for (const invalid of [{ ...company, id: "other" }, { ...company, kind: "INTERNAL" as const }, { ...company, status: "SUSPENDED" as const }, { ...company, archivedAt: new Date() },
    { ...company, isTest: undefined as unknown as boolean }]) expect(() => assertFieldMigrationPolicies(granted, invalid, field)).toThrow("FORBIDDEN");
  expect(() => assertFieldMigrationPolicies({ ...granted, capabilities: new Set([STUDIO_DATA_CAPABILITIES.liveTest]) }, company, field)).toThrow("publish");
});

it("requires both current and written field rights; new labels or weaker policy cannot release historical data", () => {
  const restricted = customFieldPayloadSchema.parse({ ...field, field: { ...field.field, classification: "restricted", readCapability: "tickets.queue.read", writeCapability: "tickets.queue.manage" } });
  expect(() => assertFieldMigrationPolicies(session, company, field, restricted)).toThrow("tickets.queue.read");
  expect(() => assertFieldMigrationPolicies(session, company, restricted, field)).toThrow("tickets.queue.read");
  const reader = { ...session, capabilities: new Set([...session.capabilities, "tickets.queue.read"]) };
  expect(() => assertFieldMigrationPolicies(reader, company, field, restricted)).toThrow("tickets.queue.manage");
  const authorised = { ...reader, capabilities: new Set([...reader.capabilities, "tickets.queue.manage"]) };
  expect(assertFieldMigrationPolicies(authorised, company, field, restricted).written).toEqual(restricted);
  for (const invalid of [{ ...field, field: { ...field.field, key: "other" } }, { ...field, entity: { ...field.entity, id: "sales.order" } },
    { ...field, script: "unsafe" }]) expect(() => assertFieldMigrationPolicies(authorised, company, field, invalid)).toThrow();
});

it("authorises references through the exact owning record contract and shared transaction, never normal writes", async () => {
  const transaction = {} as Prisma.TransactionClient;
  const authorise = vi.fn(async (ctx: { session: Session }, input: { recordId: string }) => ({ recordId: input.recordId, organisationId: ctx.session.organisationId, revision: 1 }));
  const descriptor: EntityDescriptor = { id: "tickets.ticket", version: 1, label: "Ticket", capability: "tickets.ticket.read", lifecycle: "active", classification: "confidential", kind: "entity", key: "string",
    fields: [{ id: "number", label: "Number", type: "string", nullable: false, classification: "confidential", filterable: false, sortable: false, decision: false, template: false }],
    extensionPolicy: { customFields: true, recordTypes: false, pageVariants: false },
    record: { writeCapability: "tickets.ticket.manage", labelField: "number", detailRoute: "/tickets/{recordId}", listQuery: { id: "tickets.ticket.list", version: 1 }, getQuery: { id: "tickets.ticket.get", version: 1 }, authorise } };
  const registry = new CapabilityRegistry(async () => true);
  registry.register("tickets", { contributions: [entity(descriptor), ...["list", "get"].map(op => query({ id: `tickets.ticket.${op}`, version: 1, label: op, capability: "tickets.ticket.read", lifecycle: "active", classification: "confidential", kind: "query", input: z.strictObject({}), output: z.null(), pagination: "none", maxCardinality: 1, costClass: "low", execute: async () => null }))] });
  const metadata = registry.describe(descriptor.id, 1);
  const reference = customFieldPayloadSchema.parse({ ...field, field: { ...field.field, storage: { type: "reference", entity: { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash } } } });
  await expect(authoriseFieldMigrationReference({ session }, registry, reference, { type: "reference", value: "record" })).rejects.toThrow("FORBIDDEN"); expect(authorise).not.toHaveBeenCalled();
  await authoriseFieldMigrationReference({ session, transaction }, registry, reference, { type: "reference", value: "record" });
  expect(authorise).toHaveBeenCalledWith({ session, transaction }, { recordId: "record", intent: "read" });
  authorise.mockResolvedValueOnce({ recordId: "record", organisationId: "foreign", revision: 1 });
  await expect(authoriseFieldMigrationReference({ session, transaction }, registry, reference, { type: "reference", value: "record" })).rejects.toThrow();
  authorise.mockRejectedValueOnce(new Error("Native record unavailable"));
  await expect(authoriseFieldMigrationReference({ session, transaction }, registry, reference, { type: "reference", value: "private" })).rejects.toThrow("unavailable");
  await expect(authoriseFieldMigrationReference({ session: { ...session, capabilities: new Set([STUDIO_CAPABILITIES.publish]) }, transaction }, registry, reference, { type: "reference", value: "private" })).rejects.toThrow("FORBIDDEN");
  const calls = authorise.mock.calls.length;
  await authoriseFieldMigrationReference({ session, transaction }, registry, reference, null);
  await authoriseFieldMigrationReference({ session, transaction }, registry, field, { type: "string", value: "plain" }); expect(authorise).toHaveBeenCalledTimes(calls);
});
