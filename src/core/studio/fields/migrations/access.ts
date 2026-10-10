import type { Organisation } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import type { CapabilityRegistry } from "../../registry/registry";
import type { RecordContext } from "../../registry/types";
import { STUDIO_CAPABILITIES, STUDIO_DATA_CAPABILITIES } from "../../permissions";
import { customFieldPayloadSchema, type CustomFieldPayload, type FieldValue } from "../schema";
import { assertFieldAccess } from "../validation";

type Company = Pick<Organisation, "id" | "kind" | "status" | "archivedAt" | "isTest">;
function denied(): never { throw new Error("FORBIDDEN: current field data access is required."); }

/** Internal only. Company and schemas must come from server-owned storage. No decoding here. */
export function assertFieldMigrationPolicies(session: Session, company: Company, currentInput: unknown, writtenInput?: unknown) {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  if (company.id !== session.organisationId || company.kind !== "CUSTOMER" || company.status !== "ACTIVE" || company.archivedAt !== null
    || typeof company.isTest !== "boolean") denied();
  // Protect all production field previews, so an omitted sensitivity tag cannot
  // silently expose live values. Test samples still need every field/native guard.
  if (!company.isTest) assertCapability(session, STUDIO_DATA_CAPABILITIES.liveTest);
  const current = customFieldPayloadSchema.parse(currentInput), written = writtenInput === undefined ? current : customFieldPayloadSchema.parse(writtenInput);
  if (current.entity.id !== written.entity.id || current.field.key !== written.field.key) denied();
  for (const payload of [current, written]) assertFieldAccess(session, payload.field, "write");
  return { current, written };
}

/** Existing reference identity stays private unless its owning module permits reading it. */
export async function authoriseFieldMigrationReference(context: RecordContext, registry: CapabilityRegistry, payload: CustomFieldPayload, value: FieldValue | null) {
  if (value === null || payload.field.storage.type !== "reference") return;
  if (!context.transaction || value.type !== "reference") denied();
  // Use the written reference contract, including its exact schema/contract hash.
  // Native owner authorisation enforces target tenant/private/source policy.
  await registry.authoriseRecord(context, payload.field.storage.entity, { recordId: value.value, intent: "read" });
}
