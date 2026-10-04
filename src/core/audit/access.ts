import type { Prisma } from "@/generated/prisma/client";
import { exportCsv } from "@/core/shared/csv-export";
import { AUDIT_SYSTEMS, UNCLASSIFIED_SYSTEM, systemForAction, type AuditSystem } from "./systems";

export const AUDIT_AREA_CAPABILITY = "audit.area.read";
export const AUDIT_OWN_CAPABILITY = "audit.own.read";

export type AuditAccessPolicy = {
  ownActivity: boolean;
  grants: Array<{ userId: string; areaIds: string[] }>;
};

export function auditAreas(): AuditSystem[] {
  return [...AUDIT_SYSTEMS, UNCLASSIFIED_SYSTEM];
}

export function isAuditArea(id: string) {
  return auditAreas().some((area) => area.id === id);
}

export function parseAuditAccess(value: unknown): AuditAccessPolicy {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const areas = record.areas && typeof record.areas === "object" && !Array.isArray(record.areas) ? record.areas as Record<string, unknown> : {};
  const grants = Object.entries(areas).flatMap(([userId, ids]) => {
    if (!userId || !Array.isArray(ids)) return [];
    const areaIds = [...new Set(ids.filter((id): id is string => typeof id === "string" && isAuditArea(id)))];
    return areaIds.length ? [{ userId, areaIds }] : [];
  });
  return { ownActivity: record.ownActivity === true, grants };
}

export function serializeAuditAccess(policy: AuditAccessPolicy) {
  return {
    ownActivity: policy.ownActivity,
    areas: Object.fromEntries(policy.grants.map((grant) => [grant.userId, grant.areaIds])),
  };
}

export function assignAuditAreas(policy: AuditAccessPolicy, userId: string, areaIds: string[]): AuditAccessPolicy {
  const clean = [...new Set(areaIds.filter(isAuditArea))];
  const grants = policy.grants.filter((grant) => grant.userId !== userId);
  if (clean.length) grants.push({ userId, areaIds: clean });
  return { ownActivity: policy.ownActivity, grants };
}

export function setOwnActivity(policy: AuditAccessPolicy, ownActivity: boolean): AuditAccessPolicy {
  return { ...policy, ownActivity };
}

export function areasForUser(policy: AuditAccessPolicy, userId: string) {
  return policy.grants.find((grant) => grant.userId === userId)?.areaIds ?? [];
}

/** Caps added for the company switch and area grants. A company that turns Audit off strips them. */
export function auditSessionCapabilities(policy: AuditAccessPolicy, userId: string) {
  const capabilities: string[] = [];
  if (policy.ownActivity) capabilities.push(AUDIT_OWN_CAPABILITY);
  if (areasForUser(policy, userId).length) capabilities.push(AUDIT_AREA_CAPABILITY);
  return capabilities;
}

export function areaActionWhere(areaIds: string[]): Prisma.AuditEntryWhereInput {
  const selected = [...new Set(areaIds.filter(isAuditArea))];
  const clauses: Prisma.AuditEntryWhereInput[] = AUDIT_SYSTEMS
    .filter((area) => selected.includes(area.id))
    .flatMap((area) => area.prefixes)
    .map((prefix) => ({ action: { startsWith: prefix } }));
  if (selected.includes(UNCLASSIFIED_SYSTEM.id)) {
    const known = AUDIT_SYSTEMS.flatMap((area) => area.prefixes).map((prefix) => ({ action: { startsWith: prefix } }));
    clauses.push({ NOT: { OR: known } });
  }
  if (!clauses.length) return { actorUserId: { in: [] } };
  return clauses.length === 1 ? clauses[0] : { OR: clauses };
}

export type AuditViewKind = "company" | "team" | "areas" | "own" | "mixed" | "none";

export function auditVisibility(input: {
  company: boolean;
  teamActorIds: string[] | null;
  areaIds: string[];
  own: boolean;
  userId: string;
}): { where: Prisma.AuditEntryWhereInput; kind: AuditViewKind; areaIds: string[] } {
  if (input.company) return { where: {}, kind: "company", areaIds: [] };
  const parts: Prisma.AuditEntryWhereInput[] = [];
  if (input.teamActorIds) parts.push({ actorUserId: { in: input.teamActorIds } });
  if (input.own && !input.teamActorIds?.includes(input.userId)) parts.push({ actorUserId: input.userId });
  const areaIds = [...new Set(input.areaIds.filter(isAuditArea))];
  if (areaIds.length) parts.push(areaActionWhere(areaIds));
  if (!parts.length) return { where: { actorUserId: { in: [] } }, kind: "none", areaIds: [] };
  const flags = [input.teamActorIds ? "team" : null, areaIds.length ? "areas" : null, input.own && !input.teamActorIds ? "own" : null].filter(Boolean);
  const kind = (flags.length > 1 ? "mixed" : flags[0] ?? "none") as AuditViewKind;
  return { where: parts.length === 1 ? parts[0] : { OR: parts }, kind, areaIds };
}

export function personInAuditView(personId: string, input: { company: boolean; teamActorIds: string[] | null; areaIds: string[]; own: boolean; userId: string }) {
  if (input.company || input.areaIds.length) return true;
  if (input.teamActorIds?.includes(personId)) return true;
  return input.own && personId === input.userId;
}

export function auditSearchWhere(query: string, nameUserIds: string[]): Prisma.AuditEntryWhereInput | null {
  const text = query.trim();
  if (text.length < 2) return null;
  const or: Prisma.AuditEntryWhereInput[] = [
    { action: { contains: text, mode: "insensitive" } },
    { entityType: { contains: text, mode: "insensitive" } },
  ];
  if (nameUserIds.length) or.push({ actorUserId: { in: nameUserIds } });
  const named = auditAreas().filter((area) => area.name.toLowerCase().includes(text.toLowerCase()));
  if (named.length) or.push(areaActionWhere(named.map((area) => area.id)));
  return { OR: or };
}

export function auditIntro(kind: AuditViewKind, areaNames: string[]) {
  if (kind === "company") return { title: "Company activity", detail: "Every recorded change in this company. Choose a team, a person or an area to narrow it." };
  if (kind === "team") return { title: "Your team", detail: "Changes by you, the people who report to you, and the teams you manage." };
  if (kind === "areas") return { title: "Assigned areas", detail: areaNames.length ? `Changes in ${areaNames.join(", ")}.` : "No areas are assigned to you yet." };
  if (kind === "own") return { title: "Your activity", detail: "Changes you recorded. Other people's changes stay hidden." };
  if (kind === "mixed") return { title: "Your audit view", detail: `Your team or your own changes, plus ${areaNames.length ? areaNames.join(", ") : "the areas assigned to you"}.` };
  return { title: "Activity", detail: "Nothing in Audit is open for you yet." };
}

export function echoChangeVisible(input: { company: boolean; team: boolean; own: boolean; areaIds: string[]; userId: string; actorUserId: string | null; action: string }) {
  if (input.company || input.team) return true;
  if (input.own && input.actorUserId === input.userId) return true;
  return input.areaIds.includes(systemForAction(input.action).id);
}

export type AuditReportRow = { at: string; actorName: string; systemName: string; label: string; detail: string };

export function auditReportCsv(rows: AuditReportRow[]) {
  return exportCsv([
    ["When", "Person", "Area", "Change", "Detail"],
    ...rows.map((row) => [row.at, row.actorName, row.systemName, row.label, row.detail]),
  ]);
}
