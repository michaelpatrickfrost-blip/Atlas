import { z } from 'zod';
import type { Session } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { fieldRuntimeAuthorityInTransaction, withFieldRuntimeAuthority, type FieldRuntimeAuthority } from '@/core/studio/fields/runtime-authority';
import { workScope } from './access';
import { ticketFieldFormManifestInTransaction } from './field-forms';
import { WORK_STATUSES } from './config';
import type { TicketFieldFormManifest } from './field-form-contract';

const inputSchema = z.strictObject({ recordId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  expectedRevision: z.number().int().positive(), expectedUpdatedAt: z.iso.datetime() });
export type TicketProgressFormRequest = z.infer<typeof inputSchema>;
export type TicketProgressFormData = { work: { id: string; version: number; status: typeof WORK_STATUSES[number]; ownerUserId: string | null };
  owners: { id: string; name: string }[]; fieldManifest: TicketFieldFormManifest | null };
function unavailable(): never { throw new Error('NOT_FOUND: the ticket progress form is unavailable.'); }
function changed(): never { throw new Error('CONFLICT: the ticket or its business form changed. Refresh before saving.'); }

/** An owning render adapter, not an endpoint or write authority. The caller gets
 * its exact anchor from the current Page gateway; even supplied hints never grant
 * access. All native writes stay in updateWork with its complete packet/receipt. */
export async function loadTicketProgressForm(authenticated: Session, input: TicketProgressFormRequest): Promise<TicketProgressFormData> {
  const request = inputSchema.parse(input);
  return withFieldRuntimeAuthority(authenticated, authority => loadTicketProgressFormInTransaction(authority, request));
}
export async function loadTicketProgressFormInTransaction(supplied: FieldRuntimeAuthority, input: TicketProgressFormRequest): Promise<TicketProgressFormData> {
  const request = inputSchema.parse(input);
  // A caller's earlier metadata snapshot is never the current form grant.
  const authority = await fieldRuntimeAuthorityInTransaction(supplied.session, supplied.transaction);
  const { session, transaction: tx } = authority;
  assertCapability(session, 'tickets.ticket.read'); assertCapability(session, 'tickets.ticket.manage');
  if (!await tx.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: 'tickets', enabled: true, entitled: true }, select: { id: true } }))
    throw new Error('DEPENDENCY_BROKEN: Tickets is unavailable.');
  const scoped = { AND: [workScope(session), { id: request.recordId, kind: 'TICKET' as const, mergedIntoId: null,
    queue: { organisationId: session.organisationId } }] };
  // Private/current receiving-team and anchor checks precede native form values,
  // active field metadata, typed columns and assignment names.
  const head = await tx.serviceWorkItem.findFirst({ where: scoped, select: { id: true, organisationId: true, version: true, updatedAt: true,
    queueId: true, queue: { select: { organisationId: true, restricted: true } } } });
  if (!head || head.id !== request.recordId || head.organisationId !== session.organisationId || head.queue.organisationId !== session.organisationId) unavailable();
  if (head.version !== request.expectedRevision || head.updatedAt.toISOString() !== request.expectedUpdatedAt) changed();
  if (head.queue.restricted && !await tx.serviceQueueMember.findFirst({ where: { organisationId: session.organisationId, queueId: head.queueId, userId: session.userId }, select: { id: true } }))
    throw new Error('FORBIDDEN: current receiving-team access is required.');
  const fieldManifest = await ticketFieldFormManifestInTransaction(authority, { operation: 'update', recordId: head.id });
  if (fieldManifest && (fieldManifest.operation !== 'update' || fieldManifest.recordRevision !== head.version)) changed();
  const work = await tx.serviceWorkItem.findFirst({ where: { AND: [scoped, { version: head.version, updatedAt: head.updatedAt }] },
    select: { id: true, organisationId: true, version: true, status: true, ownerUserId: true } });
  if (!work || work.id !== head.id || work.organisationId !== session.organisationId || work.version !== head.version) changed();
  const status = z.enum(WORK_STATUSES).safeParse(work.status); if (!status.success) changed();
  const queueMembers = await tx.serviceQueueMember.findMany({ where: { organisationId: session.organisationId, queueId: head.queueId }, select: { userId: true }, orderBy: { userId: 'asc' }, take: 501 });
  if (queueMembers.length > 500 || new Set(queueMembers.map(member => member.userId)).size !== queueMembers.length) unavailable();
  const members = queueMembers.length ? await tx.membership.findMany({ where: { organisationId: session.organisationId, active: true, userId: { in: queueMembers.map(member => member.userId) } },
    select: { organisationId: true, userId: true, user: { select: { name: true } } }, orderBy: { userId: 'asc' }, take: 501 }) : [];
  const allowed = new Set(queueMembers.map(member => member.userId));
  if (members.length > 500 || new Set(members.map(member => member.userId)).size !== members.length || members.some(member => member.organisationId !== session.organisationId || !allowed.has(member.userId))) unavailable();
  return { work: { id: work.id, version: work.version, status: status.data, ownerUserId: work.ownerUserId }, owners: members.map(member => ({ id: member.userId, name: member.user.name })), fieldManifest };
}
