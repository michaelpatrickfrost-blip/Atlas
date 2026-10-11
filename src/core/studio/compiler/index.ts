import type { Session } from "@/core/auth/session";
import type { CapabilityRegistry } from "../registry/registry";
import { kernelPayloadSchema, compileKernel } from "./kernel";
import { customFieldPayloadSchema } from "../fields/schema";
import { compileCustomField } from "./fields";
import type { FieldRuntimeAuthority } from "../fields/runtime-authority";
import { pagePayloadSchema } from "../pages/schema";
import { compileStructuredPage } from "../pages/definition-compiler";
import { entityProfilePayloadSchema, recordTypePayloadSchema } from "../record-types/schema";
import { compileRecordProfile } from "../record-types/compiler";
import { viewPayloadSchema } from "../views/schema";
import { compileRegisteredView, type CompiledViewDefinition } from "../views/definition-compiler";

/** Closed dispatch. Unimplemented later-phase kinds must remain unavailable. */
export function parseDefinitionPayload(kind: string, input: unknown) {
  if (kind === "capabilitySet") return kernelPayloadSchema.parse(input);
  if (kind === "customField") return customFieldPayloadSchema.parse(input);
  if (kind === "page") return pagePayloadSchema.parse(input);
  if (kind === "entityProfile") return entityProfilePayloadSchema.parse(input);
  if (kind === "recordType") return recordTypePayloadSchema.parse(input);
  if (kind === "view" && viewPayloadSchema.safeParse(input).success) return viewPayloadSchema.parse(input);
  throw new Error("No Studio compiler is registered for this definition kind yet.");
}

export async function compileDefinition(session: Session, kind: string, input: unknown, registry: CapabilityRegistry) {
  if (kind === "customField") return compileCustomField(session, input, registry);
  return compileKernel(session, kind, input, registry);
}

/** New transactional kinds cannot use the original metadata-only Admin context.
 * This closed dispatch reuses the same original publisher and activation engine.
 */
type ExistingTransactionalDefinition = Awaited<ReturnType<typeof compileStructuredPage>> | Awaited<ReturnType<typeof compileRecordProfile>> | Awaited<ReturnType<typeof compileDefinition>>;
export function compileDefinitionInTransaction(authority: FieldRuntimeAuthority, definitionId: string, kind: "view", input: unknown): Promise<CompiledViewDefinition>;
export function compileDefinitionInTransaction(authority: FieldRuntimeAuthority, definitionId: string, kind: string, input: unknown): Promise<ExistingTransactionalDefinition | CompiledViewDefinition>;
export async function compileDefinitionInTransaction(authority: FieldRuntimeAuthority, definitionId: string, kind: string, input: unknown) {
  if (kind === "view" && viewPayloadSchema.safeParse(input).success) return compileRegisteredView(authority, input);
  if (kind === "page") return compileStructuredPage(authority, input);
  if (kind === "entityProfile" || kind === "recordType") return compileRecordProfile({ session: authority.session,
    transaction: authority.transaction, registry: authority.registry, definitionId }, kind, input);
  return compileDefinition(authority.session, kind, input, authority.registry);
}
