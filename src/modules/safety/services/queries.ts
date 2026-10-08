import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import type { AttentionItem, SearchResult } from "@/core/modules/types";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { displayedPermitStatus, coverageGap, describeIncidentMovement, incidentRate, permitConflictHint, asbestosMessage, featureOn } from "../domain/work";
import { assistRiddor } from "../domain/riddor";

const canSeeSensitive = (session: Session) => session.capabilities.has(C.sensitiveIncidentRead);

export async function safetyProfile(organisationId: string) {
  return db.safetyProfile.findUnique({ where: { organisationId } });
}

export async function todayBoard(session: Session) {
  const organisationId = session.organisationId;
  const now = new Date();
  const week = new Date(now.getTime() + 7 * 86_400_000);
  const month = new Date(now.getTime() + 30 * 86_400_000);
  const profile = await safetyProfile(organisationId);
  const features = profile?.features ?? [];
  const sensitive = canSeeSensitive(session);
  const allow = (capability: string) => session.capabilities.has(capability);
  const [actions, incidents, inspections, checks, permits, holds, competences, reviews, records] = await Promise.all([
    allow(C.actionRead) || allow(C.todayRead) ? db.safetyAction.findMany({ where: { organisationId, status: { in: ["OPEN", "IN_PROGRESS"] } }, orderBy: { dueDate: "asc" }, take: 40 }) : [],
    allow(C.incidentRead) || sensitive ? db.safetyIncident.findMany({ where: { organisationId, status: { not: "CLOSED" }, ...(sensitive ? {} : { confidential: false }) }, orderBy: { occurredAt: "desc" }, take: 20 }) : [],
    allow(C.inspectionExecute) ? db.safetyInspection.findMany({ where: { organisationId, status: "DUE" }, orderBy: { scheduledFor: "asc" }, take: 20 }) : [],
    allow(C.equipmentRead) || allow(C.statutoryManage) ? db.safetyStatutoryCheck.findMany({ where: { organisationId, nextDueAt: { lte: week } }, orderBy: { nextDueAt: "asc" }, take: 20 }) : [],
    allow(C.permitRequest) || allow(C.permitAuthorise) ? db.safetyPermit.findMany({ where: { organisationId, status: { in: ["AUTHORISED", "IN_PROGRESS", "SUSPENDED", "REQUESTED"] } }, orderBy: { expiresAt: "asc" }, take: 20 }) : [],
    allow(C.holdManage) || allow(C.equipmentRead) || allow(C.todayRead) ? db.safetyHold.findMany({ where: { organisationId, status: "ACTIVE" }, orderBy: { placedAt: "desc" }, take: 20 }) : [],
    allow(C.competenceRead) || allow(C.todayRead) ? db.safetyCompetence.findMany({ where: { organisationId, expiresAt: { lte: month } }, orderBy: { expiresAt: "asc" }, take: 20 }) : [],
    allow(C.riskRead) ? db.safetyReviewRequest.findMany({ where: { organisationId, status: "OPEN" }, take: 20, include: { risk: true } }) : [],
    allow(C.riskRead) ? db.safetyRecord.findMany({ where: { organisationId, ...(sensitive || allow(C.healthSurveillanceRead) ? {} : { sensitive: false }), status: { notIn: ["CLOSED", "COMPLETE"] }, dueAt: { lte: month } }, orderBy: { dueAt: "asc" }, take: 30 }) : [],
  ]);
  const people = session.capabilities.has("people.employee.read") ? await db.employee.findMany({ where: { id: { in: competences.map((item) => item.employeeId) }, organisationId }, select: { id: true, firstName: true, lastName: true } }) : [];
  const names = new Map(people.map((person) => [person.id, `${person.firstName} ${person.lastName}`]));
  const overdueActions = actions.filter((action) => action.dueDate && action.dueDate < now && ["HIGH", "CRITICAL"].includes(action.priority));
  const livePermits = permits.map((permit) => ({ ...permit, shown: displayedPermitStatus(permit.status, permit.expiresAt, now) }));
  const friday = nextWeekday(now, 5);
  const fridayEnd = new Date(friday);
  fridayEnd.setHours(18, 0, 0, 0);
  const fridayStart = new Date(friday);
  fridayStart.setHours(14, 0, 0, 0);
  const firstAiders = featureOn(features, "first_aid")
    ? await db.safetyCompetence.findMany({ where: { organisationId, key: "FIRST_AID", OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] } })
    : [];
  const shifts = firstAiders.length && session.capabilities.has("people.rota.read") ? await db.rotaShift.findMany({ where: { organisationId, startsAt: { lte: fridayEnd }, endsAt: { gte: fridayStart }, status: "SCHEDULED" } }) : [];
  const qualifiedIds = new Set(firstAiders.map((item) => item.employeeId));
  const scheduledQualified = new Set(shifts.filter((shift) => qualifiedIds.has(shift.employeeId)).map((shift) => shift.employeeId)).size;
  const gap = featureOn(features, "first_aid") ? coverageGap(1, scheduledQualified) : null;
  return {
    profile,
    features,
    overdueActions,
    incidents: incidents.filter((incident) => incident.status === "INVESTIGATING" || incident.status === "IMMEDIATE_CONTROL" || incident.status === "REPORTED"),
    inspections,
    checks,
    permits: livePermits,
    holds,
    competences: competences.map((item) => ({ ...item, person: names.get(item.employeeId) ?? "Person" })),
    reviews,
    records,
    firstAidGap: gap,
    counts: {
      highActions: overdueActions.length,
      investigations: incidents.filter((incident) => incident.status === "INVESTIGATING").length,
      inspectionsDue: inspections.length,
      checksThisWeek: checks.length,
      permitsLive: livePermits.filter((permit) => permit.shown === "AUTHORISED" || permit.shown === "IN_PROGRESS").length,
      isolations: allow(C.isolationApply) || allow(C.permitRequest) ? await db.safetyIsolation.count({ where: { organisationId, status: { in: ["APPLIED", "VERIFIED"] } } }) : 0,
    },
  };
}

