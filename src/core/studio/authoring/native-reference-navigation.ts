import { z } from 'zod';
import { assertCapability } from '@/core/permissions/check';
import { STUDIO_CAPABILITIES } from '../permissions';
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from '../fields/runtime-authority';
import { checksum } from '../registry/contracts';
import type { ContractMetadata, ContractReference } from '../registry/types';
import { entityDetailsSchema } from '../registry/entities';
import { pageDependencySchema } from '../pages/approvals';
import { configurationDependencyReferenceSchema } from '../configuration/dependency-reference';
import { sealedConfigurationVersionSelection } from '../configuration/pins';
import { readDesignReferenceMetadataInTransaction } from './reference-navigation';
import { nativeDesignReferenceLinks, nativeDesignReferenceRequestSchema } from './native-reference-links';
import type { ReferenceNavigationContext } from './reference-links';

export const NATIVE_REFERENCE_USAGE_LIMIT = 25;
export const NATIVE_REFERENCE_SCAN_LIMIT = 500;
const kinds = ['page', 'customField', 'entityProfile', 'recordType', 'view'] as const;
const frameSchema = z.object({ dependencies: z.array(pageDependencySchema).max(100) });
const friendly = (value: string) => value.replaceAll('_', ' ').replace(/^./, letter => letter.toUpperCase());
const same = (left: ContractReference, right: ContractReference) => checksum(left) === checksum(right);
const reference = ({ id, version, schemaHash, contractHash }: ContractReference): ContractReference => ({ id, version, schemaHash, contractHash });
function unavailable(): never { throw new Error('DEPENDENCY_BROKEN: this approved app reference is unavailable or has changed.'); }

export type NativeReferenceModel = {
  name: string; owner: string; version: number; category: string; detail: string | null;
  sourceHref: string; whereUsedHref: string; usage: boolean;
  usages: { name: string; kind: string; status: 'Live' | 'Saved version' | 'Retired'; href: string | null }[];
  nextHref: string | null;
};

/** Exact native capability metadata and original persisted reverse edges only.
 * No record query, provider, command/preview invocation, values or writes. A
 * native detail's usage is capability-level, not a count of individual fields. */
