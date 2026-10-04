import type { Session } from '@/core/auth/session';
import type { Prisma } from '@/generated/prisma/client';

// Shared record scopes used by both application queries and the secured data API.
export function serviceCaseScope(session: Session): Prisma.ServiceCaseWhereInput {
  return { organisationId: session.organisationId,
    organisation: { moduleStates: { some: { moduleId: "service", enabled: true, entitled: true } } },
    ...(!session.capabilities.has('service.case.read') ? { id: '__denied__' } : {}),
    ...(!session.capabilities.has('service.case.restricted') ? { security: 'STANDARD' } : {}),
  };
}
export function serviceTicketScope(session: Session): Prisma.ServiceTicketWhereInput {
  return { organisationId: session.organisationId,
    organisation: { moduleStates: { some: { moduleId: 'service', enabled: true, entitled: true } } },
    case: { organisationId: session.organisationId, ...(!session.capabilities.has('service.case.restricted') ? { security: 'STANDARD' } : {}) },
    ...(!session.capabilities.has('service.ticket.read') ? { id: '__denied__' } : {}),
    ...(!session.capabilities.has('service.case.read') ? { OR: [
      { ownerUserId: session.userId },
      { queue: { organisationId: session.organisationId, members: { some: { organisationId: session.organisationId, userId: session.userId } } } },
    ] } : {}),
  };
}
