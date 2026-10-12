import { assertCapability } from '@/core/permissions/check';
import { getAnalyticsMetrics } from '@/core/analytics/catalogue';
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from '@/core/studio/fields/runtime-authority';
import { STUDIO_CAPABILITIES as CAP } from '@/core/studio/permissions';
import { compileRegisteredView } from '@/core/studio/views/definition-compiler';
import { viewPayloadSchema } from '@/core/studio/views/schema';
import { checksum } from '@/core/studio/registry/contracts';
import { nativeDesignReferenceLinks } from '@/core/studio/authoring/native-reference-links';
import type { ReferenceNavigationContext } from '@/core/studio/authoring/reference-links';
import { businessViewCreateSchema } from './business-view-contract';
import { businessViewInspectionSchema, type BusinessMeasureReference, type BusinessViewInspection, type BusinessViewComparison } from './business-view-inspection-contract';

const ownerId = 'analytics.dashboard.view';
const supported = ['sales.orders', 'sales.quotes', 'products.catalogue'] as const;
const exact = ({ id, version, schemaHash, contractHash }: { id: string; version: number; schemaHash: string; contractHash: string }) => ({ id, version, schemaHash, contractHash });
async function current(supplied: FieldRuntimeAuthority) {
  const authority = await fieldRuntimeAuthorityInTransaction(supplied.session, supplied.transaction);
  assertCapability(authority.session, CAP.read);
  assertCapability(authority.session, 'analytics.dashboard.read');
  if (!await authority.transaction.moduleState.findFirst({ where: { organisationId: authority.session.organisationId,
    moduleId: 'studio', enabled: true, entitled: true }, select: { id: true } })) throw new Error('FORBIDDEN: this business design workspace is unavailable.');
  await authority.registry.resolve(authority.session, exact(authority.registry.describe(ownerId, 1)));
  return authority;
}
/** Source metadata only, independently authorised before names. This shares the
 * original closed compiler approval and never invokes a source query/provider. */
export async function readBusinessMeasureReferencesInTransaction(supplied: FieldRuntimeAuthority,
  navigation: ReferenceNavigationContext = {}): Promise<BusinessMeasureReference[]> {
  const authority = await current(supplied), sourceView = exact(authority.registry.describe(ownerId, 1));
  const metrics = await getAnalyticsMetrics(authority.session, authority.transaction), result: BusinessMeasureReference[] = [];
  for (const providerId of supported) {
    const selected = metrics.filter(value => value.id === providerId);
    if (selected.length > 1) throw new Error('DEPENDENCY_BROKEN: the approved measure catalogue is ambiguous.');
    const metric = selected[0]; if (!metric) continue;
    const reference = exact(authority.registry.describe(`${metric.id}.metric`, 1));
    try {
      await authority.registry.authoriseViewSourceReferenceInTransaction({ session: authority.session, transaction: authority.transaction }, sourceView, reference);
      result.push({ id: metric.id, name: metric.name, ...nativeDesignReferenceLinks({ sourceView, reference }, navigation) });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.startsWith('FORBIDDEN:')) throw error;
    }
  }
  return result;
}
async function inspect(supplied: FieldRuntimeAuthority, input: unknown, compare: boolean, navigation: ReferenceNavigationContext) {
  const authority = await current(supplied);
  assertCapability(authority.session, CAP.edit);
  assertCapability(authority.session, 'analytics.dashboard.manage');
  const value = businessViewInspectionSchema.parse(input), { transaction: tx, session } = authority;
  const draft = await tx.studioDraft.findFirst({ where: { definitionId: value.definitionId, organisationId: session.organisationId,
    definition: { kind: 'view', retiredAt: null } }, include: { definition: true } });
  if (!draft || draft.organisationId !== session.organisationId || draft.definitionId !== value.definitionId
    || draft.definition.organisationId !== session.organisationId || draft.definition.id !== value.definitionId
    || draft.definition.kind !== 'view' || draft.definition.retiredAt !== null) throw new Error('This business dashboard is unavailable.');
  if (compare ? value.revision > draft.revision || value.definitionRevision > draft.definition.revision
    : value.revision !== draft.revision || value.definitionRevision !== draft.definition.revision)
    throw new Error('CONFLICT: the saved dashboard changed. Compare it before saving.');
  const original = viewPayloadSchema.parse(draft.payload);
  if (original.sourceView.id !== ownerId) throw new Error('This business dashboard is unavailable.');
  // Both use the actual saved owner envelope, with its original strict hashes.
  // No client owner/pin, historical fallback, review update, Audit or data read.
  const saved = await compileRegisteredView(authority, original);
  const local = await compileRegisteredView(authority, { ...original, content: value.content });
  const savedContent = businessViewCreateSchema.parse(saved.payload.content), localContent = businessViewCreateSchema.parse(local.payload.content);
  const measures = await readBusinessMeasureReferencesInTransaction(authority, navigation);
  return { definitionId: value.definitionId, revision: draft.revision, definitionRevision: draft.definition.revision,
    activeVersionId: draft.definition.activeVersionId, saved: savedContent, local: localContent, measures,
    warnings: [...new Set([...saved.warnings, ...local.warnings])] };
}
export async function inspectBusinessViewDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown,
  navigation: ReferenceNavigationContext = {}): Promise<BusinessViewInspection> {
  const checked = await inspect(authority, input, false, navigation);
  return { definitionId: checked.definitionId, revision: checked.revision, definitionRevision: checked.definitionRevision,
    content: checked.local, warnings: checked.warnings, measures: checked.measures };
}
export async function compareBusinessViewDraftInTransaction(authority: FieldRuntimeAuthority, input: unknown,
  navigation: ReferenceNavigationContext = {}): Promise<BusinessViewComparison> {
  const checked = await inspect(authority, input, true, navigation), changes: string[] = [];
  if (checked.saved.name !== checked.local.name) changes.push('The dashboard name differs.');
  if (checked.saved.period !== checked.local.period) changes.push('The measure period differs.');
  if (checked.saved.refreshSeconds !== checked.local.refreshSeconds) changes.push('The refresh setting differs.');
  if (checksum(checked.saved.widgets.map(value => value.id)) !== checksum(checked.local.widgets.map(value => value.id))) changes.push('The chart selection or order differs.');
  const localIds = new Set(checked.local.widgets.map(value => value.id));
  for (const widget of checked.local.widgets) {
    const saved = checked.saved.widgets.find(value => value.id === widget.id);
    if (saved && checksum(saved) !== checksum(widget)) changes.push(`Chart ${checked.local.widgets.indexOf(widget) + 1} has different measure or presentation settings.`);
  }
  if (checked.saved.widgets.some(value => !localIds.has(value.id))) changes.push('The saved design includes charts absent from your local design.');
  return { ...checked, changes };
}
