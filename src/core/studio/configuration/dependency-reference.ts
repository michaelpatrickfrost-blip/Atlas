import { z } from "zod";
import { configurationReferenceSchema } from "../record-types/schema";
import { viewVersionReferenceSchema } from "../views/schema";

/** Impact/publication graph only. Profile eligibility and its transport retain
 * their original closed reference grammar; a View is not a record-type overlay. */
export const configurationDependencyReferenceSchema = z.union([configurationReferenceSchema, viewVersionReferenceSchema]);
export type ConfigurationDependencyReference = z.infer<typeof configurationDependencyReferenceSchema>;
/** Exact repeated pins share an edge. Competing versions/kinds/seals, UUID reuse
 * and self-reference remain failures, with the original202 edge/depth budgets. */
export function normaliseConfigurationDependencyReferences(input: readonly unknown[], ownDefinitionId?: string): ConfigurationDependencyReference[] {
  if (input.length > 202) throw new Error("Too many configuration dependencies.");
  const own = ownDefinitionId === undefined ? undefined : z.uuid().parse(ownDefinitionId).toLowerCase();
  const definitions = new Map<string, ConfigurationDependencyReference>(), versions = new Map<string, ConfigurationDependencyReference>();
  const same = (left: ConfigurationDependencyReference, right: ConfigurationDependencyReference) => left.kind === right.kind
    && left.definitionId === right.definitionId && left.versionId === right.versionId && left.schemaVersion === right.schemaVersion && left.checksum === right.checksum;
  for (const inputRef of input) {
    const pin = configurationDependencyReferenceSchema.parse(inputRef);
    if (pin.definitionId === own) throw new Error("Configuration dependency cycle.");
    const prior = definitions.get(pin.definitionId), version = versions.get(pin.versionId);
    if ((prior && !same(prior, pin)) || (version && !same(version, pin))) throw new Error("Conflicting configuration reference.");
    definitions.set(pin.definitionId, pin); versions.set(pin.versionId, pin);
  }
  return [...definitions.values()].sort((a, b) => a.definitionId < b.definitionId ? -1 : a.definitionId > b.definitionId ? 1 : 0);
}
