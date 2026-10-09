import type { z } from "zod";
import type { Session } from "@/core/auth/session";

export type Classification = "public_internal" | "confidential" | "restricted";
export type ContractKind = "entity" | "query" | "command" | "event" | "surface" | "decisionFact" | "template" | "metric" | "integration";
export type ContractIdentity = {
  id: string;
  version: number;
  label: string;
  capability: string;
  lifecycle: "active" | "deprecated";
  /** Required for deprecated contracts; historical references remain resolvable. */
  supportedUntil?: string;
  classification: Classification;
};
export type FieldDescriptor = {
  id: string;
  type: "string" | "integer" | "decimal" | "money" | "boolean" | "date" | "datetime" | "enum" | "reference";
  nullable: boolean;
  classification: Classification;
  capability?: string;
  filterable: boolean;
  sortable: boolean;
  decision: boolean;
  template: boolean;
};
export type EntityDescriptor = ContractIdentity & {
  kind: "entity";
  key: "uuid" | "string";
  fields: readonly FieldDescriptor[];
  extensionPolicy: { customFields: boolean; recordTypes: boolean; pageVariants: boolean };
};
export type Context = { session: Session; idempotencyKey?: string };
export type QueryDescriptor<I, O> = ContractIdentity & {
  kind: "query";
  input: z.ZodType<I>;
  output: z.ZodType<O>;
  pagination: "cursor" | "page" | "none";
  maxCardinality: number;
  costClass: "low" | "medium" | "high";
  execute(ctx: Context, input: I): Promise<O>;
};
export type CommandDescriptor<I, O> = ContractIdentity & {
  kind: "command";
  input: z.ZodType<I>;
  output: z.ZodType<O>;
  execution: "transactional" | "durable";
  idempotency: "required" | "supported" | "not_applicable";
  sideEffect: "none" | "internal" | "external";
  invoke(ctx: Context, input: I): Promise<O>;
};
/** Descriptor-only contributions cannot be invoked as an arbitrary function. */
export type DeclarativeDescriptor = ContractIdentity & {
  kind: Exclude<ContractKind, "query" | "command" | "entity">;
  schema: z.ZodType;
  references: readonly string[];
};
export type ContractMetadata = ContractIdentity & {
  ownerModuleId: string;
  kind: ContractKind;
  schemaHash: string;
  contractHash: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
  details: Readonly<Record<string, unknown>>;
};
/** Typed factory closes over each input/output type before heterogeneous registration. */
export type Contribution = {
  metadata: Omit<ContractMetadata, "ownerModuleId" | "contractHash">;
  run?: (ctx: Context, input: unknown) => Promise<unknown>;
};
export type StudioModuleContract = { contributions: readonly Contribution[] };
export type ContractReference = { id: string; version: number; schemaHash: string; contractHash: string };
