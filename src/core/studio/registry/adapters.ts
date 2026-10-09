import { z } from "zod";
import type { ModuleManifest } from "@/core/modules/types";
import { declarative, query } from "./contracts";
import type { Contribution } from "./types";

export const templateRecordSchema = z.strictObject({
  id: z.string().min(1), type: z.string().min(1), label: z.string(),
  href: z.string().regex(/^\/(?!\/)/), partyId: z.string().nullable(),
  contactId: z.string().nullable().optional(), fields: z.record(z.string(), z.string()),
});
/** Preserves the existing owner's whitelist and tenant/record guards; no new data reads. */
export function templateProviderAdapter(module: ModuleManifest): Contribution[] {
  const provider = module.templateContextProvider;
  if (!provider) return [];
  return provider.types.flatMap(type => {
    const id = `${module.id}.template.${type.id}`;
    const record = templateRecordSchema.extend({ type: z.literal(type.id) });
    const shared = { version: 1, capability: type.capability, lifecycle: "active" as const,
      classification: "confidential" as const, pagination: "none" as const, costClass: "low" as const };
    return [
      declarative({ ...shared, kind: "template", id, label: type.label, schema: record, references: [`${id}.list`, `${id}.get`] }),
      query({ ...shared, kind: "query", id: `${id}.list`, label: `Choose ${type.label}`, maxCardinality: 200,
        input: z.strictObject({}), output: z.array(record).max(200),
        execute: ctx => provider.list(ctx.session, type.id) }),
      query({ ...shared, kind: "query", id: `${id}.get`, label: `Read ${type.label}`, maxCardinality: 1,
        input: z.strictObject({ id: z.string().min(1).max(200) }), output: record.nullable(),
        execute: (ctx, input) => provider.get(ctx.session, type.id, input.id) }),
    ];
  });
}
