import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { sessionAuthorityStamp } from "@/core/auth/session";
import { withFieldRuntimeAuthority, fieldRuntimeAuthorityInTransaction, nativeFieldMutationSessionInTransaction, type FieldRuntimeAuthority } from "../fields/runtime-authority";
import { db } from "@/core/db/client";
import { loadSealedConfigurationVersion } from "../configuration/pins";
import { pagePayloadSchema } from "./schema";
import { pageApprovalsSchema } from "./approvals";
import { compilePage } from "./compiler";
import { pageReadScope } from "./definition-compiler";
import { pageQueryRequestSchema } from "./owner-contract";

const frame = z.object({ kind: z.literal("page"), schemaVersion: z.literal(1), approvals: pageApprovalsSchema });
const ref = ({ id, version, schemaHash, contractHash }: { id: string; version: number; schemaHash: string; contractHash: string }) => ({ id, version, schemaHash, contractHash });
function genuine(authority: FieldRuntimeAuthority) {
  if (!sessionAuthorityStamp(authority.session) || sessionAuthorityStamp(authority.session) !== authority.stamp)
    throw new Error("FORBIDDEN: current business access is required.");
}
async function screen(authority: FieldRuntimeAuthority, definitionId: string) {
  genuine(authority);
  const row = await authority.transaction.studioDefinition.findFirst({ where: { id: definitionId, organisationId: authority.session.organisationId,
    kind: "page", retiredAt: null }, include: { activeVersion: true } });
  if (!row?.activeVersion || row.activeVersionId !== row.activeVersion.id) throw new Error("NOT_FOUND: this business screen is unavailable.");
  const version = await loadSealedConfigurationVersion(authority.session, authority.transaction, { kind: "page", definitionId: row.id,
    versionId: row.activeVersion.id, schemaVersion: row.activeVersion.schemaVersion, checksum: row.activeVersion.checksum });
  const stored = frame.parse(version.compiledPlan), payload = pagePayloadSchema.parse(version.payload);
  const sourcePage = ref(stored.approvals.sourcePage);
  const owner = await authority.registry.resolvePageSourcePolicy({ session: authority.session, transaction: authority.transaction }, sourcePage);
  const scope = pageReadScope(compilePage(payload, stored.approvals), owner.policy);
  return { id: row.id, name: row.name, definitionRevision: row.revision, versionId: version.id,
    entityId: owner.source.id, scope, sourcePage, owner };
}

/** Discovery exposes only current owner-authorised screen names. Configuration
 * grants neither native records nor Studio authoring rights to customer users. */
export async function listCustomerScreens(authenticated: Session) {
  return db.$transaction(async transaction => {
    const current = await nativeFieldMutationSessionInTransaction(authenticated, transaction);
    const customer = await transaction.organisation.findFirst({ where: { id: current.session.organisationId, kind: "CUSTOMER",
      status: "ACTIVE", archivedAt: null }, select: { id: true } });
    if (!customer) return [];
    const authority = await fieldRuntimeAuthorityInTransaction(current.session, transaction);
    genuine(authority);
    const rows = await authority.transaction.studioDefinition.findMany({ where: { organisationId: authority.session.organisationId,
      kind: "page", retiredAt: null, activeVersionId: { not: null } }, select: { id: true }, orderBy: { name: "asc" }, take: 101 });
    if (rows.length > 100) throw new Error("The business screen catalogue exceeds its configured limit.");
    const result = [];
    for (const row of rows) {
      try { const value = await screen(authority, row.id); result.push({ id: value.id, name: value.name, entityId: value.entityId, scope: value.scope }); }
      catch (error) { if (!(error instanceof Error && /^(FORBIDDEN|DEPENDENCY_BROKEN|NOT_FOUND):/.test(error.message))) throw error; }
    }
    return result;
  }, { isolationLevel: "Serializable" });
}

/** Bounded canonical record chooser. It uses the registered closed owner list,
 * including every projection grant and private queue/tenant check, before data. */
export async function customerScreenRecords(authenticated: Session, input: unknown) {
  const value = z.union([z.uuid().transform(definitionId => ({ definitionId, cursor: null,
    expectedVersionId: undefined, expectedDefinitionRevision: undefined })), z.strictObject({ definitionId: z.uuid(),
    cursor: pageQueryRequestSchema.shape.cursor, expectedVersionId: z.uuid(), expectedDefinitionRevision: z.number().int().nonnegative() })]).parse(input);
  return withFieldRuntimeAuthority(authenticated, async authority => {
    const selected = await screen(authority, value.definitionId);
    if ((value.expectedVersionId !== undefined && value.expectedVersionId !== selected.versionId)
      || (value.expectedDefinitionRevision !== undefined && value.expectedDefinitionRevision !== selected.definitionRevision))
      throw new Error("CONFLICT: this business screen changed. Refresh before choosing more records.");
    const query = selected.owner.policy.queries.find(query => query.scope === "list" && query.purpose === "list");
    if (!query) throw new Error("This app has not approved a record chooser.");
    const output = await authority.registry.invokePageRead({ session: authority.session, transaction: authority.transaction }, selected.sourcePage,
      { kind: "list" }, { query: query.query, pageSize: 50, cursor: value.cursor });
    return { definitionId: selected.id, definitionRevision: selected.definitionRevision, versionId: selected.versionId,
      name: selected.name, scope: selected.scope, records: output.output.rows.map(row => {
      const label = [row.values.number, row.values.reference, row.values.subject, row.values.customer_name]
        .filter((value): value is string => typeof value === "string" && !!value).join(" · ");
      return { id: row.id, label: label || "Business record" };
    }), hasMore: output.output.nextCursor !== null, nextCursor: output.output.nextCursor };
  });
}
