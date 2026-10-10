import type { z } from "zod";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";

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
  label?: string;
  type: "string" | "integer" | "decimal" | "money" | "boolean" | "date" | "datetime" | "enum" | "reference";
  nullable: boolean;
  classification: Classification;
  capability?: string;
  filterable: boolean;
  sortable: boolean;
  decision: boolean;
  template: boolean;
};
export type ExtensionFieldType = "string" | "integer" | "decimal" | "money" | "boolean" | "date" | "datetime" | "duration" | "email" | "url" | "phone" | "enum" | "multi_enum" | "reference" | "address";
export type ExtensionFieldPolicy = {
  types: readonly ExtensionFieldType[];
  reservedKeys: readonly string[];
  referenceEntities: readonly string[];
  maxFields: number;
};
export type EntityDescriptor = ContractIdentity & {
  kind: "entity";
  key: "uuid" | "string";
  fields: readonly FieldDescriptor[];
  extensionPolicy: { customFields: boolean; recordTypes: boolean; pageVariants: boolean };
  /** Opt-in owners supply an access check; Studio never guesses table access. */
  record?: {
    writeCapability: string;
    detailRoute: string;
    labelField: string;
    listQuery: { id: string; version: number };
    getQuery: { id: string; version: number };
    fieldPolicy?: ExtensionFieldPolicy;
    /** Read-only migration capture/coverage; ordinary record write guards still apply. */
    migrationSnapshot?: { query: { id: string; version: number }; sourceVersions: readonly number[];
      /** Explicit same-canonical-entity reference read versions covered by this
       * owner's pinned query. This metadata never grants reference permission. */
      referenceVersions?: readonly number[] };
    /** Representation-only approval of a persisted reviewed publication row.
     * This is distinct from normal extension editing and never grants native writes. */
    migrationRepresentation?: { query: { id: string; version: number }; sourceVersions: readonly number[] };
    authorise(ctx: RecordContext, request: RecordRequest): Promise<RecordAnchor>;
  };
};
export type RecordContext = { session: Session; transaction?: Prisma.TransactionClient };
export type RecordRequest = { recordId: string; intent: "read" | "extend"; expectedRevision?: number };
/** A canonical record reference, not a duplicate business record or mutation API. */
export type RecordAnchor = { recordId: string; organisationId: string; revision: number };
export type Context = { session: Session; idempotencyKey?: string; transaction?: Prisma.TransactionClient };
export type QueryDescriptor<I, O> = ContractIdentity & {
  kind: "query";
  input: z.ZodType<I>;
  output: z.ZodType<O>;
  pagination: "cursor" | "page" | "none";
  maxCardinality: number;
  costClass: "low" | "medium" | "high";
  /** Explicit server-only opt-in for atomic owner snapshots, not command execution. */
  transaction?: "required";
  /** Current owning-domain coverage for retained field migration settlement.
   * Separate from sealed preparation contracts; grants no native/value writes. */
  fieldSettlement?: { entityId: string; sourceVersions: readonly number[]; targetVersions: readonly number[]; referenceVersions: readonly number[] };
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
  authoriseRecord?: (ctx: RecordContext, request: unknown) => Promise<RecordAnchor>;
};
export type StudioModuleContract = { contributions: readonly Contribution[] };
export type ContractReference = { id: string; version: number; schemaHash: string; contractHash: string };
