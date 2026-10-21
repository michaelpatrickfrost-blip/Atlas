import { checksum } from "../registry/contracts";
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from "../fields/runtime-authority";
import { viewPayloadSchema } from "./schema";

/** Explicit new envelope entry, using actual current server identity/locks and
 * registry in the original authoring transaction. No data query/publication. */
export async function compileRegisteredView(authority: FieldRuntimeAuthority, input: unknown) {
  const current = await fieldRuntimeAuthorityInTransaction(authority.session, authority.transaction);
  const payload = viewPayloadSchema.parse(input);
  const compiled = await current.registry.compileViewSourceInTransaction({ session: current.session, transaction: current.transaction }, payload.sourceView, payload.content);
  const normalised = { ...payload, content: compiled.content };
  const plan = { kind: "view" as const, schemaVersion: 1 as const, payload: normalised, requests: compiled.requests,
    dependencies: compiled.dependencies, configurationDependencies: [], warnings: [] as string[] };
  return { payload: normalised, plan, checksum: checksum(plan), warnings: plan.warnings };
}

export type CompiledViewDefinition = Awaited<ReturnType<typeof compileRegisteredView>>;
