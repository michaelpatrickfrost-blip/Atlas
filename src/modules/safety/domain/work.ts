import { DEFAULT_FIVE_BY_FIVE, type RiskMatrixConfig } from "./matrix";

export const CONTROL_HIERARCHY = ["ELIMINATE", "SUBSTITUTE", "ENGINEERING", "ADMINISTRATIVE", "PPE"] as const;
export type ControlHierarchy = (typeof CONTROL_HIERARCHY)[number];

export const CONTROL_LABELS: Record<ControlHierarchy, string> = {
  ELIMINATE: "Eliminate",
  SUBSTITUTE: "Substitute",
  ENGINEERING: "Engineering control",
  ADMINISTRATIVE: "Administrative control",
  PPE: "PPE",
};

export const RISK_CATEGORIES = [
  "Physical", "Mechanical", "Electrical", "Chemical", "Biological", "Ergonomic", "Fire",
  "Work at height", "Manual handling", "Vehicle", "Lifting", "Noise", "Vibration", "DSE",
  "Stress", "Environmental conditions", "Confined space", "Contractor", "Other",
] as const;

export const INCIDENT_KINDS = [
  "INJURY", "ILL_HEALTH", "NEAR_MISS", "DANGEROUS_OCCURRENCE", "PROPERTY_DAMAGE", "EQUIPMENT_DAMAGE",
  "ENVIRONMENTAL", "VEHICLE", "FIRE", "SECURITY", "UNSAFE_CONDITION", "UNSAFE_ACT", "SAFE_OBSERVATION",
  "IMPROVEMENT", "GOOD_CATCH", "HAZARD", "OTHER",
] as const;

export const CONSEQUENCE_LEVELS = ["NONE", "FIRST_AID", "MINOR", "SPECIFIED_INJURY", "OVER_SEVEN_DAY", "FATAL", "MAJOR_DAMAGE", "OTHER"] as const;

export const CAUSE_CATEGORIES = [
  "Equipment failure", "Guarding", "Procedure", "Training", "Supervision", "Maintenance", "Design",
  "Environment", "Workload", "Communication", "Human factors", "Contractor control", "Material",
  "PPE", "Planning", "Change management", "Other",
] as const;

export const INVESTIGATION_METHODS = ["SIMPLE", "FIVE_WHYS", "FISHBONE", "ICAM", "BARRIER"] as const;

export const CAPA_FLOW = ["FINDING", "CORRECTION", "ROOT_CAUSE", "CORRECTIVE", "PREVENTIVE", "VERIFICATION", "EFFECTIVENESS", "CLOSED"] as const;

export const REVIEW_TRIGGERS = [
  "SCHEDULED", "INCIDENT", "NEAR_MISS", "PROCESS_CHANGE", "NEW_EQUIPMENT", "EQUIPMENT_MODIFICATION",
  "NEW_CHEMICAL", "NEW_LOCATION", "PEOPLE_CHANGE", "LEGISLATION", "AUDIT_FINDING", "CONTROL_FAILURE",
] as const;

export const PERMIT_KINDS = [
  "HOT_WORK", "CONFINED_SPACE", "ELECTRICAL", "WORK_AT_HEIGHT", "EXCAVATION", "ROOF", "LIFTING",
  "BREAKING_CONTAINMENT", "LINE_OPENING", "HIGH_RISK", "CUSTOM",
] as const;

export const PERMIT_FLOW = [
  "REQUESTED", "RISK_REVIEWED", "CONTROLS_CONFIRMED", "ISOLATION_CONFIRMED", "AUTHORISED",
  "IN_PROGRESS", "SUSPENDED", "WORK_COMPLETE", "AREA_INSPECTED", "HANDED_BACK", "CLOSED", "EXPIRED",
] as const;

export const ENERGY_TYPES = ["ELECTRICAL", "HYDRAULIC", "PNEUMATIC", "MECHANICAL", "THERMAL", "GRAVITY", "CHEMICAL", "PRESSURE", "STORED", "OTHER"] as const;

export const RECORD_KINDS = [
  "DYNAMIC_ASSESSMENT", "METHOD_STATEMENT", "LIFTING_PLAN", "PPE_REQUIREMENT", "PPE_ISSUE", "RPE",
  "DSE_ASSESSMENT", "FIRE_ASSESSMENT", "FIRE_DRILL", "EMERGENCY_PLAN", "PEEP", "FIRST_AID_NEED",
  "FIRST_AIDER", "FIRST_AID_KIT", "TOOLBOX_TALK", "BRIEFING", "INDUCTION", "CONTRACTOR_PROFILE",
  "LONE_WORK", "HEALTH_REQUIREMENT", "NOISE", "VIBRATION", "EXPOSURE", "ASBESTOS", "LEGIONELLA",
  "MANUAL_HANDLING", "WORK_AT_HEIGHT", "VISITOR", "EMERGENCY_EVENT",
] as const;

