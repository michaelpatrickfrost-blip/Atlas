import { viewPayloadSchema } from "./schema";
/** Stable registered owner identity survives content/version evolution. Choosing
 * another owner's view family creates a new definition, not a hidden rewrite. */
export function assertSameViewOwner(original: unknown, candidate: unknown) {
  if (viewPayloadSchema.parse(original).sourceView.id !== viewPayloadSchema.parse(candidate).sourceView.id)
    throw new Error("A business dashboard keeps its original owning source. Create a new dashboard for another source.");
}
