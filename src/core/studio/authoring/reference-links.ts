import { z } from "zod";
import { customFieldReferenceSchema } from "../record-types/schema";
import { viewVersionReferenceSchema } from "../views/schema";

export const designReferenceSchema = z.union([customFieldReferenceSchema, viewVersionReferenceSchema]);
export type DesignReference = z.infer<typeof designReferenceSchema>;
export type ReferenceNavigationContext = { business?: string };
const businessSchema = z.string().min(1).max(100);
export function designReferenceLinks(input: unknown, context: ReferenceNavigationContext = {}) {
  const pin = designReferenceSchema.parse(input);
  const query = new URLSearchParams({ kind: pin.kind, version: pin.versionId,
    schema: String(pin.schemaVersion), checksum: pin.checksum });
  if (context.business !== undefined) query.set("business", businessSchema.parse(context.business));
  const suffix = context.business === undefined ? "" : `?business=${encodeURIComponent(context.business)}`;
  return { sourceHref: `/design-studio/${pin.kind === "view" ? "dashboards" : "setup"}/${pin.definitionId}${suffix}`,
    whereUsedHref: `/design-studio/references/${pin.definitionId}?${query}` };
}