export const SENSITIVE_RECORD_KINDS = new Set(["PEEP", "HEALTH_REQUIREMENT"]);

export const PROFILE_FEATURES: Record<string, { label: string; features: string[] }> = {
  OFFICE: { label: "Office", features: ["risk", "incidents", "dse", "fire", "first_aid", "inspections", "training"] },
  WAREHOUSE: { label: "Warehouse", features: ["risk", "incidents", "inspections", "training", "fire", "first_aid", "loler", "manual_handling", "vehicles", "permits", "ppe"] },
  MANUFACTURING: { label: "Manufacturing", features: ["risk", "incidents", "inspections", "audits", "training", "fire", "first_aid", "coshh", "puwer", "loler", "permits", "isolation", "ppe", "noise", "vibration", "health_surveillance", "contractors", "emergency", "toolbox", "manual_handling", "work_at_height"] },
  FIELD: { label: "Construction and field", features: ["risk", "incidents", "inspections", "training", "permits", "work_at_height", "contractors", "lone_working", "emergency", "first_aid"] },
};

const PERMIT_NEXT: Record<string, string[]> = {
  REQUESTED: ["RISK_REVIEWED"],
  RISK_REVIEWED: ["CONTROLS_CONFIRMED"],
  CONTROLS_CONFIRMED: ["ISOLATION_CONFIRMED", "AUTHORISED"],
  ISOLATION_CONFIRMED: ["AUTHORISED"],
  AUTHORISED: ["IN_PROGRESS", "SUSPENDED"],
  IN_PROGRESS: ["SUSPENDED", "WORK_COMPLETE"],
  SUSPENDED: ["IN_PROGRESS", "CLOSED"],
  WORK_COMPLETE: ["AREA_INSPECTED"],
  AREA_INSPECTED: ["HANDED_BACK"],
  HANDED_BACK: ["CLOSED"],
  CLOSED: [],
  EXPIRED: ["CLOSED"],
};

export function permitTransition(from: string, to: string, isolationRequired: boolean): boolean {
  if (from === "CONTROLS_CONFIRMED" && to === "AUTHORISED" && isolationRequired) return false;
  if (from === "CONTROLS_CONFIRMED" && to === "ISOLATION_CONFIRMED" && !isolationRequired) return false;
  return PERMIT_NEXT[from]?.includes(to) ?? false;
}

const LIVE_PERMIT = new Set(["AUTHORISED", "IN_PROGRESS", "SUSPENDED"]);

export function displayedPermitStatus(status: string, expiresAt: Date | null, now: Date): string {
  if (LIVE_PERMIT.has(status) && expiresAt && expiresAt.getTime() <= now.getTime()) return "EXPIRED";
  return status;
}

export function permitConflictHint(kinds: string[]): string | null {
  const present = new Set(kinds);
  if (present.has("HOT_WORK") && (present.has("BREAKING_CONTAINMENT") || present.has("LINE_OPENING") || present.has("CONFINED_SPACE"))) {
    return "Hot work is active beside work that may release a flammable or confined-space hazard. This is an additional check, not a guarantee that the jobs conflict or that they are safe.";
  }
  return null;
}

export function canReleaseHold(hold: { repairComplete: boolean; inspectionComplete: boolean; safetyVerified: boolean }): { ok: boolean; reason?: string } {
  if (hold.repairComplete && hold.inspectionComplete && hold.safetyVerified) return { ok: true };
  return { ok: false, reason: "Return to service needs the repair, the inspection and a safety verification. Completing maintenance does not clear the hold." };
}

export function canOverrideControl(input: { who: string; why: string; scope: string; approvedBy: string; expiresAt: Date; now: Date }): { ok: boolean; reason?: string } {
  if (!input.who.trim() || !input.why.trim() || !input.scope.trim() || !input.approvedBy.trim()) {
    return { ok: false, reason: "An override records who, why, scope and who approved it." };
  }
  if (input.expiresAt.getTime() <= input.now.getTime()) return { ok: false, reason: "An override has to expire. It cannot stay open." };
  return { ok: true };
}

export function nextCapa(stage: string): string | null {
  const index = CAPA_FLOW.indexOf(stage as (typeof CAPA_FLOW)[number]);
  if (index < 0 || index >= CAPA_FLOW.length - 1) return null;
  return CAPA_FLOW[index + 1];
}

