import { z } from "zod";
import { checksum } from "./contracts";
import type { ContractIdentity, Contribution } from "./types";
import { viewSourcePolicySchema, preparedViewSchema, compiledOwnerViewSchema, type ViewSourceCallbacks, type ViewSourcePolicy } from "../views/owner-contract";
import { viewJsonSchema } from "../views/schema";

/** Additive descriptive owner compiler facet. Generic invoke never executes it. */
export function viewSource(descriptor: ContractIdentity & { contentSchema: z.ZodType; policy: ViewSourcePolicy; callbacks: ViewSourceCallbacks }): Contribution {
  const policy = viewSourcePolicySchema.parse(descriptor.policy), contentSchema = z.toJSONSchema(descriptor.contentSchema);
  const { id, version, label, capability, lifecycle, classification, supportedUntil } = descriptor;
  const owner = Object.freeze({ ...descriptor.callbacks });
  const content = (value: unknown) => viewJsonSchema.parse(descriptor.contentSchema.parse(value));
  return { metadata: { id, version, label, capability, lifecycle, classification, ...(supportedUntil ? { supportedUntil } : {}),
    kind: "surface", schemaHash: checksum({ contentSchema, policy }), outputSchema: contentSchema,
    details: { viewSource: policy } }, viewSource: {
      prepare(value) {
        const prepared = preparedViewSchema.parse(owner.prepare(value));
        return { ...prepared, content: content(prepared.content) };
      },
      compile(value, approvals) {
        const compiled = compiledOwnerViewSchema.parse(owner.compile(content(value), approvals));
        return { ...compiled, content: content(compiled.content) };
      },
    } };
}
