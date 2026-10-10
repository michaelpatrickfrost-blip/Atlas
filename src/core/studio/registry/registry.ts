import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { checksum } from "./contracts";
import type { ContractMetadata, ContractReference, Contribution, RecordAnchor, RecordContext, StudioModuleContract } from "./types";
import { entityDetailsSchema, recordAnchorSchema, recordRequestSchema } from "./entities";

const logicalId = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;
const identity = z.object({ id: z.string().regex(logicalId), version: z.number().int().positive(),
  label: z.string().min(1).max(200), capability: z.string().regex(logicalId),
  lifecycle: z.enum(["active", "deprecated"]), supportedUntil: z.iso.datetime().optional(),
  classification: z.enum(["public_internal", "confidential", "restricted"]),
  kind: z.enum(["entity", "query", "command", "event", "surface", "decisionFact", "template", "metric", "integration"]),
  schemaHash: z.string().regex(/^[a-f0-9]{64}$/),
}).loose();
function freezeJson<T>(value: T): T {
  if (value && typeof value === "object") { Object.values(value).forEach(freezeJson); Object.freeze(value); }
  return value;
}
export type ModuleAvailability = (session: Session, ownerModuleId: string) => Promise<boolean>;
export class CapabilityRegistry {
  private readonly items = new Map<string, { metadata: ContractMetadata; run?: Contribution["run"]; authoriseRecord?: Contribution["authoriseRecord"] }>();
  constructor(private readonly available: ModuleAvailability) {}

