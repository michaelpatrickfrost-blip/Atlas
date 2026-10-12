import { z } from "zod";
import { customFieldReferenceSchema, pageReferenceSchema, entityProfileReferenceSchema, recordTypeReferenceSchema } from "../record-types/schema";
import { viewVersionReferenceSchema } from "../views/schema";

export const designReferenceSchema = z.union([customFieldReferenceSchema, viewVersionReferenceSchema, pageReferenceSchema, entityProfileReferenceSchema, recordTypeReferenceSchema]);
export type DesignReference = z.infer<typeof designReferenceSchema>;
export type ReferenceNavigationContext = { business?: string };
const businessSchema = z.string().min(1).max(100);
export function designReferenceLinks(input: unknown, context: ReferenceNavigationContext = {}) {
  const pin = designReferenceSchema.parse(input);
  const query = new URLSearchParams({ kind: pin.kind, version: pin.versionId,
    schema: String(pin.schemaVersion), checksum: pin.checksum });
  if (context.business !== undefined) query.set("business", businessSchema.parse(context.business));
  const destination = pin.kind === "page" ? "" : pin.kind === "view" ? "dashboards/" : "setup/";
  const suffix = context.business === undefined ? "" : `?business=${encodeURIComponent(context.business)}`;
  return { sourceHref: `/design-studio/${destination}${pin.definitionId}${suffix}`,
    whereUsedHref: `/design-studio/references/${pin.definitionId}?${query}` };
}
