import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { checksum } from "./contracts";
import type { ContractMetadata, ContractReference, Contribution, StudioModuleContract } from "./types";

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
  private readonly items = new Map<string, { metadata: ContractMetadata; run?: Contribution["run"] }>();
  constructor(private readonly available: ModuleAvailability) {}

  register(ownerModuleId: string, bundle: StudioModuleContract): void {
    if (!/^[a-z][a-z0-9_]*$/.test(ownerModuleId)) throw new Error("Invalid Studio contract owner.");
    // Validate an entire bundle before adding anything; duplicate failures are atomic.
    const additions = new Map<string, { metadata: ContractMetadata; run?: Contribution["run"] }>();
    for (const item of bundle.contributions) {
      const m = identity.parse(item.metadata);
      if (!m.id.startsWith(`${ownerModuleId}.`)) throw new Error("Studio identifier must belong to its owner.");
      if (m.lifecycle === "deprecated" && !m.supportedUntil) throw new Error("Deprecated contracts need a support window.");
      if (["query", "command"].includes(m.kind) !== Boolean(item.run)) throw new Error("Invalid Studio executable contract.");
      const key = `${m.id}@${m.version}`;
      if (this.items.has(key) || additions.has(key)) throw new Error(`Duplicate Studio contract: ${key}`);
      const snapshot = JSON.parse(JSON.stringify({ ...item.metadata, ownerModuleId })) as Omit<ContractMetadata, "contractHash">;
      const contract = Object.fromEntries(Object.entries(snapshot).filter(([key]) => key !== "label"));
      const metadata = freezeJson({ ...snapshot, contractHash: checksum(contract) });
      additions.set(key, { metadata, run: item.run });
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
    if (m.kind === "command" && m.details.idempotency === "required" && !idempotencyKey?.trim()) throw new Error("This command requires an idempotency key.");
    return run({ session, idempotencyKey }, input);
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
