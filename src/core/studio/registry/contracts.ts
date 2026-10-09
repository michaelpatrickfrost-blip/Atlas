import { createHash } from "node:crypto";
import { z } from "zod";
import type { CommandDescriptor, ContractIdentity, Contribution, DeclarativeDescriptor, EntityDescriptor, QueryDescriptor } from "./types";
import { entityDetailsSchema, recordAnchorSchema, recordRequestSchema } from "./entities";

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new Error("Studio contracts must be JSON serializable.");
    return encoded;
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
}
export function checksum(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}
function identity(d: ContractIdentity): ContractIdentity {
  return { id: d.id, version: d.version, label: d.label, capability: d.capability, lifecycle: d.lifecycle,
    ...(d.supportedUntil ? { supportedUntil: d.supportedUntil } : {}), classification: d.classification };
}
export function query<I, O>(d: QueryDescriptor<I, O>): Contribution {
  const inputSchema = z.toJSONSchema(d.input, { io: "input" });
  const outputSchema = z.toJSONSchema(d.output, { io: "output" });
  return { metadata: { ...identity(d), kind: d.kind, inputSchema, outputSchema,
    schemaHash: checksum({ inputSchema, outputSchema }),
    details: { pagination: d.pagination, maxCardinality: d.maxCardinality, costClass: d.costClass } },
    run: async (ctx, value) => d.output.parseAsync(await d.execute(ctx, await d.input.parseAsync(value))) };
}
export function command<I, O>(d: CommandDescriptor<I, O>): Contribution {
  const inputSchema = z.toJSONSchema(d.input, { io: "input" });
  const outputSchema = z.toJSONSchema(d.output, { io: "output" });
  return { metadata: { ...identity(d), kind: d.kind, inputSchema, outputSchema,
    schemaHash: checksum({ inputSchema, outputSchema }),
    details: { execution: d.execution, idempotency: d.idempotency, sideEffect: d.sideEffect } },
    run: async (ctx, value) => d.output.parseAsync(await d.invoke(ctx, await d.input.parseAsync(value))) };
}
export function entity(d: EntityDescriptor): Contribution {
  const details = entityDetailsSchema.parse({ key: d.key, fields: d.fields, extensionPolicy: d.extensionPolicy,
    ...(d.record ? { record: { writeCapability: d.record.writeCapability, detailRoute: d.record.detailRoute,
      labelField: d.record.labelField, listQuery: d.record.listQuery, getQuery: d.record.getQuery,
      ...(d.record.fieldPolicy ? { fieldPolicy: d.record.fieldPolicy } : {}),
      nativeFields: "read_only", revision: "owner_positive_integer" } } : {}) });
  return { metadata: { ...identity(d), kind: d.kind, details, schemaHash: checksum(details) },
    ...(d.record ? { authoriseRecord: async (ctx, value) => recordAnchorSchema.parseAsync(await d.record!.authorise(ctx, recordRequestSchema.parse(value))) } : {}) };
}
export function declarative(d: DeclarativeDescriptor): Contribution {
  const outputSchema = z.toJSONSchema(d.schema);
  return { metadata: { ...identity(d), kind: d.kind, outputSchema, schemaHash: checksum(outputSchema), details: { references: d.references } } };
}
