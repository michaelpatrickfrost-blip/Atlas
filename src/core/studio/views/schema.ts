import { z } from "zod";
import { referenceSchema } from "../compiler/reference";

export type ViewJson = null | boolean | number | string | ViewJson[] | { [key: string]: ViewJson };
/** Metadata only, with finite JSON/depth/size limits. The registered owner applies
 * its closed content schema; this envelope never accepts executable functions. */
export const viewJsonSchema: z.ZodType<ViewJson> = z.json().superRefine((value, context) => {
  let count = 0;
  function visit(item: unknown, depth: number): boolean {
    if (++count > 10000 || depth > 12) return false;
    if (typeof item === "string") return item.length <= 20000;
    if (typeof item === "number") return Number.isFinite(item);
    if (!item || typeof item !== "object") return true;
    if (Array.isArray(item)) return item.every(member => visit(member, depth + 1));
    return Object.entries(item).every(([key, member]) => key.length <= 200 && visit(member, depth + 1));
  }
  if (!visit(value, 0)) context.addIssue({ code: "custom", message: "The view metadata exceeds its safe size or depth." });
});
export const viewPayloadSchema = z.strictObject({ schemaVersion: z.literal(1), sourceView: referenceSchema, content: viewJsonSchema });
export type ViewPayload = z.infer<typeof viewPayloadSchema>;