export async function readNativeDesignReferenceInTransaction(supplied: FieldRuntimeAuthority, input: unknown,
  navigation: ReferenceNavigationContext = {}, mode: 'source' | 'usage' = 'source'): Promise<NativeReferenceModel> {
  const authority = await fieldRuntimeAuthorityInTransaction(supplied.session, supplied.transaction);
  const { session, transaction: tx, registry } = authority;
  assertCapability(session, STUDIO_CAPABILITIES.read);
  const request = nativeDesignReferenceRequestSchema.parse(input);
  if (mode === 'source' && request.cursor) unavailable();
  const source = await registry.resolvePageSourcePolicy({ session, transaction: tx }, request.sourcePage);
  const metadata = await registry.resolve(session, request.reference);
  if (metadata.ownerModuleId !== source.source.ownerModuleId) unavailable();
  const policy = source.policy, entity = entityDetailsSchema.parse(source.source.details);
  const sameApproved = (left: ContractReference, right: { id: string; version: number }) => same(left, reference(registry.describe(right.id, right.version)));
  let approved = false, detail: string | null = null;
  const queries = new Map<string, ContractReference>();
  const requireQuery = (ref: { id: string; version: number }) => {
    const query = policy.queries.find(item => item.query.id === ref.id && item.query.version === ref.version);
    if (!query) unavailable();
    for (const column of query.columns) if (column.capability) assertCapability(session, column.capability);
    queries.set(`${ref.id}@${ref.version}`, reference(registry.describe(ref.id, ref.version)));
  };
  if (request.focus?.kind === 'field') {
    const field = entity.fields.find(item => item.id === request.focus?.id);
    const native = policy.nativeFields.find(item => item.id === request.focus?.id);
    if (!field || !native || !sameApproved(request.reference, policy.entity)) unavailable();
    if (field.capability) assertCapability(session, field.capability);
    requireQuery(native.query); approved = true;
    const column = policy.queries.find(item => item.query.id === native.query.id && item.query.version === native.query.version)?.columns.find(item => item.id === native.columnId);
    if (!column) unavailable();
    detail = field.label ?? column.label ?? friendly(field.id);
  } else if (request.focus?.kind === 'fact') {
    const fact = policy.facts.find(item => item.id === request.focus?.id);
    if (!fact || !sameApproved(request.reference, fact.contract)) unavailable();
    if (fact.capability) assertCapability(session, fact.capability);
    const field = entity.fields.find(item => item.id === fact.id);
    if (field?.capability) assertCapability(session, field.capability);
    requireQuery(fact.query); approved = true;
    detail = field?.label ?? friendly(fact.id);
  } else if (sameApproved(request.reference, policy.entity)) approved = true;
  else if (policy.queries.some(item => sameApproved(request.reference, item.query))) { requireQuery(request.reference); approved = true; }
  else {
    const command = policy.commands.find(item => sameApproved(request.reference, item.command));
    const metric = policy.metrics.find(item => sameApproved(request.reference, item.metric));
    const surface = policy.surfaces.find(item => sameApproved(request.reference, item.surface));
    if (command) { if (command.previewQuery) requireQuery(command.previewQuery); approved = true; }
    if (metric) { requireQuery(metric.query); approved = true; }
    if (surface) { for (const query of surface.queries) requireQuery(query); approved = true; }
  }
  if (!approved) unavailable();
  for (const query of queries.values()) await registry.resolve(session, query);
  const categories: Partial<Record<ContractMetadata['kind'], string>> = {
    entity: 'Native record', query: 'Approved record query', command: 'Approved app action', decisionFact: 'Approved read-only fact',
    metric: 'Approved measure', surface: 'Native app area',
  };
  const category = categories[metadata.kind]; if (!category) unavailable();
  const links = nativeDesignReferenceLinks({ sourcePage: request.sourcePage, reference: request.reference,
    ...(request.focus ? { focus: request.focus } : {}) }, navigation);
  const model: NativeReferenceModel = { name: metadata.label, owner: friendly(metadata.ownerModuleId), version: metadata.version,
    category, detail, ...links, usage: mode === 'usage', usages: [], nextHref: null };
  if (mode === 'source') return model;

  // The original tenant/owner/contract reverse index supplies immutable metadata
  // only. Snapshot identity is bounded independently from the displayed page.
  const edges = await tx.studioDependency.findMany({ where: { organisationId: session.organisationId,
    ownerModuleId: metadata.ownerModuleId, contractId: metadata.id, contractVersion: metadata.version,
    version: { definition: { kind: { in: [...kinds] } } } }, orderBy: { id: 'asc' }, take: NATIVE_REFERENCE_SCAN_LIMIT + 1,
    select: { id: true, organisationId: true, definitionId: true, versionId: true, ownerModuleId: true,
      contractId: true, contractVersion: true, schemaHash: true, contractHash: true,
      version: { select: { id: true, organisationId: true, definitionId: true, schemaVersion: true, checksum: true,
        definition: { select: { id: true, organisationId: true, kind: true, revision: true, activeVersionId: true, retiredAt: true } } } } } });
  if (edges.length > NATIVE_REFERENCE_SCAN_LIMIT)
    throw new Error('REFERENCE_USAGE_LIMIT: this approved app reference exceeds the 500 saved-version review limit. Narrow the business configuration review.');
  const versions = new Set<string>();
  for (const edge of edges) {
    const version = edge.version, definition = version.definition;
    if (edge.organisationId !== session.organisationId || edge.ownerModuleId !== metadata.ownerModuleId
      || edge.contractId !== metadata.id || edge.contractVersion !== metadata.version || edge.schemaHash !== metadata.schemaHash || edge.contractHash !== metadata.contractHash
      || version.organisationId !== session.organisationId || definition.organisationId !== session.organisationId
      || version.id !== edge.versionId || version.definitionId !== edge.definitionId || definition.id !== edge.definitionId
      || !kinds.includes(definition.kind as typeof kinds[number]) || versions.has(version.id)) unavailable();
    versions.add(version.id);
  }
  const snapshot = checksum({ organisationId: session.organisationId, actor: session.userId, membership: session.membershipId,
    request: { sourcePage: request.sourcePage, reference: request.reference, ...(request.focus ? { focus: request.focus } : {}) },
    edges: edges.map(edge => ({ ...edge, version: { ...edge.version,
      definition: { ...edge.version.definition, retiredAt: edge.version.definition.retiredAt?.toISOString() ?? null } } })) });
  let start = 0;
  if (request.cursor) {
    if (request.cursor.checksum !== snapshot) throw new Error('CONFLICT: saved references changed. Reopen the usage review.');
    const position = edges.findIndex(edge => edge.id === request.cursor?.after);
    if (position < 0) throw new Error('CONFLICT: usage continuation is unavailable. Reopen the review.');
    start = position + 1;
  }
  const page = edges.slice(start, start + NATIVE_REFERENCE_USAGE_LIMIT);
  const names = { page: 'Screen', customField: 'Additional field', entityProfile: 'Business setup', recordType: 'Business type', view: 'Dashboard' } as const;
  for (const edge of page) {
    const pin = configurationDependencyReferenceSchema.parse({ kind: edge.version.definition.kind, definitionId: edge.definitionId,
      versionId: edge.versionId, schemaVersion: edge.version.schemaVersion, checksum: edge.version.checksum });
    const version = await tx.studioDefinitionVersion.findFirst({ where: { id: pin.versionId, definitionId: pin.definitionId,
      organisationId: session.organisationId }, select: { ...sealedConfigurationVersionSelection,
        dependencies: { select: { organisationId: true, definitionId: true, versionId: true, ownerModuleId: true,
          contractId: true, contractVersion: true, schemaHash: true, contractHash: true }, take: 101 } } });
    if (!version || version.id !== pin.versionId || version.definitionId !== pin.definitionId
      || version.organisationId !== session.organisationId || version.schemaVersion !== pin.schemaVersion || version.checksum !== pin.checksum) unavailable();
    const declared = frameSchema.parse(version.compiledPlan).dependencies;
    if (version.dependencies.length !== declared.length || new Set(declared.map(value => `${value.id}@${value.version}`)).size !== declared.length) unavailable();
    for (const dependency of declared) {
      const actual = registry.describe(dependency.id, dependency.version);
      const expected = { ...reference(actual), ownerModuleId: actual.ownerModuleId, kind: actual.kind, classification: actual.classification };
      const stored = version.dependencies.find(value => value.contractId === dependency.id && value.contractVersion === dependency.version);
      if (checksum(expected) !== checksum(dependency) || !stored || stored.organisationId !== session.organisationId
        || stored.definitionId !== pin.definitionId || stored.versionId !== pin.versionId || stored.ownerModuleId !== actual.ownerModuleId
        || stored.schemaHash !== actual.schemaHash || stored.contractHash !== actual.contractHash) unavailable();
    }
    if (!declared.some(value => same(reference(value), request.reference))) unavailable();
    try {
      const readable = await readDesignReferenceMetadataInTransaction(authority, pin, navigation);
      const kind = pin.kind as keyof typeof names;
      model.usages.push({ name: readable.name, kind: names[kind], status: readable.retired ? 'Retired'
        : edge.version.definition.activeVersionId === edge.versionId ? 'Live' : 'Saved version', href: readable.sourceHref });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.startsWith('FORBIDDEN:')) throw error;
    }
  }
  if (start + page.length < edges.length) {
    const next = new URL(links.whereUsedHref, 'https://atlas.invalid');
    next.searchParams.set('after', page[page.length - 1].id); next.searchParams.set('cursorChecksum', snapshot);
    model.nextHref = `${next.pathname}${next.search}`;
  }
  return model;
}