function nextWeekday(from: Date, day: number) {
  const date = new Date(from);
  const delta = (day + 7 - date.getDay()) % 7;
  date.setDate(date.getDate() + delta);
  return date;
}

export async function riskRegister(organisationId: string) {
  const risks = await db.safetyRisk.findMany({
    where: { organisationId },
    include: { assessments: { orderBy: { revision: "desc" }, include: { controls: true } }, place: true, reviews: { where: { status: "OPEN" } } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return risks.map((risk) => ({ ...risk, current: risk.assessments.find((item) => item.status === "APPROVED") ?? risk.assessments[0] ?? null }));
}

export async function riskDetail(organisationId: string, riskId: string) {
  const risk = await db.safetyRisk.findFirst({
    where: { id: riskId, organisationId },
    include: { assessments: { orderBy: { revision: "desc" }, include: { controls: true } }, place: true, reviews: { orderBy: { requestedAt: "desc" } } },
  });
  if (!risk) return null;
  const links = await db.safetyLink.findMany({ where: { organisationId, OR: [{ sourceType: "RISK", sourceId: riskId }, { targetType: "RISK", targetId: riskId }] } });
  const actions = await db.safetyAction.findMany({ where: { organisationId, sourceType: "RISK", sourceId: riskId } });
  return { ...risk, links, actions, current: risk.assessments.find((item) => item.status === "DRAFT") ?? risk.assessments.find((item) => item.status === "APPROVED") ?? risk.assessments[0] ?? null };
}

export async function incidentList(session: Session) {
  return db.safetyIncident.findMany({
    where: { organisationId: session.organisationId, ...(canSeeSensitive(session) ? {} : { confidential: false }) },
    orderBy: { occurredAt: "desc" },
    take: 200,
  });
}

export async function incidentDetail(session: Session, incidentId: string) {
  const incident = await db.safetyIncident.findFirst({
    where: { id: incidentId, organisationId: session.organisationId, ...(canSeeSensitive(session) ? {} : { confidential: false }) },
    include: { investigation: { include: { causes: true } }, riddor: true, place: true },
  });
  if (!incident) return null;
  const [actions, links] = await Promise.all([
    db.safetyAction.findMany({ where: { organisationId: session.organisationId, sourceType: "INCIDENT", sourceId: incident.id } }),
    db.safetyLink.findMany({ where: { organisationId: session.organisationId, sourceType: "INCIDENT", sourceId: incident.id } }),
  ]);
  const assistance = assistRiddor({ workRelated: incident.riddor?.workRelated ?? null, personClass: incident.riddor?.personClass ?? null, outcome: incident.riddor?.outcome ?? incident.actualConsequence });
  return { ...incident, actions, links, assistance };
}

export async function controlBoard(session: Session) {
  const organisationId = session.organisationId;
  const now = new Date();
  const allow = (capability: string) => session.capabilities.has(capability);
  const [permits, isolations, holds, contractors] = await Promise.all([
    allow(C.permitRequest) || allow(C.permitAuthorise) ? db.safetyPermit.findMany({ where: { organisationId }, orderBy: { expiresAt: "asc" }, take: 100, include: { place: true } }) : [],
    allow(C.isolationApply) || allow(C.permitRequest) ? db.safetyIsolation.findMany({ where: { organisationId, status: { not: "CLEARED" } }, include: { locks: true }, take: 100 }) : [],
    allow(C.holdManage) || allow(C.todayRead) || allow(C.equipmentRead) ? db.safetyHold.findMany({ where: { organisationId, status: { in: ["ACTIVE", "OVERRIDDEN"] } }, orderBy: { placedAt: "desc" }, take: 50 }) : [],
    allow(C.riskRead) || allow(C.todayRead) ? db.safetyRecord.findMany({ where: { organisationId, kind: "CONTRACTOR_PROFILE" }, take: 50 }) : [],
  ]);
  const shown = permits.map((permit) => ({ ...permit, shown: displayedPermitStatus(permit.status, permit.expiresAt, now) }));
  const byPlace = new Map<string, string[]>();
  for (const permit of shown.filter((permit) => permit.shown === "AUTHORISED" || permit.shown === "IN_PROGRESS")) {
    const key = permit.placeId ?? permit.place?.name ?? "site";
    byPlace.set(key, [...(byPlace.get(key) ?? []), permit.kind]);
  }
  const conflicts = [...byPlace.values()].map((kinds) => permitConflictHint(kinds)).filter((hint): hint is string => Boolean(hint));
  return { permits: shown, isolations, holds, contractors, conflicts };
}

export async function permitDetail(organisationId: string, permitId: string) {
  const permit = await db.safetyPermit.findFirst({ where: { id: permitId, organisationId }, include: { place: true, isolations: { include: { locks: true } } } });
  if (!permit) return null;
  return { ...permit, shown: displayedPermitStatus(permit.status, permit.expiresAt, new Date()) };
}

export async function holdDetail(session: Session, holdId: string) {
  const organisationId = session.organisationId;
  const hold = await db.safetyHold.findFirst({ where: { id: holdId, organisationId } });
  if (!hold) return null;
  const orders = hold.targetType === "MANUFACTURING_RESOURCE" && session.capabilities.has("manufacturing.order.read")
    ? await db.manufacturingOrder.findMany({
      where: { organisationId, workOrders: { some: { resourceId: hold.targetId } }, status: { in: ["PLANNED", "READY", "RELEASED", "RUNNING"] } },
      include: { product: { select: { name: true } }, sourceSalesOrderLine: { select: { id: true, orderId: true } } },
      take: 20,
    })
    : [];
  const action = hold.maintenanceActionId && (session.capabilities.has(C.actionRead) || session.capabilities.has(C.todayRead)) ? await db.safetyAction.findFirst({ where: { id: hold.maintenanceActionId, organisationId } }) : null;
  return { ...hold, orders, action };
}

export async function assuranceBoard(session: Session) {
  const organisationId = session.organisationId;
  const sensitive = canSeeSensitive(session) || session.capabilities.has(C.healthSurveillanceRead);
  const allow = (capability: string) => session.capabilities.has(capability);
  const [inspections, audits, checks, documents, obligations, competences, changes, substances] = await Promise.all([
    allow(C.inspectionExecute) ? db.safetyInspection.findMany({ where: { organisationId }, orderBy: { scheduledFor: "asc" }, take: 40 }) : [],
    allow(C.auditExecute) ? db.safetyAudit.findMany({ where: { organisationId }, orderBy: { startedAt: "desc" }, include: { findings: true }, take: 20 }) : [],
    allow(C.equipmentRead) || allow(C.statutoryManage) || allow(C.todayRead) ? db.safetyStatutoryCheck.findMany({ where: { organisationId }, orderBy: { nextDueAt: "asc" }, take: 40 }) : [],
    allow(C.documentRead) ? db.safetyDocument.findMany({ where: { organisationId }, orderBy: { revision: "desc" }, take: 40 }) : [],
    allow(C.reportRead) || allow(C.todayRead) ? db.safetyObligation.findMany({ where: { organisationId }, orderBy: { topic: "asc" }, take: 40 }) : [],
    allow(C.competenceRead) || allow(C.todayRead) ? db.safetyCompetence.findMany({ where: { organisationId }, orderBy: { expiresAt: "asc" }, take: 80 }) : [],
    allow(C.changeManage) ? db.safetyChange.findMany({ where: { organisationId }, orderBy: { reference: "desc" }, take: 20 }) : [],
    allow(C.coshhRead) ? db.safetySubstance.findMany({ where: { organisationId }, orderBy: { tradeName: "asc" }, take: 40 }) : [],
  ]);
  const records = allow(C.riskRead) || allow(C.todayRead) || allow(C.healthSurveillanceRead) ? await db.safetyRecord.findMany({ where: { organisationId, ...(sensitive ? {} : { sensitive: false }) }, orderBy: { updatedAt: "desc" }, take: 40 }) : [];
  const employees = session.capabilities.has("people.employee.read") ? await db.employee.findMany({ where: { organisationId }, select: { id: true, firstName: true, lastName: true }, take: 200 }) : [];
  return { inspections, audits, checks, documents, obligations, competences, changes, substances, records, employees };
}

export async function inspectionDetail(organisationId: string, inspectionId: string) {
  return db.safetyInspection.findFirst({ where: { id: inspectionId, organisationId }, include: { template: true } });
}

export async function substanceDetail(session: Session, substanceId: string) {
  const organisationId = session.organisationId;
  const substance = await db.safetySubstance.findFirst({ where: { id: substanceId, organisationId }, include: { sheets: { orderBy: { uploadedAt: "desc" } }, assessments: { orderBy: { revision: "desc" } }, place: true } });
  if (!substance) return null;
  const link = session.capabilities.has("stock.read") ? await db.safetyLink.findFirst({ where: { organisationId, sourceType: "SUBSTANCE", sourceId: substanceId, targetType: "PRODUCT" } }) : null;
  const stock = link ? await db.stockPosition.findMany({ where: { organisationId, productId: link.targetId }, include: { warehouse: { select: { name: true } } } }) : [];
  const others = await db.safetySubstance.findMany({ where: { organisationId, id: { not: substanceId }, placeId: substance.placeId }, select: { tradeName: true, classifications: true } });
  return { ...substance, stock, others };
}

export async function equipmentDetail(organisationId: string, checkId: string) {
  return db.safetyStatutoryCheck.findFirst({ where: { id: checkId, organisationId } });
}

export async function recordDetail(session: Session, recordId: string) {
  const record = await db.safetyRecord.findFirst({ where: { id: recordId, organisationId: session.organisationId } });
  if (!record) return null;
  if (record.sensitive && !session.capabilities.has(C.healthSurveillanceRead) && !session.capabilities.has(C.sensitiveIncidentRead) && record.ownerUserId !== session.userId) return null;
  const asbestos = record.kind === "ASBESTOS" ? asbestosMessage(true) : null;
  return { ...record, asbestosNote: record.kind === "ASBESTOS" ? asbestos : asbestosMessage(false) };
}

export async function safetyReport(session: Session) {
  const organisationId = session.organisationId;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sensitive = canSeeSensitive(session);
  const allow = (capability: string) => session.capabilities.has(capability);
  const where = { organisationId, ...(sensitive ? {} : { confidential: false }) };
  const [current, previous, actions, risks, checks, inspections, competences] = await Promise.all([
    allow(C.incidentRead) || sensitive ? db.safetyIncident.findMany({ where: { ...where, occurredAt: { gte: monthStart } } }) : [],
    allow(C.incidentRead) || sensitive ? db.safetyIncident.findMany({ where: { ...where, occurredAt: { gte: previousStart, lt: monthStart } } }) : [],
    allow(C.actionRead) || allow(C.todayRead) ? db.safetyAction.findMany({ where: { organisationId }, take: 300 }) : [],
    allow(C.riskRead) ? db.safetyAssessment.findMany({ where: { organisationId, status: "APPROVED" }, take: 300 }) : [],
    allow(C.equipmentRead) || allow(C.statutoryManage) || allow(C.todayRead) ? db.safetyStatutoryCheck.findMany({ where: { organisationId }, take: 200 }) : [],
    allow(C.inspectionExecute) ? db.safetyInspection.findMany({ where: { organisationId }, take: 200 }) : [],
    allow(C.competenceRead) || allow(C.todayRead) ? db.safetyCompetence.findMany({ where: { organisationId }, take: 300 }) : [],
  ]);
  const slices = ["NEAR_MISS", "INJURY", "HAZARD"].map((kind) => ({ label: kind.replaceAll("_", " ").toLowerCase(), count: current.filter((item) => item.kind === kind).length }));
  const hours = null;
  return {
    narrative: describeIncidentMovement(previous.length, current.length, slices),
    rate: incidentRate(current.length, hours, "hours"),
    highPotential: current.filter((item) => ["FATAL", "SPECIFIED_INJURY", "MAJOR_DAMAGE"].includes(item.potentialConsequence)),
    openActions: actions.filter((item) => ["OPEN", "IN_PROGRESS"].includes(item.status)),
    overdueActions: actions.filter((item) => item.dueDate && item.dueDate < now && !["VERIFIED", "CLOSED"].includes(item.status)),
    highResidual: risks.filter((item) => item.residualRating === "High" || item.residualRating === "Critical"),
    overdueReviews: risks.filter((item) => item.reviewDate && item.reviewDate < now),
    checksDue: checks.filter((item) => item.nextDueAt && item.nextDueAt < now),
    inspectionCompletion: inspections.length ? Math.round((inspections.filter((item) => item.status === "COMPLETE" || item.status === "FAILED").length / inspections.length) * 100) : null,
    competence: {
      current: competences.filter((item) => !item.expiresAt || item.expiresAt >= now).length,
      expiring: competences.filter((item) => item.expiresAt && item.expiresAt >= now && item.expiresAt.getTime() < now.getTime() + 30 * 86_400_000).length,
      expired: competences.filter((item) => item.expiresAt && item.expiresAt < now).length,
    },
  };
}

export async function safetyAttention(session: Session): Promise<AttentionItem[]> {
  if (!session.capabilities.has(C.todayRead)) return [];
  const board = await todayBoard(session);
  return [
    ...board.records.filter(record => record.dueAt && record.dueAt < new Date(new Date().toISOString().slice(0, 10))).slice(0, 3).map(record => ({ id: record.id, label: `${record.reference} workplace review is overdue`, href: `/safety/records/${record.id}`, severity: "warning" as const })),
    ...board.holds.slice(0, 3).map((hold) => ({ id: hold.id, label: `${hold.targetLabel} is on safety hold`, href: `/safety/control/holds/${hold.id}`, severity: "critical" as const })),
    ...board.overdueActions.slice(0, 3).map((action) => ({ id: action.id, label: `${action.reference} is overdue`, href: "/safety/assurance", severity: "warning" as const })),
    ...board.checks.slice(0, 2).map((check) => ({ id: check.id, label: `${check.assetLabel} examination is due`, href: `/safety/equipment/${check.id}`, severity: "warning" as const })),
  ];
}

export async function searchSafety(session: Session, query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2 || !session.capabilities.has(C.todayRead)) return [];
  const organisationId = session.organisationId;
  const [risks, incidents, permits, holds, records] = await Promise.all([
    session.capabilities.has(C.riskRead) ? db.safetyRisk.findMany({ where: { organisationId, OR: [{ reference: { contains: q, mode: "insensitive" } }, { title: { contains: q, mode: "insensitive" } }] }, take: 5 }) : [],
    session.capabilities.has(C.incidentRead) || canSeeSensitive(session) ? db.safetyIncident.findMany({ where: { organisationId, confidential: canSeeSensitive(session) ? undefined : false, OR: [{ reference: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }] }, take: 5 }) : [],
    session.capabilities.has(C.permitRequest) || session.capabilities.has(C.permitAuthorise) ? db.safetyPermit.findMany({ where: { organisationId, OR: [{ reference: { contains: q, mode: "insensitive" } }, { title: { contains: q, mode: "insensitive" } }] }, take: 5 }) : [],
    db.safetyHold.findMany({ where: { organisationId, OR: [{ reference: { contains: q, mode: "insensitive" } }, { targetLabel: { contains: q, mode: "insensitive" } }] }, take: 5 }),
    session.capabilities.has(C.riskRead) ? db.safetyRecord.findMany({ where: { organisationId, ...(canSeeSensitive(session) || session.capabilities.has(C.healthSurveillanceRead) ? {} : { sensitive: false }), OR: [{ reference: { contains: q, mode: "insensitive" } }, { title: { contains: q, mode: "insensitive" } }] }, take: 5 }) : [],
  ]);
  return [
    ...records.map(record => ({ id: record.id, title: record.reference, subtitle: record.title, href: `/safety/records/${record.id}`, group: "Safety" })),
    ...risks.map((risk) => ({ id: risk.id, title: risk.reference, subtitle: risk.title, href: `/safety/risk/${risk.id}`, group: "Safety" })),
    ...incidents.map((incident) => ({ id: incident.id, title: incident.reference, subtitle: incident.summary, href: `/safety/incidents/${incident.id}`, group: "Safety" })),
    ...permits.map((permit) => ({ id: permit.id, title: permit.reference, subtitle: permit.title, href: `/safety/control/permits/${permit.id}`, group: "Safety" })),
    ...holds.map((hold) => ({ id: hold.id, title: hold.reference, subtitle: hold.targetLabel, href: `/safety/control/holds/${hold.id}`, group: "Safety" })),
  ];
}
