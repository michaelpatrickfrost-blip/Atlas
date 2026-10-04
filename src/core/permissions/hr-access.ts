import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";
import { can } from "@/core/permissions/check";
import type { Session } from "@/core/auth/session";
import type { AccessGroup } from "@/core/permissions/access-levels";

/** Separate HR slices so Read on policies does not also open payroll or conduct. */
export function hrAccessGroups(): AccessGroup[] {
  return [
    { id: "people-holidays", name: "HR — own holidays", capabilities: [HR.holidaySelf] },
    { id: "people-policies", name: "HR — company policies", capabilities: [HR.policyRead, HR.policyManage] },
    { id: "people-records", name: "HR — employee records", capabilities: [HR.employeeRead, HR.employeeManage, HR.teamManage, HR.onboardingManage, HR.offboardingManage] },
    { id: "people-reviews", name: "HR — appraisals and one-to-ones", capabilities: [HR.appraisalRead, HR.appraisalManage, HR.oneToOneRead, HR.oneToOneManage] },
    { id: "people-absence", name: "HR — absence records", capabilities: [HR.absenceRead, HR.absenceManage] },
    { id: "people-rotas", name: "HR — rotas", capabilities: [HR.rotaRead, HR.rotaManage] },
    { id: "people-pay", name: "HR — expenses", capabilities: [HR.expenseRead, HR.expenseApprove] },
    { id: "people-conduct", name: "HR — performance plans and disciplinary", capabilities: [HR.conductRead, HR.conductManage] },
  ];
}

export function canRequestOwnHoliday(session: Session) {
  return can(session, HR.holidaySelf) || can(session, HR.absenceManage) || can(session, HR.employeeManage);
}

export function canReadPolicies(session: Session) {
  return can(session, HR.policyRead) || can(session, HR.policyManage) || can(session, HR.employeeManage);
}

/** Audiences this person may see. HR-only documents stay with HR. */
export function policyAudiences(session: Session) {
  if (can(session, HR.policyManage) || can(session, HR.employeeManage)) return ["EVERYONE", "MANAGERS", "HR"] as const;
  if (can(session, HR.teamManage) || can(session, HR.employeeRead) || can(session, HR.conductRead) || can(session, HR.conductManage)) return ["EVERYONE", "MANAGERS"] as const;
  return ["EVERYONE"] as const;
}
