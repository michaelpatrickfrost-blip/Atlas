import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { checksum } from "./contracts";
import type { ContractMetadata, ContractReference, Contribution, RecordAnchor, RecordContext, StudioModuleContract } from "./types";
import { entityDetailsSchema, fieldSettlementPolicySchema, recordAnchorSchema, recordRequestSchema } from "./entities";

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
  private readonly items = new Map<string, { metadata: ContractMetadata; run?: Contribution["run"]; authoriseRecord?: Contribution["authoriseRecord"]; authoriseInitialRecord?: Contribution["authoriseInitialRecord"] }>();
  constructor(private readonly available: ModuleAvailability) {}

  register(ownerModuleId: string, bundle: StudioModuleContract): void {
    if (!/^[a-z][a-z0-9_]*$/.test(ownerModuleId)) throw new Error("Invalid Studio contract owner.");
    // Validate an entire bundle before adding anything; duplicate failures are atomic.
    const additions = new Map<string, { metadata: ContractMetadata; run?: Contribution["run"]; authoriseRecord?: Contribution["authoriseRecord"]; authoriseInitialRecord?: Contribution["authoriseInitialRecord"] }>();
    for (const item of bundle.contributions) {
      const m = identity.parse(item.metadata);
      if (!m.id.startsWith(`${ownerModuleId}.`)) throw new Error("Studio identifier must belong to its owner.");
      if (m.lifecycle === "deprecated" && !m.supportedUntil) throw new Error("Deprecated contracts need a support window.");
      if (["query", "command"].includes(m.kind) !== Boolean(item.run)) throw new Error("Invalid Studio executable contract.");
      if (m.kind === "entity") {
        const details = entityDetailsSchema.parse(item.metadata.details);
        if (checksum(details) !== m.schemaHash) throw new Error("Invalid Studio entity schema hash.");
        if (Boolean(details.record) !== Boolean(item.authoriseRecord)) throw new Error("Missing Studio owner record authorisation.");
        if (Boolean(details.record?.initialisation) !== Boolean(item.authoriseInitialRecord)) throw new Error("Missing owner new-record initialisation proof policy.");
      } else if (item.authoriseRecord || item.authoriseInitialRecord) throw new Error("Only entities can authorise records.");
      const key = `${m.id}@${m.version}`;
      if (this.items.has(key) || additions.has(key)) throw new Error(`Duplicate Studio contract: ${key}`);
      const snapshot = JSON.parse(JSON.stringify({ ...item.metadata, ownerModuleId })) as Omit<ContractMetadata, "contractHash">;
      const contract = Object.fromEntries(Object.entries(snapshot).filter(([key]) => key !== "label"));
      const metadata = freezeJson({ ...snapshot, contractHash: checksum(contract) });
      additions.set(key, { metadata, run: item.run, authoriseRecord: item.authoriseRecord, authoriseInitialRecord: item.authoriseInitialRecord });
    }
    for (const { metadata: m } of additions.values()) {
      if (m.details.fieldSettlement !== undefined) {
        const policy = fieldSettlementPolicySchema.parse(m.details.fieldSettlement);
        if (m.kind !== "query" || m.details.transaction !== "required") throw new Error("Field settlement requires a transactional owner query.");
        for (const version of [...new Set([...policy.sourceVersions, ...policy.targetVersions, ...policy.referenceVersions])]) {
          const source = additions.get(`${policy.entityId}@${version}`) ?? this.items.get(`${policy.entityId}@${version}`);
          const record = source?.metadata.kind === "entity" ? entityDetailsSchema.parse(source.metadata.details).record : undefined;
          if (!source || source.metadata.ownerModuleId !== ownerModuleId || !record || record.writeCapability !== m.capability
            || ([...policy.sourceVersions, ...policy.targetVersions].includes(version) && !record.fieldPolicy))
            throw new Error("Field settlement must declare registered native entity versions from the same owner and write capability.");
        }
        for (const item of [...this.items.values(), ...additions.values()]) {
          const other = item.metadata.details.fieldSettlement;
          if (other !== undefined && fieldSettlementPolicySchema.parse(other).entityId === policy.entityId && item.metadata.id !== m.id)
            throw new Error("One owning-domain field settlement policy identifier is allowed per entity.");
        }
      }
      if (m.kind !== "entity") continue;
      const { record } = entityDetailsSchema.parse(m.details);
      if (!record) continue;
      if (record.initialisation?.acceptedFieldVersions) {
        for (const version of record.initialisation.acceptedFieldVersions) {
          const source = additions.get(`${m.id}@${version}`) ?? this.items.get(`${m.id}@${version}`);
          if (!source || source.metadata.kind !== "entity" || source.metadata.ownerModuleId !== ownerModuleId
            || !entityDetailsSchema.parse(source.metadata.details).record?.fieldPolicy)
            throw new Error("Current initialisation must cover registered typed-field owner versions.");
        }
      }
      for (const ref of [record.listQuery, record.getQuery]) {
        const target = additions.get(`${ref.id}@${ref.version}`) ?? this.items.get(`${ref.id}@${ref.version}`);
        if (!target || target.metadata.kind !== "query" || target.metadata.ownerModuleId !== ownerModuleId || target.metadata.capability !== m.capability) throw new Error("Entity projections must reference registered owner queries with the same read capability.");
      }
      if (record.requiredFacts) {
        const ref = record.requiredFacts.query;
        const target = additions.get(`${ref.id}@${ref.version}`) ?? this.items.get(`${ref.id}@${ref.version}`);
        if (!target || target.metadata.kind !== "query" || target.metadata.ownerModuleId !== ownerModuleId
          || target.metadata.capability !== m.capability || target.metadata.details.transaction !== "required")
          throw new Error("Required facts need a registered transactional owner query with the same native read capability.");
        if (record.requiredFacts.initialQuery) {
          const ref = record.requiredFacts.initialQuery;
          const initial = additions.get(`${ref.id}@${ref.version}`) ?? this.items.get(`${ref.id}@${ref.version}`);
          if (!record.initialisation || !initial || initial.metadata.kind !== "query" || initial.metadata.ownerModuleId !== ownerModuleId
            || initial.metadata.capability !== record.initialisation.capability || initial.metadata.details.transaction !== "required")
            throw new Error("Creation facts need a registered transactional owner query with creation capability.");
        }
      }
      if (record.migrationSnapshot) {
        const { query: ref, sourceVersions, referenceVersions } = record.migrationSnapshot;
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
        if (referenceVersions) {
          if (!record.fieldPolicy?.referenceEntities.includes(m.id))
            throw new Error("Reference coverage must opt into this canonical entity's reference field policy.");
          for (const version of referenceVersions) {
            const reference = additions.get(`${m.id}@${version}`) ?? this.items.get(`${m.id}@${version}`);
            if (!reference || reference.metadata.kind !== "entity" || reference.metadata.ownerModuleId !== ownerModuleId
              || !entityDetailsSchema.parse(reference.metadata.details).record)
              throw new Error("Reference coverage must declare registered native read versions of the same owner entity.");
          }
        }
      }
      if (record.migrationRepresentation) {
        const ref = record.migrationRepresentation.query;
        const target = additions.get(`${ref.id}@${ref.version}`) ?? this.items.get(`${ref.id}@${ref.version}`);
        if (!target || target.metadata.kind !== "query" || target.metadata.ownerModuleId !== ownerModuleId
          || target.metadata.capability !== record.writeCapability || target.metadata.details.transaction !== "required")
          throw new Error("Representation approval requires a registered transactional owner query with native write capability.");
      }
    }
    for (const [key, item] of additions) this.items.set(key, item);
  }
  describe(id: string, version: number): ContractMetadata {
    const item = this.items.get(`${id}@${version}`);
    if (!item) throw new Error(`DEPENDENCY_BROKEN: missing Studio contract ${id}@${version}`);
    return item.metadata;
  }
  private async allowed(session: Session, m: ContractMetadata, capability = m.capability): Promise<void> {
    assertCapability(session, capability);
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
  /** Metadata only for an explicit native creation path. It grants no record read,
   * existing extension editing, query or command invocation. */
  async resolveForRecordInitialisation(session: Session, reference: ContractReference): Promise<ContractMetadata> {
    const m = this.describe(reference.id, reference.version);
    const record = m.kind === "entity" ? entityDetailsSchema.parse(m.details).record : undefined;
    if (!record?.initialisation) throw new Error("This owner has no new-record initialisation policy.");
    await this.allowed(session, m, record.initialisation.capability);
    if (reference.schemaHash !== m.schemaHash || reference.contractHash !== m.contractHash) throw new Error("DEPENDENCY_BROKEN: owner initialisation contract changed.");
    return m;
  }
  /** Internal same-transaction opaque owner proof, never client FormData/JSON. */
  async authoriseRecordInitialisation(context: RecordContext, reference: ContractReference, proof: object): Promise<RecordAnchor> {
    if (!context.transaction) throw new Error("Initialisation requires the owning transaction.");
    const m = await this.resolveForRecordInitialisation(context.session, reference);
    const authorise = this.items.get(`${m.id}@${m.version}`)!.authoriseInitialRecord;
    if (!authorise) throw new Error("Owner initialisation proof is unavailable.");
    const anchor = recordAnchorSchema.parse(await authorise(context, proof));
    if (anchor.organisationId !== context.session.organisationId) throw new Error("Owner returned invalid new-record scope.");
    return anchor;
  }
  /** Latest explicit owner policy for a legacy field schema, never an implicit
   * read/manage grant or fallback to an older unsupported coverage policy. */
  async resolveCurrentFieldInitialisation(session: Session, reference: ContractReference) {
    const source = this.describe(reference.id, reference.version);
    if (source.kind !== "entity" || source.schemaHash !== reference.schemaHash || source.contractHash !== reference.contractHash
      || !entityDetailsSchema.parse(source.details).record?.fieldPolicy) throw new Error("DEPENDENCY_BROKEN: field initialisation source changed.");
    const owner = [...this.items.values()].map(item => item.metadata).filter(m => m.kind === "entity" && m.id === source.id && m.ownerModuleId === source.ownerModuleId)
      .sort((a, b) => b.version - a.version)[0];
    const policy = owner && entityDetailsSchema.parse(owner.details).record?.initialisation;
    if (!policy?.acceptedFieldVersions?.includes(source.version)) throw new Error("DEPENDENCY_BROKEN: current owner does not approve this field's creation version.");
    await this.allowed(session, owner, policy.capability);
    await this.allowed(session, source, policy.capability);
    return { source, owner };
  }
  async authoriseCurrentFieldInitialisation(context: RecordContext, reference: ContractReference, proof: object) {
    if (!context.transaction) throw new Error("Initialisation requires the owning transaction.");
    const { owner } = await this.resolveCurrentFieldInitialisation(context.session, reference);
    return this.authoriseRecordInitialisation(context, owner, proof);
  }
  /** Proof is carried only in the internal execution context, never JSON input.
   * Generic query invocation cannot supply it. The owner rechecks exact created
   * record/revision scope inside its callback before projecting native facts. */
  async invokeInitialRecordFacts(context: RecordContext, reference: ContractReference, proof: object) {
    const { owner } = await this.resolveCurrentFieldInitialisation(context.session, reference);
    const anchor = await this.authoriseRecordInitialisation(context, owner, proof);
    const policy = entityDetailsSchema.parse(owner.details).record?.requiredFacts?.initialQuery;
    if (!policy) throw new Error("DEPENDENCY_BROKEN: current owner has no creation fact query.");
    const query = this.describe(policy.id, policy.version);
    await this.resolve(context.session, query);
    const run = this.items.get(`${query.id}@${query.version}`)!.run;
    if (!context.transaction || !run || query.kind !== "query" || query.details.transaction !== "required") throw new Error("Creation facts need the owning transaction.");
    return run({ session: context.session, transaction: context.transaction, initialisationProof: proof }, { recordId: anchor.recordId, expectedRevision: anchor.revision });
  }
  /** Current registered owner policy only. Unsupported latest versions fail
   * closed rather than falling back to an older policy. No client query choice. */
  async resolveFieldSettlement(session: Session, source: ContractReference, target: ContractReference): Promise<ContractMetadata> {
    const a = await this.resolve(session, source), b = await this.resolve(session, target);
    if (a.kind !== "entity" || b.kind !== "entity" || a.id !== b.id || a.ownerModuleId !== b.ownerModuleId)
      throw new Error("DEPENDENCY_BROKEN: canonical field settlement owner is unavailable.");
    const candidates = [...this.items.values()].map(item => item.metadata).filter(m => m.kind === "query" && m.ownerModuleId === a.ownerModuleId
      && m.details.fieldSettlement !== undefined && fieldSettlementPolicySchema.parse(m.details.fieldSettlement).entityId === a.id).sort((x, y) => y.version - x.version);
    const policy = candidates[0], details = policy && fieldSettlementPolicySchema.parse(policy.details.fieldSettlement);
    if (!policy || !details || !details.sourceVersions.includes(source.version) || !details.targetVersions.includes(target.version))
      throw new Error("DEPENDENCY_BROKEN: field settlement needs current owning-domain coverage.");
    await this.allowed(session, policy);
    return policy;
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