  register(ownerModuleId: string, bundle: StudioModuleContract): void {
    if (!/^[a-z][a-z0-9_]*$/.test(ownerModuleId)) throw new Error("Invalid Studio contract owner.");
    // Validate an entire bundle before adding anything; duplicate failures are atomic.
    const additions = new Map<string, { metadata: ContractMetadata; run?: Contribution["run"]; authoriseRecord?: Contribution["authoriseRecord"] }>();
    for (const item of bundle.contributions) {
      const m = identity.parse(item.metadata);
      if (!m.id.startsWith(`${ownerModuleId}.`)) throw new Error("Studio identifier must belong to its owner.");
      if (m.lifecycle === "deprecated" && !m.supportedUntil) throw new Error("Deprecated contracts need a support window.");
      if (["query", "command"].includes(m.kind) !== Boolean(item.run)) throw new Error("Invalid Studio executable contract.");
      if (m.kind === "entity") {
        const details = entityDetailsSchema.parse(item.metadata.details);
        if (checksum(details) !== m.schemaHash) throw new Error("Invalid Studio entity schema hash.");
        if (Boolean(details.record) !== Boolean(item.authoriseRecord)) throw new Error("Missing Studio owner record authorisation.");
      } else if (item.authoriseRecord) throw new Error("Only entities can authorise records.");
      const key = `${m.id}@${m.version}`;
      if (this.items.has(key) || additions.has(key)) throw new Error(`Duplicate Studio contract: ${key}`);
      const snapshot = JSON.parse(JSON.stringify({ ...item.metadata, ownerModuleId })) as Omit<ContractMetadata, "contractHash">;
      const contract = Object.fromEntries(Object.entries(snapshot).filter(([key]) => key !== "label"));
      const metadata = freezeJson({ ...snapshot, contractHash: checksum(contract) });
      additions.set(key, { metadata, run: item.run, authoriseRecord: item.authoriseRecord });
    }
    for (const { metadata: m } of additions.values()) {
      if (m.kind !== "entity") continue;
      const { record } = entityDetailsSchema.parse(m.details);
      if (!record) continue;
      for (const ref of [record.listQuery, record.getQuery]) {
        const target = additions.get(`${ref.id}@${ref.version}`) ?? this.items.get(`${ref.id}@${ref.version}`);
        if (!target || target.metadata.kind !== "query" || target.metadata.ownerModuleId !== ownerModuleId || target.metadata.capability !== m.capability) throw new Error("Entity projections must reference registered owner queries with the same read capability.");
      }
      if (record.migrationSnapshot) {
        const { query: ref, sourceVersions } = record.migrationSnapshot;
        const target = additions.get(`${ref.id}@${ref.version}`) ?? this.items.get(`${ref.id}@${ref.version}`);
        if (!target || target.metadata.kind !== "query" || target.metadata.ownerModuleId !== ownerModuleId
          || target.metadata.capability !== record.writeCapability || target.metadata.details.transaction !== "required")
          throw new Error("Migration snapshots require a registered transactional owner query with native write capability.");
        for (const version of sourceVersions) {
          const source = additions.get(`${m.id}@${version}`) ?? this.items.get(`${m.id}@${version}`);
          if (!source || source.metadata.kind !== "entity" || source.metadata.ownerModuleId !== ownerModuleId
            || !entityDetailsSchema.parse(source.metadata.details).record?.fieldPolicy)
            throw new Error("Migration snapshots must declare approved typed-field source entity versions.");
        }
      }
    }
    for (const [key, item] of additions) this.items.set(key, item);
  }
  describe(id: string, version: number): ContractMetadata {
    const item = this.items.get(`${id}@${version}`);
    if (!item) throw new Error(`DEPENDENCY_BROKEN: missing Studio contract ${id}@${version}`);
    return item.metadata;
  }
  private async allowed(session: Session, m: ContractMetadata): Promise<void> {
    assertCapability(session, m.capability);
    if (!await this.available(session, m.ownerModuleId)) throw new Error(`DEPENDENCY_BROKEN: module ${m.ownerModuleId} unavailable`);
    if (m.lifecycle === "deprecated" && Date.parse(m.supportedUntil!) <= Date.now()) throw new Error("DEPENDENCY_BROKEN: contract support window expired");
  }
  async discover(session: Session): Promise<readonly ContractMetadata[]> {
    const result: ContractMetadata[] = [];
    for (const { metadata: m } of this.items.values()) {
      if (!can(session, m.capability)) continue;
      try { await this.allowed(session, m); result.push(m); } catch { /* unavailable owners do not expose data */ }
    }
    return result;
  }
  async resolve(session: Session, reference: ContractReference): Promise<ContractMetadata> {
    const m = this.describe(reference.id, reference.version);
    await this.allowed(session, m);
    if (reference.schemaHash !== m.schemaHash || reference.contractHash !== m.contractHash) throw new Error("DEPENDENCY_BROKEN: Studio contract changed; republish or restore compatibility");
    return m;
  }
  async invoke(session: Session, reference: ContractReference, input: unknown, idempotencyKey?: string): Promise<unknown> {
    const m = await this.resolve(session, reference);
    const run = this.items.get(`${m.id}@${m.version}`)!.run;
    if (!run) throw new Error("This Studio contract is descriptive, not executable.");
    if (m.kind === "query" && m.details.transaction === "required") throw new Error("This owner query requires a shared server transaction.");
    if (m.kind === "command" && m.details.idempotency === "required" && !idempotencyKey?.trim()) throw new Error("This command requires an idempotency key.");
    return run({ session, idempotencyKey }, input);
  }
  /** Server-owned transaction only; old queries and commands do not implicitly opt in. */
  async invokeQueryInTransaction(context: RecordContext, reference: ContractReference, input: unknown): Promise<unknown> {
    const m = await this.resolve(context.session, reference);
    if (!context.transaction || m.kind !== "query" || m.details.transaction !== "required")
      throw new Error("Only an opted-in owner query may use a shared server transaction.");
    const run = this.items.get(`${m.id}@${m.version}`)!.run;
    if (!run) throw new Error("This Studio query is unavailable.");
    return run({ session: context.session, transaction: context.transaction }, input);
  }
  /** Owner access only. This does not update native fields or execute a domain command. */
  async authoriseRecord(context: RecordContext, reference: ContractReference, input: unknown): Promise<RecordAnchor> {
    const m = await this.resolve(context.session, reference);
    if (m.kind !== "entity") throw new Error("Record authorisation requires an entity contract.");
    const { record } = entityDetailsSchema.parse(m.details);
    const authorise = this.items.get(`${m.id}@${m.version}`)!.authoriseRecord;
    if (!record || !authorise) throw new Error("This entity has no approved record policy.");
    const request = recordRequestSchema.parse(input);
    if (request.intent === "extend") {
      if (!context.transaction) throw new Error("Extension authorisation requires an atomic transaction.");
      assertCapability(context.session, record.writeCapability);
    }
    const anchor = recordAnchorSchema.parse(await authorise(context, request));
    if (anchor.recordId !== request.recordId || anchor.organisationId !== context.session.organisationId) throw new Error("Owner returned an invalid canonical record scope.");
    if (request.expectedRevision !== undefined && anchor.revision !== request.expectedRevision) throw new Error("This record changed. Refresh before saving.");
    return anchor;
  }
  checkCompatibility(references: readonly ContractReference[]): string[] {
    return references.flatMap(ref => {
      try {
        const m = this.describe(ref.id, ref.version);
        return m.schemaHash === ref.schemaHash && m.contractHash === ref.contractHash ? [] : [`Changed contract ${ref.id}@${ref.version}`];
      } catch { return [`Missing contract ${ref.id}@${ref.version}`]; }
    });
  }
}
