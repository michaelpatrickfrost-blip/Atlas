import { z } from "zod";
import { sessionAuthorityStamp } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from "../fields/runtime-authority";
import { STUDIO_CAPABILITIES } from "../permissions";
import { checksum } from "../registry/contracts";
import { loadSealedConfigurationVersion } from "../configuration/pins";
import { compileRetainedStructuredPage, compileStructuredPage } from "../pages/definition-compiler";
import { createDesignPageDisplayModel } from "../pages/design-model";
import { formFactorSchema, pagePayloadSchema, type PagePayload } from "../pages/schema";
import { pageEditorCatalogInTransaction } from "./catalog";
import type { ReferenceNavigationContext } from "./reference-links";
import type { PageDraftPresentation, PageDraftComparisonPresentation } from "./page-draft-presentation";

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

const currentDraftRequest = z.strictObject({ definitionId: z.uuid(), revision: z.number().int().nonnegative().max(2147483646),
  definitionRevision: z.number().int().nonnegative().max(2147483646), payload: pagePayloadSchema, formFactor: formFactorSchema });
const observedRevision = z.number().int().nonnegative().max(2147483646);
function comparisonConflict(): never { throw new Error("CONFLICT: this screen's app or saved identity changed. Reopen its current draft before comparing. Your changes are kept."); }

/** Human structural differences only. Both inputs are compiled under current
 * rights before this runs. Stable IDs associate nodes but never appear as labels;
 * this neither merges layouts nor produces a publication approval. */
function draftChanges(local: PagePayload, saved: PagePayload): string[] {
  const changes: string[] = [], add = (text: string) => { if (changes.length < 100) changes.push(text); };
  if (checksum(local.formFactors) !== checksum(saved.formFactors)) add("Your changes use different preview sizes.");
  const named = (label: string | undefined, fallback: string) => `“${label || fallback}”`;
  const sectionIds = (page: PagePayload) => page.sections.map(section => section.id);
  if (checksum(sectionIds(local)) !== checksum(sectionIds(saved))) add("The sections are added, removed or arranged differently.");
  for (const section of local.sections) {
    const previous = saved.sections.find(value => value.id === section.id);
    if (!previous) { add(`Your changes add section ${named(section.label, "Section")}.`); continue; }
    const { components: localItems, ...localProperties } = section, { components: savedItems, ...savedProperties } = previous;
    if (checksum(localProperties) !== checksum(savedProperties)) add(`Section ${named(section.label, "Section")} has different headings, layout or visibility settings.`);
    if (checksum(localItems.map(item => item.id)) !== checksum(savedItems.map(item => item.id))) add(`Section ${named(section.label, "Section")} has a different arrangement of items.`);
    for (const component of localItems) {
      const retained = savedItems.find(value => value.id === component.id);
      const item = named(component.label, component.type === "fields" ? "Details" : component.type === "queryList" ? "Records table"
        : component.type === "action" ? "Button" : component.type === "analyticsView" ? "Dashboard" : "Screen item");
      if (!retained) add(`Your changes add ${item} to ${named(section.label, "Section")}.`);
      else if (checksum(component) !== checksum(retained)) add(`${item} has different content or settings in your changes.`);
    }
    for (const component of savedItems) if (!localItems.some(value => value.id === component.id)) add(`Your changes remove an item from ${named(previous.label, "Section")}.`);
  }
  for (const section of saved.sections) if (!local.sections.some(value => value.id === section.id)) add(`Your changes remove section ${named(section.label, "Section")}.`);
  if (checksum(local.variants) !== checksum(saved.variants)) add("The conditional layouts have different rules or settings.");
  if (changes.length === 100) changes.push("Additional differences may exist. Review both complete layouts before choosing what to keep.");
  return changes;
}

/** Save-conflict recovery is a read of the actual current draft, not a CAS
 * override. Client revisions are observations: an older observation may compare,
 * a fabricated future observation or changed exact owner pin must reopen. Both
 * saved/local metadata pass the original compiler/current grants before labels.
 * No business providers, validation writes, Audit, save, merge or activation. */
export async function compareCurrentPageDraftInTransaction(supplied: FieldRuntimeAuthority, input: unknown,
  navigation: ReferenceNavigationContext = {}) {
  if (!sessionAuthorityStamp(supplied.session) || sessionAuthorityStamp(supplied.session) !== supplied.stamp)
    throw new Error("FORBIDDEN: current business design access is required.");
  const authority = await fieldRuntimeAuthorityInTransaction(supplied.session, supplied.transaction);
  assertCapability(authority.session, STUDIO_CAPABILITIES.read);
  const value = currentDraftRequest.parse(input), tx = authority.transaction;
  const draft = await tx.studioDraft.findFirst({ where: { definitionId: value.definitionId,
    organisationId: authority.session.organisationId, definition: { kind: "page", retiredAt: null } },
    select: { id: true, definitionId: true, organisationId: true, revision: true, payload: true,
      definition: { select: { id: true, organisationId: true, kind: true, retiredAt: true, revision: true, activeVersionId: true } } } });
  if (!draft || draft.definitionId !== value.definitionId || draft.organisationId !== authority.session.organisationId
    || draft.definition.id !== value.definitionId || draft.definition.organisationId !== authority.session.organisationId
    || draft.definition.kind !== "page" || draft.definition.retiredAt !== null) comparisonConflict();
  const revision = observedRevision.parse(draft.revision), definitionRevision = observedRevision.parse(draft.definition.revision);
  const activeVersionId = z.uuid().nullable().parse(draft.definition.activeVersionId);
  if (value.revision > revision || value.definitionRevision > definitionRevision) comparisonConflict();
  const currentPayload = pagePayloadSchema.parse(draft.payload);
  if (checksum(currentPayload.entity) !== checksum(value.payload.entity)) comparisonConflict();
  const saved = await compileStructuredPage(authority, currentPayload), local = await compileStructuredPage(authority, value.payload);
  if (!saved.payload.formFactors.includes(value.formFactor) || !local.payload.formFactors.includes(value.formFactor))
    throw new Error("Choose a preview size supported by both designs.");
  // Independent catalogues retain each design's exact field/View pins while
  // offering fresh authorised active choices. Never merge differing versions by
  // logical definition ID or return an opening catalogue's stale private labels.
  const savedChoices = await pageEditorCatalogInTransaction(authority, saved.payload, navigation);
  const localChoices = await pageEditorCatalogInTransaction(authority, local.payload, navigation);
  const presentation = (choices: typeof savedChoices): PageDraftPresentation => ({ catalog: choices.catalog,
    fields: choices.fields, palette: choices.palette, conditions: choices.conditions });
  const presentations: PageDraftComparisonPresentation = { saved: presentation(savedChoices), local: presentation(localChoices) };
  return { revision, definitionRevision, activeVersionId, payload: saved.payload, presentation: presentations,
    model: createDesignPageDisplayModel(saved.payload, savedChoices.catalog, value.formFactor),
    changes: draftChanges(local.payload, saved.payload), warnings: [...new Set([...saved.warnings, ...local.warnings])] };
}
