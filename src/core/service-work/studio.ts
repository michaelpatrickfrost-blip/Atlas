import { z } from "zod";
import { db } from "@/core/db/client";
import { Prisma } from "@/generated/prisma/client";
import { assertCapability } from "@/core/permissions/check";
import { entity, query } from "@/core/studio/registry/contracts";
import type { EntityDescriptor, RecordContext, RecordRequest, StudioModuleContract } from "@/core/studio/registry/types";
import { workScope } from "./access";
import { FINAL_WORK, WORK_STATUSES } from "./config";
import { recordAnchorSchema } from "@/core/studio/registry/entities";
import { authoriseNewTicketFields } from "./studio-create";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { readSealedFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";

const recordId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const listInput = z.strictObject({
  search: z.string().max(200).optional(), status: z.enum(WORK_STATUSES).optional(),
  cursor: z.strictObject({ updated_at: z.iso.datetime(), id: recordId }).optional(),
  limit: z.number().int().min(1).max(50).default(25),
});
const projection = z.strictObject({
  id: recordId, revision: z.number().int().positive(),
  fields: z.strictObject({ number: z.string(), subject: z.string(), status: z.string(), type: z.string(),
    priority: z.string(), created_at: z.iso.datetime(), updated_at: z.iso.datetime() }),
  href: z.string().regex(/^\/tickets\/[a-zA-Z0-9_-]+$/),
});
const select = { id: true, version: true, number: true, subject: true, status: true, type: true,
  priority: true, createdAt: true, updatedAt: true } satisfies Prisma.ServiceWorkItemSelect;
type Row = Prisma.ServiceWorkItemGetPayload<{ select: typeof select }>;
const project = (row: Row) => ({ id: row.id, revision: row.version, href: `/tickets/${row.id}`,
  fields: { number: row.number, subject: row.subject, status: row.status, type: row.type, priority: row.priority,
    created_at: row.createdAt.toISOString(), updated_at: row.updatedAt.toISOString() } });

/** Studio composition requires real tenant entitlement, including staff setup. */
async function requireSource(ctx: RecordContext) {
  assertCapability(ctx.session, "tickets.ticket.read");
  const client = ctx.transaction ?? db;
  if (ctx.transaction) {
    // Keep enablement stable until the same extension transaction completes.
    await ctx.transaction.$queryRaw`SELECT "id" FROM "module_states" WHERE "organisationId" = ${ctx.session.organisationId} AND "moduleId" = 'tickets' FOR SHARE`;
  }
  if (!await client.moduleState.findFirst({ where: { organisationId: ctx.session.organisationId, moduleId: "tickets", enabled: true, entitled: true }, select: { id: true } })) throw new Error("DEPENDENCY_BROKEN: Tickets is unavailable.");
  return client;
}

/** Complete native access only; additional field/value authority is separate. */
async function migrationSnapshotClient(ctx: RecordContext) {
  if (!ctx.transaction) throw new Error("Field migration snapshots require a shared server transaction.");
  assertCapability(ctx.session, "tickets.ticket.manage");
  const isolation = await ctx.transaction.$queryRaw<Array<{ transaction_isolation: string }>>`SHOW transaction_isolation`;
  if (isolation.length !== 1 || isolation[0].transaction_isolation !== "serializable")
    throw new Error("Field migration snapshots require a serializable transaction.");
  const client = await requireSource(ctx);
  await ctx.transaction.$queryRaw`SELECT id FROM memberships WHERE id = ${ctx.session.membershipId} AND "organisationId" = ${ctx.session.organisationId} AND "userId" = ${ctx.session.userId} FOR SHARE`;
  const member = await client.membership.findFirst({ where: { id: ctx.session.membershipId, organisationId: ctx.session.organisationId,
    userId: ctx.session.userId, active: true, organisation: { kind: "CUSTOMER", status: "ACTIVE", archivedAt: null } }, select: { id: true } });
  if (!member) throw new Error("MIGRATION_ACCESS_REQUIRED: current company membership is required.");
  const unavailable = await client.serviceWorkItem.findFirst({ where: { organisationId: ctx.session.organisationId, kind: "TICKET", OR: [
    { NOT: workScope(ctx.session) },
    { queue: { restricted: true, members: { none: { organisationId: ctx.session.organisationId, userId: ctx.session.userId } } } },
  ] }, select: { id: true } });
  if (unavailable) throw new Error("MIGRATION_ACCESS_REQUIRED: complete ticket access must be reviewed by an authorised queue member.");
  return client;
}

const migrationSourceVersions = [2, 3] as const;
const migrationInput = z.discriminatedUnion("mode", [
  z.strictObject({ mode: z.literal("preflight") }),
  z.strictObject({ mode: z.literal("snapshot"), cursor: recordId.optional(), limit: z.number().int().min(1).max(50).default(25) }),
  z.strictObject({ mode: z.literal("coverage"), preparationId: z.uuid() }),
]);
const migrationScope = { organisationId: z.string().min(1), entityId: z.literal("tickets.ticket") };
const migrationOutput = z.discriminatedUnion("mode", [
  z.strictObject({ ...migrationScope, mode: z.literal("preflight"), count: z.number().int().nonnegative(), nativeAccessComplete: z.literal(true) }),
  z.strictObject({ ...migrationScope, mode: z.literal("snapshot"), records: z.array(recordAnchorSchema).max(50), next: recordId.nullable() }),
  z.strictObject({ ...migrationScope, mode: z.literal("coverage"), count: z.number().int().nonnegative(), nativeCoverageComplete: z.literal(true) }),
]);

/** No native mutation: this locks and authorises the owning record for added data. */
export async function authoriseTicketRecord(ctx: RecordContext, request: RecordRequest) {
  const client = await requireSource(ctx);
  if (request.intent === "extend") {
    assertCapability(ctx.session, "tickets.ticket.manage");
    if (!ctx.transaction) throw new Error("Extension writes require an atomic transaction.");
    if (!Number.isSafeInteger(request.expectedRevision) || request.expectedRevision! < 1) throw new Error("Refresh the record before saving.");
  }
  const where = { AND: [workScope(ctx.session), { id: request.recordId, kind: "TICKET" }] } satisfies Prisma.ServiceWorkItemWhereInput;
  const policySelect = { id: true, organisationId: true, version: true, status: true, mergedIntoId: true, queueId: true,
    queue: { select: { restricted: true } } } satisfies Prisma.ServiceWorkItemSelect;
  let row = await client.serviceWorkItem.findFirst({ where, select: policySelect });
  if (!row) throw new Error("Ticket unavailable.");
  if (request.intent === "extend") {
    await ctx.transaction!.$queryRaw`SELECT "id" FROM "service_work_items" WHERE "id" = ${request.recordId} AND "organisationId" = ${ctx.session.organisationId} AND "kind" = 'TICKET' FOR UPDATE`;
    // A concurrent native transition or queue change must be checked after locking.
    row = await client.serviceWorkItem.findFirst({ where, select: policySelect });
    if (!row) throw new Error("Ticket unavailable.");
    if (row.version !== request.expectedRevision) throw new Error("This record changed. Refresh before saving.");
    if (row.mergedIntoId || FINAL_WORK.includes(row.status)) throw new Error("Reopen active ticket work before changing extension values.");
    if (row.queue.restricted && !await client.serviceQueueMember.findFirst({ where: { organisationId: ctx.session.organisationId, queueId: row.queueId, userId: ctx.session.userId }, select: { id: true } })) throw new Error("Only this restricted queue’s members can change ticket extensions.");
  }
  return { recordId: row.id, organisationId: row.organisationId, revision: row.version };
}

const identity = { version: 1, capability: "tickets.ticket.read", lifecycle: "active" as const, classification: "confidential" as const };
const ticketEntity: EntityDescriptor = { ...identity, id: "tickets.ticket", label: "Ticket", kind: "entity", key: "string",
  fields: [
    ["number", "Number", "string"], ["subject", "Subject", "string"], ["status", "Status", "enum"],
    ["type", "Request type", "enum"], ["priority", "Priority", "enum"],
    ["created_at", "Created", "datetime"], ["updated_at", "Updated", "datetime"],
  ].map(([id, label, type]) => ({ id, label, type: type as "string" | "enum" | "datetime", nullable: false, classification: "confidential" as const,
    filterable: ["number", "subject", "status"].includes(id), sortable: id === "updated_at", decision: false, template: false })),
  extensionPolicy: { customFields: true, recordTypes: true, pageVariants: true },
  record: { writeCapability: "tickets.ticket.manage", detailRoute: "/tickets/{recordId}", labelField: "number",
    listQuery: { id: "tickets.ticket.list", version: 1 }, getQuery: { id: "tickets.ticket.get", version: 1 }, authorise: authoriseTicketRecord } };
const ticketFieldEntity: EntityDescriptor = { ...ticketEntity, version: 2, record: { ...ticketEntity.record!, fieldPolicy: {
    types: ["string", "integer", "decimal", "money", "boolean", "date", "datetime", "duration", "email", "url", "phone", "enum", "multi_enum", "reference", "address"],
    maxFields: 100, referenceEntities: ["tickets.ticket"],
    reservedKeys: ["id", "organisation_id", "number", "kind", "subject", "description", "type", "category", "priority", "severity", "impact", "urgency", "status", "queue_id", "requester_user_id", "requested_for_user_id", "owner_user_id", "watcher_ids", "parent_case_id", "parent_id", "merged_into_id", "context", "definition", "sla", "first_response_due_at", "resolution_due_at", "first_response_at", "paused_at", "resolved_at", "resolution", "reopen_count", "version", "revision", "approval_id", "created_at", "updated_at", "entries", "files"],
  } } };
async function executeMigrationSnapshot(ctx: RecordContext, input: z.output<typeof migrationInput>, sourceVersions: readonly number[]) {
  const client = await migrationSnapshotClient(ctx), organisationId = ctx.session.organisationId;
  const scope = { organisationId, kind: "TICKET" as const }, resultScope = { organisationId, entityId: "tickets.ticket" as const };
  if (input.mode === "preflight") return { ...resultScope, mode: input.mode,
    count: await client.serviceWorkItem.count({ where: scope }), nativeAccessComplete: true as const };
  if (input.mode === "snapshot") {
    const rows = await client.serviceWorkItem.findMany({ where: { ...scope, ...(input.cursor ? { id: { gt: input.cursor } } : {}) },
      select: { id: true, organisationId: true, version: true }, orderBy: { id: "asc" }, take: input.limit + 1 });
    const records = rows.slice(0, input.limit).map(row => ({ recordId: row.id, organisationId: row.organisationId, revision: row.version }));
    return { ...resultScope, mode: input.mode, records, next: rows.length > input.limit ? records.at(-1)!.recordId : null };
  }
  await ctx.transaction!.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id = ${input.preparationId}::uuid AND "organisationId" = ${organisationId} FOR SHARE`;
  const preparation = await client.studioFieldMigrationPreparation.findFirst({ where: { id: input.preparationId, organisationId, entityId: "tickets.ticket",
    state: { in: ["PREPARING", "REVIEWED"] }, OR: sourceVersions.map(version => ({ sourceVersion: { payload: { path: ["entity", "version"], equals: version } } })) }, select: { id: true } });
  if (!preparation) throw new Error("MIGRATION_REVIEW_UNAVAILABLE: this ticket preparation is unavailable.");
  // Equal counts do not prove coverage. Check both missing/changed native
  // records and extra/deleted source references under the same snapshot.
  const coverage = await ctx.transaction!.$queryRaw<Array<{ changed: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM service_work_items w LEFT JOIN studio_field_migration_observations o
        ON o."preparationId" = ${preparation.id}::uuid AND o."organisationId" = w."organisationId"
          AND o."entityId" = 'tickets.ticket' AND o."recordId" = w.id
      WHERE w."organisationId" = ${organisationId} AND w.kind = 'TICKET'
        AND (o.id IS NULL OR o."nativeRevision" <> w.version)
    ) OR EXISTS (
      SELECT 1 FROM studio_field_migration_observations o
      WHERE o."preparationId" = ${preparation.id}::uuid AND o."organisationId" = ${organisationId} AND o."entityId" = 'tickets.ticket'
        AND NOT EXISTS (SELECT 1 FROM service_work_items w WHERE w.id = o."recordId" AND w."organisationId" = ${organisationId} AND w.kind = 'TICKET')
    ) AS changed`;
  if (coverage.length !== 1 || coverage[0].changed !== false) throw new Error("MIGRATION_COHORT_CHANGED: review the current ticket set again.");
  return { ...resultScope, mode: input.mode, count: await client.serviceWorkItem.count({ where: scope }), nativeCoverageComplete: true as const };
}
const referenceReadVersions = [1, 2, 3, 4] as const;
const referenceSourceVersions = [2, 3, 4] as const;
const referenceMigrationInput = z.discriminatedUnion("mode", [...migrationInput.options,
  z.strictObject({ mode: z.literal("reference_coverage"), preparationId: z.uuid() })]);
const referenceMigrationOutput = z.discriminatedUnion("mode", [...migrationOutput.options,
  z.strictObject({ ...migrationScope, mode: z.literal("reference_coverage"), nativeReferenceCoverageComplete: z.literal(true) })]);

/** Owning-domain proof for the same canonical ticket reference namespace only.
 * Field/source/written policy is independently enforced by Studio before calling.
 */
const executionSourceVersions = [2, 3, 4, 5] as const;
const executionReadVersions = [1, 2, 3, 4, 5] as const;
const executionReviewPolicy = { sourceVersions: executionSourceVersions, readVersions: executionReadVersions, queryVersion: 3, targetEntityVersion: 5 };
async function referenceCoverage(ctx: RecordContext, preparationId: string, policy: {
  sourceVersions: readonly number[]; readVersions: readonly number[]; queryVersion: number; targetEntityVersion: number;
} = { sourceVersions: referenceSourceVersions, readVersions: referenceReadVersions, queryVersion: 2, targetEntityVersion: 4 }) {
  const client = await migrationSnapshotClient(ctx), organisationId = ctx.session.organisationId;
  await ctx.transaction!.$queryRaw`SELECT id FROM studio_field_migration_preparations WHERE id=${preparationId}::uuid AND "organisationId"=${organisationId} FOR SHARE`;
  const preparation = await client.studioFieldMigrationPreparation.findFirst({ where: { id: preparationId, organisationId, entityId: "tickets.ticket",
    state: { in: ["PREPARING", "REVIEWED"] }, OR: policy.sourceVersions.map(version => ({ sourceVersion: { payload: { path: ["entity", "version"], equals: version } } })) },
    select: { id: true, intent: true, sourceVersion: { select: { payload: true } }, draft: { select: { payload: true } } } });
  if (!preparation) throw new Error("MIGRATION_REVIEW_UNAVAILABLE: this ticket preparation is unavailable.");
  if (!z.object({ ownerQuery: z.object({ id: z.literal("tickets.ticket.field_migration"), version: z.literal(policy.queryVersion) }) }).safeParse(preparation.intent).success)
    throw new Error("MIGRATION_REFERENCE_COVERAGE_CHANGED: current ticket reference coverage is required.");
  for (const raw of [preparation.sourceVersion.payload, preparation.draft.payload]) {
    const payload = customFieldPayloadSchema.parse(raw), storage = payload.field.storage;
    if (payload.entity.id !== "tickets.ticket" || storage.type !== "reference" || storage.entity.id !== "tickets.ticket"
      || !policy.readVersions.includes(storage.entity.version))
      throw new Error("MIGRATION_REFERENCE_COVERAGE_CHANGED: current ticket reference coverage is required.");
  }
  if (customFieldPayloadSchema.parse(preparation.draft.payload).entity.version !== policy.targetEntityVersion)
    throw new Error("MIGRATION_REFERENCE_COVERAGE_CHANGED: current ticket reference coverage is required.");
  // Full canonical private/native read access above covers the same read policy
  // used by authoriseTicketRecord for the native versions declared by this policy.
  // Verify every stored written target and actual tenant/kind/existence without
  // returning a referenced ID, count or value. Missing/malformed/foreign targets
  // cannot be classified as an authorised preview failure.
  const result = await ctx.transaction!.$queryRaw<Array<{ changed: boolean }>>`SELECT EXISTS (
    SELECT 1 FROM studio_field_migration_observations o
    JOIN studio_field_values v ON v.id=o."valueId" AND v."organisationId"=o."organisationId" AND v."slotId"=o."slotId"
    JOIN studio_definition_versions written ON written.id=v."versionId" AND written."definitionId"=v."definitionId" AND written."organisationId"=v."organisationId"
    LEFT JOIN service_work_items target ON target.id=v."referenceValue" AND target."organisationId"=o."organisationId" AND target.kind='TICKET'
    WHERE o."preparationId"=${preparation.id}::uuid AND o."organisationId"=${organisationId} AND v."valueType"='reference' AND (
      (written.payload->'field'->'storage'->'entity'->>'id') IS DISTINCT FROM 'tickets.ticket'
      OR ((written.payload->'field'->'storage'->'entity'->>'version') IN (${Prisma.join(policy.readVersions.map(String))})) IS NOT TRUE
      OR (v."isNull"=false AND target.id IS NULL)
    )) AS changed`;
  if (result.length !== 1 || result[0].changed !== false)
    throw new Error("MIGRATION_REFERENCE_COVERAGE_CHANGED: current ticket reference coverage is required.");
  return { organisationId, entityId: "tickets.ticket" as const, mode: "reference_coverage" as const, nativeReferenceCoverageComplete: true as const };
}

const representationInput = z.strictObject({ preparationId: z.uuid(), observationId: z.uuid() });
const representationOutput = z.strictObject({ ...recordAnchorSchema.shape, preparationId: z.uuid(), observationId: z.uuid(), representationOnly: z.literal(true) });
const settlementInput = z.strictObject({ preparationId: z.uuid(), mode: z.enum(["rollback", "history"]) });
const settlementOutput = z.strictObject({ ...migrationScope, mode: settlementInput.shape.mode,
  nativeCoverageComplete: z.literal(true), nativeReferenceCoverageComplete: z.literal(true) });

/** Current owner/private authority over retained representation history. No
 * creator grants, draft payload assumption, native write or value disclosure. */
async function coverTicketSettlement(ctx: RecordContext, input: z.output<typeof settlementInput>) {
  const client = await migrationSnapshotClient(ctx), organisationId = ctx.session.organisationId;
  const deny = () => { throw new Error("MIGRATION_SETTLEMENT_COVERAGE_REQUIRED: current ticket history coverage is required."); };
  const preparation = await client.studioFieldMigrationPreparation.findFirst({ where: { id: input.preparationId, organisationId, entityId: "tickets.ticket", state: "REVIEWED" },
    select: { id: true, review: { select: { review: true, checksum: true } } } });
  const cutover = await client.studioFieldMigrationCutover.findFirst({ where: { preparationId: input.preparationId, organisationId }, select: { state: true } });
  if (!preparation?.review || !cutover) return deny();
  const { review } = readSealedFieldMigrationReview(preparation.review);
  if (review.id !== input.preparationId || review.organisationId !== organisationId || review.source.payload.entity.id !== "tickets.ticket"
    || review.target.payload.entity.id !== "tickets.ticket" || !new Set<number>(executionSourceVersions).has(review.source.payload.entity.version)
    || review.target.payload.entity.version !== 5) return deny();
  if (input.mode === "rollback") {
    if (cutover.state !== "ACTIVATED") return deny();
    await executeMigrationSnapshot(ctx, { mode: "coverage", preparationId: input.preparationId }, executionSourceVersions);
  }
  for (const payload of [review.source.payload, review.target.payload]) {
    const storage = payload.field.storage;
    if (storage.type === "reference" && (storage.entity.id !== "tickets.ticket" || !new Set<number>(executionReadVersions).has(storage.entity.version))) return deny();
  }
  const rows = await ctx.transaction!.$queryRaw<Array<{ changed: boolean }>>`SELECT EXISTS (
    SELECT 1 FROM studio_field_migration_observations o
    LEFT JOIN service_work_items w ON w.id=o."recordId" AND w."organisationId"=o."organisationId" AND w.kind='TICKET'
    WHERE o."preparationId"=${input.preparationId}::uuid AND o."organisationId"=${organisationId} AND (o."entityId"<>'tickets.ticket' OR w.id IS NULL)
  ) OR EXISTS (
    SELECT 1 FROM studio_field_values v
    JOIN studio_definition_versions written ON written.id=v."versionId" AND written."definitionId"=v."definitionId" AND written."organisationId"=v."organisationId"
    LEFT JOIN service_work_items target ON target.id=v."referenceValue" AND target."organisationId"=v."organisationId" AND target.kind='TICKET'
    WHERE v."organisationId"=${organisationId} AND v."valueType"='reference' AND (
      EXISTS (SELECT 1 FROM studio_field_migration_observations o WHERE o."preparationId"=${input.preparationId}::uuid AND o."organisationId"=v."organisationId" AND o."valueId"=v.id)
      OR EXISTS (SELECT 1 FROM studio_field_migration_outcomes outcome WHERE outcome."preparationId"=${input.preparationId}::uuid AND outcome."organisationId"=v."organisationId" AND outcome."targetValueId"=v.id)
    ) AND ((written.payload->'field'->'storage'->'entity'->>'id') IS DISTINCT FROM 'tickets.ticket'
      OR ((written.payload->'field'->'storage'->'entity'->>'version') IN (${Prisma.join(executionReadVersions.map(String))})) IS NOT TRUE
      OR (v."isNull"=false AND target.id IS NULL))
  ) AS changed`;
  if (rows.length !== 1 || rows[0].changed !== false) return deny();
  return { organisationId, entityId: "tickets.ticket" as const, mode: input.mode, nativeCoverageComplete: true as const, nativeReferenceCoverageComplete: true as const };
}

/** Owner approval for reviewed extension representation only. Historical/final/
 * merged native work is not reopened, changed or made normally editable. */
async function approveTicketRepresentation(ctx: RecordContext, input: z.output<typeof representationInput>) {
  const client = await migrationSnapshotClient(ctx), organisationId = ctx.session.organisationId;
  const deny: () => never = () => { throw new Error("MIGRATION_REPRESENTATION_UNAVAILABLE: reviewed ticket representation is unavailable."); };
  await ctx.transaction!.$queryRaw`SELECT "preparationId" FROM studio_field_migration_publications
    WHERE "preparationId"=${input.preparationId}::uuid AND "organisationId"=${organisationId} FOR SHARE`;
  const pub = await client.studioFieldMigrationPublication.findFirst({ where: { preparationId: input.preparationId, organisationId, state: "PUBLISHED" },
    select: { preparationId: true, definitionId: true, reviewChecksum: true, sourceGenerationId: true, targetGenerationId: true,
      review: { select: { review: true, checksum: true } } } });
  if (!pub) deny();
  const { review } = readSealedFieldMigrationReview({ review: pub.review.review, checksum: pub.review.checksum });
  if (pub.reviewChecksum !== pub.review.checksum || review.id !== pub.preparationId || review.organisationId !== organisationId
    || review.definitionId !== pub.definitionId || review.principal.userId !== ctx.session.userId || review.principal.membershipId !== ctx.session.membershipId
    || review.source.payload.entity.id !== "tickets.ticket" || review.target.payload.entity.id !== "tickets.ticket"
    || review.target.payload.entity.version !== 5 || !executionSourceVersions.includes(review.source.payload.entity.version as typeof executionSourceVersions[number])
    || review.ownerQuery.id !== "tickets.ticket.field_migration" || review.ownerQuery.version !== 3
    || review.source.payload.storageGeneration !== pub.sourceGenerationId || review.target.payload.storageGeneration !== pub.targetGenerationId) deny();
  const member = await client.membership.findFirst({ where: { id: ctx.session.membershipId, userId: ctx.session.userId, organisationId, active: true },
    select: { sessionVersion: true, user: { select: { authVersion: true } } } });
  if (!member || member.sessionVersion !== review.principal.sessionVersion || member.user.authVersion !== review.principal.authVersion) deny();
  const fresh = await ctx.transaction!.$queryRaw<Array<{ fresh: boolean }>>`SELECT atlas_studio_execution_metadata_fresh(pub) AS fresh
    FROM studio_field_migration_publications pub WHERE pub."preparationId"=${input.preparationId}::uuid AND pub."organisationId"=${organisationId}`;
  if (fresh.length !== 1 || fresh[0].fresh !== true) deny();
  const observation = await client.studioFieldMigrationObservation.findFirst({ where: { id: input.observationId, preparationId: input.preparationId, organisationId,
    definitionId: pub.definitionId, entityId: "tickets.ticket", sourceGenerationId: pub.sourceGenerationId }, select: { id: true, recordId: true, nativeRevision: true } });
  if (!observation) deny();
  await ctx.transaction!.$queryRaw`SELECT id FROM service_work_items WHERE id=${observation.recordId} AND "organisationId"=${organisationId} AND kind='TICKET' FOR UPDATE`;
  const row = await client.serviceWorkItem.findFirst({ where: { AND: [workScope(ctx.session), { id: observation.recordId, kind: "TICKET" }] },
    select: { id: true, organisationId: true, version: true, queueId: true, queue: { select: { restricted: true } } } });
  if (!row || row.id !== observation.recordId || row.organisationId !== organisationId || row.version !== observation.nativeRevision) deny();
  if (row.queue.restricted && !await client.serviceQueueMember.findFirst({ where: { organisationId, queueId: row.queueId, userId: ctx.session.userId }, select: { id: true } })) deny();
  return { recordId: row.id, organisationId: row.organisationId, revision: row.version,
    preparationId: pub.preparationId, observationId: observation.id, representationOnly: true as const };
}

/** Canonical ServiceWorkItem/TICKET only. Existing intake answers stay native. */
export const ticketStudioContract: StudioModuleContract = { contributions: [
  query({ ...identity, id: "tickets.ticket.required_facts", label: "Ticket required-field conditions", kind: "query",
    input: z.strictObject({ recordId, expectedRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) }),
    output: z.strictObject({ recordId, organisationId: z.string().min(1), revision: z.number().int().positive(),
      fields: z.strictObject({ status: z.enum(WORK_STATUSES), priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]) }) }),
    transaction: "required", pagination: "none", maxCardinality: 1, costClass: "low",
    async execute(ctx, input) {
      const isolation = await ctx.transaction!.$queryRaw<Array<{ transaction_isolation: string }>>`SHOW transaction_isolation`;
      if (isolation.length !== 1 || isolation[0].transaction_isolation !== "serializable") throw new Error("Required facts need the owning serializable transaction.");
      const anchor = await authoriseTicketRecord(ctx, { recordId: input.recordId, intent: "read" });
      if (anchor.revision !== input.expectedRevision) throw new Error("This record changed. Refresh before saving.");
      await ctx.transaction!.$queryRaw`SELECT id FROM service_work_items WHERE id=${anchor.recordId} AND "organisationId"=${ctx.session.organisationId} AND kind='TICKET' FOR SHARE`;
      const row = await ctx.transaction!.serviceWorkItem.findFirst({ where: { id: anchor.recordId, organisationId: ctx.session.organisationId, kind: "TICKET", version: anchor.revision },
        select: { id: true, organisationId: true, version: true, status: true, priority: true } });
      if (!row || row.id !== anchor.recordId || row.organisationId !== ctx.session.organisationId || row.version !== anchor.revision) throw new Error("Ticket unavailable or changed.");
      return { recordId: row.id, organisationId: row.organisationId, revision: row.version, fields: { status: row.status, priority: row.priority } };
    } }),
  query({ ...identity, id: "tickets.ticket.field_settlement", label: "Ticket retained migration coverage", kind: "query",
    capability: "tickets.ticket.manage", input: settlementInput, output: settlementOutput, transaction: "required",
    fieldSettlement: { entityId: "tickets.ticket", sourceVersions: executionSourceVersions, targetVersions: [5], referenceVersions: executionReadVersions },
    pagination: "none", maxCardinality: 1, costClass: "high", execute: coverTicketSettlement }),
  query({ ...identity, id: "tickets.ticket.field_migration", label: "Ticket field migration snapshots", kind: "query",
    capability: "tickets.ticket.manage", input: migrationInput, output: migrationOutput, transaction: "required",
    pagination: "cursor", maxCardinality: 50, costClass: "high",
    execute: (ctx, input) => executeMigrationSnapshot(ctx, input, migrationSourceVersions) }),
  query({ ...identity, version: 2, id: "tickets.ticket.field_migration", label: "Ticket field and reference review", kind: "query",
    capability: "tickets.ticket.manage", input: referenceMigrationInput, output: referenceMigrationOutput, transaction: "required",
    pagination: "cursor", maxCardinality: 50, costClass: "high",
    execute: (ctx, input) => input.mode === "reference_coverage" ? referenceCoverage(ctx, input.preparationId)
      : executeMigrationSnapshot(ctx, input, referenceSourceVersions) }),
  query({ ...identity, version: 3, id: "tickets.ticket.field_migration", label: "Ticket reviewed representation coverage", kind: "query",
    capability: "tickets.ticket.manage", input: referenceMigrationInput, output: referenceMigrationOutput, transaction: "required",
    pagination: "cursor", maxCardinality: 50, costClass: "high",
    execute: (ctx, input) => input.mode === "reference_coverage" ? referenceCoverage(ctx, input.preparationId, executionReviewPolicy)
      : executeMigrationSnapshot(ctx, input, executionSourceVersions) }),
  query({ ...identity, id: "tickets.ticket.field_representation", label: "Approve reviewed ticket representation", kind: "query",
    capability: "tickets.ticket.manage", input: representationInput, output: representationOutput, transaction: "required",
    pagination: "none", maxCardinality: 1, costClass: "high", execute: approveTicketRepresentation }),
  query({ ...identity, id: "tickets.ticket.migration_cohort", label: "Ticket migration access coverage", kind: "query",
    capability: "tickets.ticket.manage", input: z.strictObject({}),
    output: z.strictObject({ organisationId: z.string().min(1), entityId: z.literal("tickets.ticket"),
      count: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), accessComplete: z.literal(true) }),
    pagination: "none", maxCardinality: 1, costClass: "high",
    async execute(ctx) {
      // Visible-list pagination cannot establish complete coverage. Only the
      // owner examines inaccessible rows, and never returns their identity/count.
      // A single read snapshot prevents a new private row leaking via the count.
      return db.$transaction(async transaction => {
        assertCapability(ctx.session, "tickets.ticket.manage");
        const client = await requireSource({ session: ctx.session, transaction });
        const scope = { organisationId: ctx.session.organisationId, kind: "TICKET" as const };
        const unavailable = await client.serviceWorkItem.findFirst({ where: { ...scope, OR: [
          { NOT: workScope(ctx.session) },
          { queue: { restricted: true, members: { none: { organisationId: ctx.session.organisationId, userId: ctx.session.userId } } } },
        ] }, select: { id: true } });
        if (unavailable) throw new Error("MIGRATION_ACCESS_REQUIRED: complete ticket access must be reviewed by an authorised queue member.");
        const count = await client.serviceWorkItem.count({ where: scope });
        // Count all canonical rows, including absent extension anchors and final
        // or merged work. This approves access only, not changing those records.
        return { organisationId: ctx.session.organisationId, entityId: "tickets.ticket" as const, count, accessComplete: true as const };
      }, { isolationLevel: "Serializable" });
    } }),
  query({ ...identity, id: "tickets.ticket.list", label: "Tickets", kind: "query", input: listInput,
    output: z.strictObject({ records: z.array(projection).max(50), next: listInput.shape.cursor.nullable() }),
    pagination: "cursor", maxCardinality: 50, costClass: "medium",
    async execute(ctx, input) {
      const client = await requireSource(ctx);
      const cursor = input.cursor;
      const rows = await client.serviceWorkItem.findMany({ where: { AND: [workScope(ctx.session), { kind: "TICKET",
        ...(input.status ? { status: input.status } : {}),
        ...(input.search ? { OR: [{ number: { contains: input.search, mode: "insensitive" } }, { subject: { contains: input.search, mode: "insensitive" } }] } : {}) },
        ...(cursor ? [{ OR: [{ updatedAt: { lt: new Date(cursor.updated_at) } }, { updatedAt: new Date(cursor.updated_at), id: { lt: cursor.id } }] }] : [])] },
        select, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: input.limit + 1 });
      const records = rows.slice(0, input.limit).map(project), last = records.at(-1);
      return { records, next: rows.length > input.limit && last ? { updated_at: last.fields.updated_at, id: last.id } : null };
    } }),
  query({ ...identity, id: "tickets.ticket.get", label: "Ticket", kind: "query", input: z.strictObject({ recordId }), output: projection,
    pagination: "none", maxCardinality: 1, costClass: "low",
    async execute(ctx, input) {
      const client = await requireSource(ctx);
      const row = await client.serviceWorkItem.findFirst({ where: { AND: [workScope(ctx.session), { id: input.recordId, kind: "TICKET" }] }, select });
      if (!row) throw new Error("Ticket unavailable.");
      return project(row);
    } }),
  // Version 1 hashes remain unchanged for already saved metadata references.
  entity(ticketEntity),
  entity(ticketFieldEntity),
  entity({ ...ticketFieldEntity, version: 3, record: { ...ticketFieldEntity.record!, migrationSnapshot: {
    query: { id: "tickets.ticket.field_migration", version: 1 }, sourceVersions: migrationSourceVersions,
  } } }),
  entity({ ...ticketFieldEntity, version: 4, record: { ...ticketFieldEntity.record!, migrationSnapshot: {
    query: { id: "tickets.ticket.field_migration", version: 2 }, sourceVersions: referenceSourceVersions, referenceVersions: referenceReadVersions,
  } } }),
  entity({ ...ticketFieldEntity, version: 5, record: { ...ticketFieldEntity.record!, migrationSnapshot: {
    query: { id: "tickets.ticket.field_migration", version: 3 }, sourceVersions: executionSourceVersions, referenceVersions: executionReadVersions,
  }, migrationRepresentation: { query: { id: "tickets.ticket.field_representation", version: 1 }, sourceVersions: executionSourceVersions } } }),
  // Existing sealed v1–5 remain unchanged. v6 explicitly approves these facts;
  // tenant catalogue types/intake answers/private messages are not rule inputs.
  entity({ ...ticketFieldEntity, version: 6, record: { ...ticketFieldEntity.record!, migrationSnapshot: {
    query: { id: "tickets.ticket.field_migration", version: 3 }, sourceVersions: executionSourceVersions, referenceVersions: executionReadVersions,
  }, migrationRepresentation: { query: { id: "tickets.ticket.field_representation", version: 1 }, sourceVersions: executionSourceVersions },
    requiredFacts: { query: { id: "tickets.ticket.required_facts", version: 1 }, facts: [
      { fieldId: "status", type: "enum", classification: "confidential", codes: WORK_STATUSES },
      { fieldId: "priority", type: "enum", classification: "confidential", codes: ["LOW", "NORMAL", "HIGH", "URGENT"] },
    ] },
    initialisation: { capability: "tickets.ticket.create", authorise: authoriseNewTicketFields },
  } }),
] };
