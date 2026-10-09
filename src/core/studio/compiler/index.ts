import type { Session } from "@/core/auth/session";
import type { CapabilityRegistry } from "../registry/registry";
import { kernelPayloadSchema, compileKernel } from "./kernel";
import { customFieldPayloadSchema } from "../fields/schema";
import { compileCustomField } from "./fields";

/** Closed dispatch. Unimplemented later-phase kinds must remain unavailable. */
export function parseDefinitionPayload(kind: string, input: unknown) {
  if (kind === "capabilitySet") return kernelPayloadSchema.parse(input);
  if (kind === "customField") return customFieldPayloadSchema.parse(input);
  throw new Error("No Studio compiler is registered for this definition kind yet.");
}

export async function compileDefinition(session: Session, kind: string, input: unknown, registry: CapabilityRegistry) {
  if (kind === "customField") return compileCustomField(session, input, registry);
  return compileKernel(session, kind, input, registry);
}
