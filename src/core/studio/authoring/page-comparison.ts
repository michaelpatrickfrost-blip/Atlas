import { z } from "zod";
import { sessionAuthorityStamp } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import type { FieldRuntimeAuthority } from "../fields/runtime-authority";
import { STUDIO_CAPABILITIES } from "../permissions";
import { checksum } from "../registry/contracts";
import { loadSealedConfigurationVersion } from "../configuration/pins";
import { compileRetainedStructuredPage } from "../pages/definition-compiler";
import { createDesignPageDisplayModel } from "../pages/design-model";
import { formFactorSchema } from "../pages/schema";
import { pageEditorCatalogInTransaction } from "./catalog";

const request = z.strictObject({ definitionId: z.uuid(), versionId: z.uuid(),
  definitionRevision: z.number().int().nonnegative().max(2147483646), formFactor: formFactorSchema });
/** Authorised labelled samples only. No business queries, draft writes,
 * activation, mutation callbacks or publication approval are returned. */
export async function comparePageVersionInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  if (!sessionAuthorityStamp(authority.session) || sessionAuthorityStamp(authority.session) !== authority.stamp)
    throw new Error("FORBIDDEN: current business design access is required.");
  assertCapability(authority.session, STUDIO_CAPABILITIES.read);
  const value = request.parse(input), tx = authority.transaction;
  const definition = await tx.studioDefinition.findFirst({ where: { id: value.definitionId,
    organisationId: authority.session.organisationId, kind: "page", retiredAt: null, revision: value.definitionRevision }, select: { id: true } });
  if (!definition) throw new Error("CONFLICT: this screen changed. Refresh its published designs before comparing.");
  const row = await tx.studioDefinitionVersion.findFirst({ where: { id: value.versionId, definitionId: definition.id,
    organisationId: authority.session.organisationId }, select: { id: true, version: true, schemaVersion: true, checksum: true } });
  if (!row) throw new Error("This published design is unavailable.");
  const version = await loadSealedConfigurationVersion(authority.session, tx, { kind: "page", definitionId: definition.id,
    versionId: row.id, schemaVersion: row.schemaVersion, checksum: row.checksum });
  const compiled = await compileRetainedStructuredPage(authority, version);
  if (compiled.checksum !== version.checksum || checksum(version.compiledPlan) !== compiled.checksum)
    throw new Error("DEPENDENCY_BROKEN: this previous design needs a fresh review.");
  if (!compiled.payload.formFactors.includes(value.formFactor)) throw new Error("This previous design does not support this preview size.");
  const choices = await pageEditorCatalogInTransaction(authority, compiled.payload);
  return { versionId: row.id, definitionRevision: value.definitionRevision, label: `Version ${row.version}`,
    model: createDesignPageDisplayModel(compiled.payload, choices.catalog, value.formFactor) };
}
