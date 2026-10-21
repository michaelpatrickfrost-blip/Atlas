import type { z } from "zod";
import { referenceSchema } from "../compiler/reference";
import {
  configurationReferenceSchema, entityProfilePayloadSchema, entityProfileSchema, entityProfileVersionSchema,
  recordTypePayloadSchema, recordTypeVersionSchema,
  type ConfigurationReference, type EntityProfile, type EntityProfilePayload,
  type RecordTypePayload,
} from "./schema";

export type ResolvedEntityProfile = {
  entity: z.infer<typeof referenceSchema>;
  profile: EntityProfile;
  configurationDependencies: ConfigurationReference[];
  registryDependencies: z.infer<typeof referenceSchema>[];
};

const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const samePin = (left: ConfigurationReference, right: ConfigurationReference) =>
  left.kind === right.kind && left.definitionId === right.definitionId &&
  left.versionId === right.versionId && left.schemaVersion === right.schemaVersion && left.checksum === right.checksum;
const sameEntity = (left: EntityProfilePayload["entity"], right: EntityProfilePayload["entity"]) =>
  left.id === right.id && left.version === right.version && left.schemaHash === right.schemaHash && left.contractHash === right.contractHash;

function uniqueSelections(profile: EntityProfile | RecordTypePayload["overlay"]) {
  for (const selections of [profile.requiredFields, profile.allowedProcesses]) {
    if (selections && new Set(selections.map(ref => ref.definitionId)).size !== selections.length)
      throw new Error("Duplicate configuration selection.");
  }
  if (profile.defaultDecisions && new Set(profile.defaultDecisions.map(selection => selection.key)).size !== profile.defaultDecisions.length)
    throw new Error("Duplicate default decision key.");
}

function references(profile: EntityProfile): ConfigurationReference[] {
  return [
    ...(profile.page ? [profile.page] : []), ...profile.requiredFields,
    ...profile.allowedProcesses, ...profile.defaultDecisions.map(selection => selection.decision),
  ];
}

/** One exact version per definition in a resolved profile. Exact repeated pins
 * (e.g. one decision reused by two named defaults) share a dependency. Conflicting
 * pins or a reused version UUID under a different identity fail closed. */
export function normaliseConfigurationReferences(input: readonly unknown[], ownDefinitionId?: string): ConfigurationReference[] {
  if (input.length > 202) throw new Error("Too many configuration dependencies.");
  const byDefinition = new Map<string, ConfigurationReference>();
  const byVersion = new Map<string, ConfigurationReference>();
  const own = ownDefinitionId === undefined ? undefined : entityProfileVersionSchema.shape.reference.shape.definitionId.parse(ownDefinitionId);
  for (const value of input) {
    const ref = configurationReferenceSchema.parse(value);
    if (own === ref.definitionId) throw new Error("Configuration dependency cycle.");
    const prior = byDefinition.get(ref.definitionId), version = byVersion.get(ref.versionId);
    if ((prior && !samePin(prior, ref)) || (version && !samePin(version, ref)))
      throw new Error("Conflicting configuration reference.");
    byDefinition.set(ref.definitionId, ref);
    byVersion.set(ref.versionId, ref);
  }
  return [...byDefinition.values()].sort((left, right) => compare(left.definitionId, right.definitionId));
}

function materialise(base: EntityProfilePayload, overlay?: RecordTypePayload): ResolvedEntityProfile {
  uniqueSelections(base.profile);
  normaliseConfigurationReferences(references(base.profile));
  if (overlay) {
    if (!sameEntity(base.entity, overlay.entity)) throw new Error("Record type must use the exact base entity contract.");
    uniqueSelections(overlay.overlay);
    normaliseConfigurationReferences(references({
      page: overlay.overlay.page ?? null,
      requiredFields: overlay.overlay.requiredFields ?? [],
      allowedProcesses: overlay.overlay.allowedProcesses ?? [],
      defaultDecisions: overlay.overlay.defaultDecisions ?? [],
    }));
  }
  const patch = overlay?.overlay;
  const requiredFields = normaliseConfigurationReferences([
    ...base.profile.requiredFields, ...(patch?.requiredFields ?? []),
  ]).map(ref => {
    if (ref.kind !== "customField") throw new Error("Required fields must reference custom fields.");
    return ref;
  });
  const profile = entityProfileSchema.parse({
    page: patch?.page === undefined ? base.profile.page : patch.page,
    requiredFields,
    allowedProcesses: [...(patch?.allowedProcesses ?? base.profile.allowedProcesses)]
      .sort((left, right) => compare(left.definitionId, right.definitionId)),
    defaultDecisions: [...(patch?.defaultDecisions ?? base.profile.defaultDecisions)]
      .sort((left, right) => compare(left.key, right.key)),
  });
  const configurationDependencies = normaliseConfigurationReferences([
    ...(overlay ? [overlay.baseProfile] : []), ...references(profile),
  ]);
  return { entity: base.entity, profile, configurationDependencies, registryDependencies: [base.entity] };
}

/** Draft materialisation only. Server integration must validate the overlay's base
 * pin against a loaded immutable version (use resolveRecordTypeProfile). Arrays
 * deliberately accept zero/one overlay; multiple assignments are ambiguous. */
export function resolveEntityProfile(baseInput: unknown | null, overlayInputs: readonly unknown[] = []): ResolvedEntityProfile | null {
  if (overlayInputs.length > 1) throw new Error("Only one record type overlay is permitted.");
  if (baseInput === null) {
    if (overlayInputs.length) throw new Error("Record type requires a base entity profile.");
    return null;
  }
  return materialise(entityProfilePayloadSchema.parse(baseInput), overlayInputs.length ? recordTypePayloadSchema.parse(overlayInputs[0]) : undefined);
}

/** Publish-time record-type resolution against the exact server-loaded base. Own
 * identity is supplied by the server, never inferred from a client label/key. The
 * result omits the new version's own pin to avoid a recursive plan checksum. */
export function resolveRecordTypeProfile(baseVersionInput: unknown, recordTypeInput: unknown, ownDefinitionId: string): ResolvedEntityProfile {
  const base = entityProfileVersionSchema.parse(baseVersionInput), overlay = recordTypePayloadSchema.parse(recordTypeInput);
  if (!samePin(base.reference, overlay.baseProfile)) throw new Error("Record type base profile version does not match its pin.");
  normaliseConfigurationReferences(references(base.payload.profile), base.reference.definitionId);
  const resolved = materialise(base.payload, overlay);
  normaliseConfigurationReferences(resolved.configurationDependencies, ownDefinitionId);
  return resolved;
}

/** Pure loaded-version validation. Shallow inheritance is structural: base
 * profiles cannot extend profiles and record types cannot extend record types.
 * This does not authenticate a tenant or verify a plan's cryptographic seal. */
export function resolvePinnedEntityProfile(baseVersionInput: unknown | null, overlayVersionInputs: readonly unknown[] = []): ResolvedEntityProfile | null {
  if (overlayVersionInputs.length > 1) throw new Error("Only one record type overlay is permitted.");
  if (baseVersionInput === null) return resolveEntityProfile(null, overlayVersionInputs);
  const base = entityProfileVersionSchema.parse(baseVersionInput);
  if (!overlayVersionInputs.length) {
    const resolved = materialise(base.payload);
    normaliseConfigurationReferences(resolved.configurationDependencies, base.reference.definitionId);
    return resolved;
  }
  const overlay = recordTypeVersionSchema.parse(overlayVersionInputs[0]);
  return resolveRecordTypeProfile(base, overlay.payload, overlay.reference.definitionId);
}
