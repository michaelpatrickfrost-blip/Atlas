import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { checksum } from "../registry/contracts";
import type { CapabilityRegistry } from "../registry/registry";
export const referenceSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/),
  version: z.number().int().positive(), schemaHash: z.string().regex(/^[a-f0-9]{64}$/),
  contractHash: z.string().regex(/^[a-f0-9]{64}$/),
});
/** Phase 1 metadata-only definition. Later builders register their own compilers. */
export const kernelPayloadSchema = z.strictObject({ schemaVersion: z.literal(1),
  description: z.string().max(2000), references: z.array(referenceSchema).max(100) });
export type KernelPayload = z.infer<typeof kernelPayloadSchema>;
export async function compileKernel(session: Session, kind: string, input: unknown, registry: CapabilityRegistry) {
  if (kind !== "capabilitySet") throw new Error("No Studio compiler is registered for this definition kind yet.");
  const payload = kernelPayloadSchema.parse(input);
  if (new Set(payload.references.map(ref => `${ref.id}@${ref.version}`)).size !== payload.references.length) throw new Error("Duplicate Studio dependency.");
  const references = [...payload.references].sort((a,b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) || a.version - b.version);
  const resolved = [];
  const warnings: string[] = [];
  for (const ref of references) {
    const descriptor = await registry.resolve(session, ref);
    // Kernel definitions describe approved read capabilities. Executable/high-risk
    // configuration needs the later artefact-specific compiler and publication policy.
    if (["command", "integration"].includes(descriptor.kind)) throw new Error("Executable configuration requires its later Studio compiler and risk policy.");
    if (descriptor.lifecycle === "deprecated") warnings.push(`Deprecated: ${descriptor.id}@${descriptor.version} supported until ${descriptor.supportedUntil}`);
    resolved.push({ ...ref, ownerModuleId: descriptor.ownerModuleId, kind: descriptor.kind, classification: descriptor.classification });
  }
  const normalised = { ...payload, references };
  const plan = { kind: "capabilitySet" as const, schemaVersion: 1, payload: normalised, dependencies: resolved };
  return { payload: normalised, plan, checksum: checksum(plan), warnings };
}
