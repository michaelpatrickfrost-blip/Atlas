import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import type { SealedConfigurationVersion } from "@/core/studio/configuration/pins";
const m = vi.hoisted(() => ({ membership: vi.fn(), selectors: vi.fn(), approvals: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.membership } } }));
vi.mock("@/core/studio/record-types/selection", () => ({ assertRecordTypeMetadataSelectorsInTransaction: m.selectors }));
vi.mock("@/core/studio/pages/server-approvals", () => ({ reconstructPageApprovalsInTransaction: m.approvals }));
import { sessionForUser, sessionAuthorityStamp } from "@/core/auth/session";
import { buildRegistry } from "@/core/studio/registry/runtime";
import { checksum } from "@/core/studio/registry/contracts";
import { pagePayloadSchema, type PagePayload } from "@/core/studio/pages/schema";
import { compileStructuredPage, compileRetainedStructuredPage, authoredPageRecordTypeSelectors } from "@/core/studio/pages/definition-compiler";
// Actual schema/compiler/registry + genuine Session. Server metadata resolution
// and selected-type SQL are explicit collaborators; no native read/publication.
const id = (n: number) => `50000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
let authority: FieldRuntimeAuthority, page: PagePayload;
beforeEach(async () => {
  vi.clearAllMocks();
  m.membership.mockResolvedValue({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 1, active: true,
    grantedCapabilities: ["tickets.ticket.read"], deniedCapabilities: [], roles: [],
    user: { name: "Actor", email: "actor@example.test", authVersion: 1, platformAdmin: null },
    organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
  const session = await sessionForUser("company", "actor"); if (!session) throw new Error("No actor");
  const registry = buildRegistry(async () => true);
  authority = { session, stamp: sessionAuthorityStamp(session)!, registry, transaction: {} as Prisma.TransactionClient };
  const ref = (metadata: ReturnType<typeof registry.describe>) => ({ id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash });
  const approval = (metadata: ReturnType<typeof registry.describe>) => ({ ...ref(metadata), ownerModuleId: metadata.ownerModuleId, kind: metadata.kind,
    classification: metadata.classification, capability: metadata.capability });
  m.approvals.mockImplementation(async (_authority, request) => ({ entity: approval(registry.describe("tickets.ticket", 9)),
    sourcePage: approval(registry.describe(request.sourcePage.id, request.sourcePage.version)), variants: true, fieldSourceVersions: [9], nativeFields: [], customFields: [],
    facts: [], contracts: [], queries: [], commands: [], metrics: [], surfaces: [], maxQueryCost: 12 }));
  m.selectors.mockResolvedValue(undefined);
  const forms = ["desktop", "tablet", "phone"];
  page = pagePayloadSchema.parse({ schemaVersion: 1, entity: ref(registry.describe("tickets.ticket", 9)), formFactors: forms,
    sections: [{ id: "main", label: "Ticket", formFactors: forms, columns: { desktop: 1, tablet: 1, phone: 1 }, components: [
      { id: "guide", type: "instructions", text: "Always available guidance.", formFactors: forms },
      { id: "typed", type: "instructions", text: "Complaint guidance.", formFactors: forms, visibleWhen: { kind: "recordType", definitionId: id(1) } }] }] });
});
it("checks every authored stable selector including nested variants and added/patched nodes once deterministically", () => {
  const formFactors = page.formFactors;
  page.sections[0].components[1].visibleWhen = { kind: "all", predicates: [{ kind: "recordType", definitionId: id(1) }, { kind: "recordType", definitionId: id(2) }] };
  page.variants = [{ id: "alternative", label: "Alternative", priority: 1, when: { kind: "recordType", definitionId: id(3) }, patches: [
    { operation: "setComponent", componentId: "typed", properties: { visibleWhen: { kind: "recordType", definitionId: id(4) } } },
    { operation: "setSection", sectionId: "main", properties: { visibleWhen: { kind: "recordType", definitionId: id(5) } } },
    { operation: "addComponent", sectionId: "main", afterComponentId: "typed", component: { id: "extra", type: "instructions", text: "Extra", formFactors, visibleWhen: { kind: "recordType", definitionId: id(6) } } },
    { operation: "addSection", afterSectionId: "main", section: { id: "other", label: "Other", help: "", columns: { desktop: 1, tablet: 1, phone: 1 }, formFactors,
      visibleWhen: { kind: "recordType", definitionId: id(7) }, components: [{ id: "last", type: "instructions", text: "Last", formFactors,
        visibleWhen: { kind: "recordType", definitionId: id(8).toUpperCase() } }] } } ] }];
  expect(authoredPageRecordTypeSelectors(page)).toEqual(Array.from({ length: 8 }, (_, n) => id(n + 1)));
});
it("new publication rejects unavailable/foreign selectors before approval reconstruction or plan effects", async () => {
  m.selectors.mockRejectedValue(new Error("RECORD_PROFILE_INVALID: unknown or foreign type"));
  await expect(compileStructuredPage(authority, page)).rejects.toThrow("RECORD_PROFILE_INVALID");
  expect(m.selectors).toHaveBeenCalledWith(authority, page.entity, [id(1)]); expect(m.approvals).not.toHaveBeenCalled();
});
it("retained sealed Page equality does not substitute today's active type or revalidate retired choices", async () => {
  const compiled = await compileStructuredPage(authority, page);
  const row: SealedConfigurationVersion = { id: id(90), definitionId: id(91), organisationId: "company", schemaVersion: 1,
    payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum, definition: { kind: "page", retiredAt: null }, configurationDependencies: [] };
  expect(compiled.plan.configurationDependencies).toEqual([]); expect(checksum(compiled.plan)).toBe(row.checksum);
  m.selectors.mockClear(); m.selectors.mockRejectedValue(new Error("RECORD_PROFILE_INVALID: now retired"));
  const retained = await compileRetainedStructuredPage(authority, row);
  expect(retained.checksum).toBe(row.checksum); expect(m.selectors).not.toHaveBeenCalled();
  expect(retained.payload.sections[0].components[1].visibleWhen).toEqual({ kind: "recordType", definitionId: id(1) });
  await expect(compileStructuredPage(authority, page)).rejects.toThrow("now retired");
});

it('rejects newly authored type conditions on a list screen instead of making them silently false', async () => {
  const metadata = authority.registry.describe('tickets.ticket.page.list', 1);
  const query = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  const source = authority.registry.describe('tickets.ticket.page', 1);
  const entity = authority.registry.describe('tickets.ticket', 9);
  const ref = (value: typeof source) => ({ id: value.id, version: value.version, schemaHash: value.schemaHash, contractHash: value.contractHash,
    ownerModuleId: value.ownerModuleId, kind: value.kind, classification: value.classification, capability: value.capability });
  m.approvals.mockResolvedValue({ entity: ref(entity), sourcePage: ref(source), variants: true, fieldSourceVersions: [9], nativeFields: [], customFields: [], facts: [], contracts: [],
    queries: [{ ...ref(metadata), sourceEntityId: entity.id, purpose: 'list', costClass: 'low', maxCardinality: 50, pagination: 'cursor',
      columns: [{ id: 'subject', label: 'Subject', classification: 'confidential' }] }], commands: [], metrics: [], surfaces: [], maxQueryCost: 12 });
  page.sections[0].components.push({ id: 'list', type: 'queryList', query, pageSize: 1, columns: ['subject'], formFactors: page.formFactors });
  await expect(compileStructuredPage(authority, page)).rejects.toThrow('record screen');
});