export function suggestedInvestigationDepth(actual: string, potential: string): "SIMPLE" | "STRUCTURED" {
  const serious = new Set(["SPECIFIED_INJURY", "OVER_SEVEN_DAY", "FATAL", "MAJOR_DAMAGE"]);
  return serious.has(actual) || serious.has(potential) ? "STRUCTURED" : "SIMPLE";
}

export function authoriseCompetence(
  requiredKey: string | null,
  grants: Array<{ key: string; expiresAt: Date | null }>,
  now: Date,
): { authorised: boolean; reason?: string; expiredOn?: string } {
  if (!requiredKey) return { authorised: true };
  const grant = grants.find((item) => item.key === requiredKey);
  if (!grant) return { authorised: false, reason: `${requiredKey} competence is not recorded. A job title is not treated as competence.` };
  if (grant.expiresAt && grant.expiresAt.getTime() < now.getTime()) {
    const expiredOn = grant.expiresAt.toISOString().slice(0, 10);
    return { authorised: false, reason: `${requiredKey} competence expired on ${expiredOn}.`, expiredOn };
  }
  return { authorised: true };
}

export function storageIncompatibility(left: string[], right: string[], rules: Array<{ a: string; b: string; note: string }>): string | null {
  for (const rule of rules) {
    const clash = (left.includes(rule.a) && right.includes(rule.b)) || (left.includes(rule.b) && right.includes(rule.a));
    if (clash) return rule.note;
  }
  return null;
}

export function incidentRate(count: number, exposure: number | null, basis: "hours" | "people"): string | null {
  if (exposure == null || exposure <= 0) return null;
  const scaled = basis === "hours" ? (count / exposure) * 100_000 : (count / exposure) * 100;
  return basis === "hours" ? `${scaled.toFixed(2)} per 100,000 hours` : `${scaled.toFixed(2)} per 100 people`;
}

export function describeIncidentMovement(previous: number, current: number, slices: Array<{ label: string; count: number }>): string[] {
  const lines = [`Incidents moved from ${previous} to ${current}.`];
  for (const slice of slices) if (slice.count > 0) lines.push(`${slice.count} of ${current} involved ${slice.label}.`);
  lines.push("These are counts from the records. They are not a conclusion about why the numbers changed.");
  return lines;
}

export function asbestosMessage(hasRecord: boolean): string {
  if (!hasRecord) return "No asbestos information is recorded for this area. That is not a statement that the area is asbestos-free.";
  return "Asbestos information exists for this area. Review the register before work starts.";
}

export function coverageGap(required: number, scheduledQualified: number): string | null {
  if (scheduledQualified >= required) return null;
  return `${scheduledQualified} qualified first aider${scheduledQualified === 1 ? " is" : "s are"} scheduled. The requirement is ${required}.`;
}

export function puwerOverall(results: Record<string, string>): "SAFE_FOR_USE" | "RESTRICTED" | "UNSAFE_FOR_USE" {
  const values = Object.values(results);
  if (values.some((value) => value === "FAIL")) return "UNSAFE_FOR_USE";
  if (!values.length || values.some((value) => value !== "PASS" && value !== "N/A")) return "RESTRICTED";
  return "SAFE_FOR_USE";
}

export const PUWER_CHECKS = [
  ["suitability", "Suitability"],
  ["guarding", "Guarding"],
  ["controls", "Controls"],
  ["emergencyStop", "Emergency stop"],
  ["isolation", "Isolation"],
  ["interlocks", "Interlocks"],
  ["stability", "Stability"],
  ["instructions", "Information and instructions"],
  ["competence", "Operator competence"],
] as const;

export function commitmentLabel(state: "COMMITTED" | "PENDING"): string {
  return state === "COMMITTED" ? "Saved on the server" : "Not saved on the server yet. Do not treat this as a completed safety record.";
}

export function failedInspectionEffects(onFail: string[]): Array<"action" | "defect" | "hold" | "maintenance" | "risk_review" | "escalate" | "photo"> {
  const allowed = new Set(["action", "defect", "hold", "maintenance", "risk_review", "escalate", "photo"]);
  return onFail.filter((item): item is "action" | "defect" | "hold" | "maintenance" | "risk_review" | "escalate" | "photo" => allowed.has(item));
}

export function parseMatrix(value: unknown): RiskMatrixConfig {
  const matrix = value as RiskMatrixConfig;
  if (!matrix || !Array.isArray(matrix.bands)) return { ...DEFAULT_FIVE_BY_FIVE, bands: DEFAULT_FIVE_BY_FIVE.bands.map((band) => ({ ...band })) };
  return matrix;
}

export function featureOn(features: string[], feature: string): boolean {
  return features.includes(feature);
}
