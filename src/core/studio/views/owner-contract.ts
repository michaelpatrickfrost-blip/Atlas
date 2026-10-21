import { z } from "zod";
import type { ContractMetadata, ContractReference } from "../registry/types";
import { referenceSchema } from "../compiler/reference";
import { viewJsonSchema, type ViewJson } from "./schema";
import { checksum } from "../registry/contracts";
import type { RegisteredMetricSource } from "../registry/analytics-source-contracts";

const logicalId = z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/);
export const viewSourceIdentitySchema = z.strictObject({ id: logicalId, version: z.number().int().positive() });
export const viewSourcePolicySchema = z.strictObject({ schemaVersion: z.literal(1), family: z.literal("analytics_dashboard"),
  authoringCapability: logicalId, requiredModules: z.array(z.string().regex(/^[a-z][a-z0-9_]*$/)).min(1).max(8),
  maxQueries: z.number().int().min(1).max(8), maxQueryCost: z.number().int().min(1).max(24),
  sources: z.array(viewSourceIdentitySchema).min(1).max(100) });
export type ViewSourcePolicy = z.infer<typeof viewSourcePolicySchema>;
export const preparedViewSchema = z.strictObject({ content: viewJsonSchema, sources: z.array(viewSourceIdentitySchema).min(1).max(8) });
export const compiledOwnerViewSchema = z.strictObject({ content: viewJsonSchema,
  requests: z.array(z.strictObject({ widgetId: z.string().min(1).max(80), query: referenceSchema, input: viewJsonSchema })).min(1).max(8) });
export type ViewSourceApproval = { source: ContractReference; metadata: ContractMetadata; query: ContractReference;
  queryMetadata: ContractMetadata; policy: RegisteredMetricSource };
/** Both callbacks are pure closed owner metadata adapters. No Session, database,
 * native queries, renderer, publisher or arbitrary registry invocation is passed. */
export type ViewSourceCallbacks = {
  prepare(content: ViewJson): z.infer<typeof preparedViewSchema>;
  compile(content: ViewJson, approvals: readonly ViewSourceApproval[]): z.infer<typeof compiledOwnerViewSchema>;
};
export function validateViewSourceRegistration(metadata: ContractMetadata, callbacks: ViewSourceCallbacks | undefined) {
  if (metadata.details.viewSource === undefined) {
    if (callbacks) throw new Error("View compiler callbacks require an explicit registered policy.");
    return;
  }
  const policy = viewSourcePolicySchema.parse(metadata.details.viewSource);
  if (metadata.kind !== "surface" || !callbacks || typeof callbacks.prepare !== "function" || typeof callbacks.compile !== "function"
    || !policy.authoringCapability.startsWith(`${metadata.ownerModuleId}.`) || !policy.requiredModules.includes(metadata.ownerModuleId)
    || new Set(policy.requiredModules).size !== policy.requiredModules.length
    || new Set(policy.sources.map(source => `${source.id}@${source.version}`)).size !== policy.sources.length
    || !metadata.outputSchema || metadata.schemaHash !== checksum({ contentSchema: metadata.outputSchema, policy }))
    throw new Error("Invalid owning view compiler contract.");
}
