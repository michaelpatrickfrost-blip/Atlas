import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { RecordContext } from "../../registry/types";
import type { CapabilityRegistry } from "../../registry/registry";
import { compileCustomField } from "../../compiler/fields";
import { compileConditionalCustomField } from "../conditional-compiler";
import { createRequiredMetadataProvider } from "../required-source";
import { versionedFieldPayloadSchema, type ConditionalFieldPayload } from "../required-contract";
import type { CustomFieldPayload } from "../schema";
import { assertFieldMigrationPolicies, assertVersionedFieldMigrationPolicies } from "./access";

type Context = RecordContext & { transaction: Prisma.TransactionClient };
type Company = Parameters<typeof assertFieldMigrationPolicies>[1];
type Legacy = Awaited<ReturnType<typeof compileCustomField>>;
type Conditional = Awaited<ReturnType<typeof compileConditionalCustomField>>;
export function compileFieldMigrationMetadata(context: Context, registry: CapabilityRegistry, company: Company, definitionId: string, input: CustomFieldPayload): Promise<Legacy>;
export function compileFieldMigrationMetadata(context: Context, registry: CapabilityRegistry, company: Company, definitionId: string, input: ConditionalFieldPayload): Promise<Conditional>;
export function compileFieldMigrationMetadata(context: Context, registry: CapabilityRegistry, company: Company, definitionId: string, input: unknown): Promise<Legacy | Conditional>;

/** Internal metadata inspection in the caller's transaction, including empty
 * cohorts. No value/fact execution, persistence, owner protocol approval or client
 * dispatch. Retained v1 services keep their closed packet parsers. Conditional
 * compilation refreshes genuine identity and uses the locked provider's registry,
 * current/pinned bindings and bounded graph, never a supplied fact closure. */
export async function compileFieldMigrationMetadata(context: Context, registry: CapabilityRegistry, company: Company, definitionId: string, input: unknown): Promise<Legacy | Conditional> {
  const id = z.uuid().parse(definitionId), payload = versionedFieldPayloadSchema.parse(input);
  if (payload.schemaVersion === 1) {
    assertFieldMigrationPolicies(context.session, company, payload);
    return compileCustomField(context.session, payload, registry);
  }
  // Check authoring/current-company policy before inspecting dependency metadata.
  assertVersionedFieldMigrationPolicies(context.session, company, payload);
  const provider = await createRequiredMetadataProvider(context.session, context.transaction, id, payload.entity);
  assertVersionedFieldMigrationPolicies(provider.authority.session, company, payload);
  return compileConditionalCustomField({ session: provider.authority.session, registry: provider.authority.registry,
    definitionId: id, resolveMetadata: provider.resolveMetadata }, payload);
}
