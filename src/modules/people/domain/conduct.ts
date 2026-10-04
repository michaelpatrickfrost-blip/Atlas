import { dateOnly } from "@/modules/people/domain/working-time";

export const POLICY_CATEGORIES = ["Conduct", "Holidays", "Health and safety", "Pay", "IT", "Workplace", "Other"] as const;
export const PLAN_STATUSES = ["DRAFT", "ACTIVE", "REVIEW", "EXTENDED", "ACHIEVED", "NOT_MET", "CLOSED"] as const;
export const CASE_STAGES = ["INFORMAL", "INVESTIGATION", "HEARING", "FIRST_WARNING", "FINAL_WARNING", "DISMISSAL", "NO_ACTION"] as const;
export const CASE_STATUSES = ["OPEN", "IN_PROGRESS", "DECIDED", "APPEAL", "CLOSED"] as const;
export const EVENT_KINDS = ["NOTE", "MEETING", "WARNING", "APPEAL", "OUTCOME"] as const;

export const PLAN_STATUS_LABEL: Record<(typeof PLAN_STATUSES)[number], string> = {
  DRAFT: "Draft", ACTIVE: "Active", REVIEW: "Review due", EXTENDED: "Extended", ACHIEVED: "Achieved", NOT_MET: "Not met", CLOSED: "Closed",
};
export const CASE_STAGE_LABEL: Record<(typeof CASE_STAGES)[number], string> = {
  INFORMAL: "Informal conversation", INVESTIGATION: "Investigation", HEARING: "Hearing", FIRST_WARNING: "First written warning", FINAL_WARNING: "Final written warning", DISMISSAL: "Dismissal", NO_ACTION: "No further action",
};
export const CASE_STATUS_LABEL: Record<(typeof CASE_STATUSES)[number], string> = {
  OPEN: "Open", IN_PROGRESS: "In progress", DECIDED: "Decided", APPEAL: "Appeal", CLOSED: "Closed",
};
export const EVENT_KIND_LABEL: Record<(typeof EVENT_KINDS)[number], string> = {
  NOTE: "Private note", MEETING: "Meeting", WARNING: "Warning", APPEAL: "Appeal", OUTCOME: "Outcome",
};

export type Objective = { goal: string; measure: string; support: string; by: string };

function required(form: FormData, name: string, label: string, max: number) {
  const value = String(form.get(name) ?? "").trim();
  if (!value) throw new Error(`Enter ${label}.`);
  if (value.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return value;
}
function optional(form: FormData, name: string, label: string, max: number) {
  const value = String(form.get(name) ?? "").trim();
  if (value.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return value || null;
}
export function choice<T extends string>(value: string, allowed: readonly T[], label: string): T {
  if (!(allowed as readonly string[]).includes(value)) throw new Error(`Choose a valid ${label}.`);
  return value as T;
}

export function readObjectives(form: FormData): Objective[] {
  const goals = form.getAll("goal").map(String);
  const measures = form.getAll("measure").map(String);
  const supports = form.getAll("supportItem").map(String);
  const dates = form.getAll("objectiveBy").map(String);
  const rows = goals.map((goal, index) => ({
    goal: goal.trim(),
    measure: (measures[index] ?? "").trim(),
    support: (supports[index] ?? "").trim(),
    by: (dates[index] ?? "").trim(),
  })).filter((row) => row.goal || row.measure || row.support || row.by);
  if (!rows.length || rows.length > 8) throw new Error("Add between 1 and 8 objectives.");
  return rows.map((row) => {
    if (!row.goal || row.goal.length > 300) throw new Error("Each objective needs a goal of 300 characters or fewer.");
    if (!row.measure || row.measure.length > 300) throw new Error("Each objective needs a measure of 300 characters or fewer.");
    if (row.support.length > 300) throw new Error("Support for an objective must be 300 characters or fewer.");
    if (row.by) dateOnly(row.by);
    return row;
  });
}

export function readPlanForm(form: FormData) {
  const startOn = dateOnly(String(form.get("startOn") ?? ""));
  const reviewOn = dateOnly(String(form.get("reviewOn") ?? ""));
  const endOn = dateOnly(String(form.get("endOn") ?? ""));
  if (reviewOn < startOn || endOn < reviewOn) throw new Error("Put the review on or after the start, and the end on or after the review.");
  return {
    employeeId: required(form, "employeeId", "the employee", 80),
    title: required(form, "title", "a plan title", 160),
    reason: required(form, "reason", "why this plan is needed", 4000),
    support: optional(form, "support", "Support from the company", 4000),
    startOn, reviewOn, endOn,
    status: choice(String(form.get("status") ?? "DRAFT"), PLAN_STATUSES, "plan status"),
    objectives: readObjectives(form),
    outcome: optional(form, "outcome", "The outcome", 4000),
  };
}

export function readCaseForm(form: FormData) {
  const hearing = String(form.get("hearingOn") ?? "").trim();
  const appeal = String(form.get("appealBy") ?? "").trim();
  return {
    employeeId: required(form, "employeeId", "the employee", 80),
    planId: String(form.get("planId") ?? "").trim() || null,
    stage: choice(String(form.get("stage") ?? "INFORMAL"), CASE_STAGES, "stage"),
    status: choice(String(form.get("status") ?? "OPEN"), CASE_STATUSES, "status"),
    allegation: required(form, "allegation", "what happened", 4000),
    facts: optional(form, "facts", "The facts", 8000),
    outcome: optional(form, "outcome", "The outcome", 4000),
    sanction: optional(form, "sanction", "The sanction", 1000),
    hearingOn: hearing ? new Date(hearing) : null,
    appealBy: appeal ? dateOnly(appeal) : null,
    confidentialNotes: optional(form, "confidentialNotes", "The confidential note", 8000),
  };
}

export function readEventForm(form: FormData) {
  const kind = choice(String(form.get("kind") ?? ""), EVENT_KINDS, "update type");
  return {
    kind,
    occurredOn: dateOnly(String(form.get("occurredOn") ?? "")),
    summary: required(form, "summary", "a short summary", 300),
    detail: optional(form, "detail", "The detail", 4000),
    shared: kind === "NOTE" ? form.get("shared") === "on" : true,
  };
}
