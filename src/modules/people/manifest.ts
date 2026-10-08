import { peopleBusinessPlanning } from "./services/business-planning";
import {getApprovedExpenseSource} from './services/finance-expenses';
import { staffRosterProvider } from "./services/staff-roster";
import { peopleAnalytics } from "./services/analytics";
import { Users } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { CORE_CAPABILITIES, HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { peopleAttentionProvider } from "./services/attention";

export const peopleManifest: ModuleManifest = {
 businessPlanningProvider: peopleBusinessPlanning,
 expensePostingSourceProvider:getApprovedExpenseSource,
 staffRosterProvider,
 analyticsProvider: peopleAnalytics,
  id: "people",
  name: "HR",
  description: "People operations, recruitment, employee records, learning, documents, leave and performance.",
  icon: Users,
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: [],
  capabilities: Object.values(HR_CAPABILITIES),
  rootPath: "/people",
  accessCapability: "core.profile.self",
  status: "available",
  navigation: [
    { label: "HR home", href: "/people/workspace", capability: HR_CAPABILITIES.employeeRead },
    { label: "My HR", href: "/people/me" },
    { label: "My learning", href: "/people/my-learning", group: "My work" },
    { label: "Holidays", href: "/people/holidays", anyOf: [HR_CAPABILITIES.holidaySelf, HR_CAPABILITIES.absenceManage, HR_CAPABILITIES.employeeManage], group: "My work" },
    { label: "Timesheets", href: "/people/timesheets", group: "My work" },
    { label: "Expenses", href: "/people/expenses", capability: HR_CAPABILITIES.expenseRead, group: "My work" },
    { label: "Employees", href: "/people/directory", capability: HR_CAPABILITIES.employeeRead, group: "People" },
    { label: "My Team", href: "/people/my-team", capability: HR_CAPABILITIES.teamManage, group: "People" },
    { label: "Recruitment", href: "/people/recruitment", capability: HR_CAPABILITIES.employeeManage, group: "People" },
    { label: "Documents", href: "/people/documents", capability: HR_CAPABILITIES.employeeRead, group: "People" },
    { label: "Training & qualifications", href: "/people/training", capability: HR_CAPABILITIES.employeeRead, group: "Performance" },
    { label: "Reports", href: "/people/reports", capability: HR_CAPABILITIES.employeeRead, group: "People" },
    { label: "Onboarding", href: "/people/onboarding", capability: HR_CAPABILITIES.onboardingManage, group: "People" },
    { label: "Offboarding", href: "/people/offboarding", capability: HR_CAPABILITIES.offboardingManage, group: "People" },
    { label: "Appraisals", href: "/people/appraisals", capability: HR_CAPABILITIES.appraisalRead, group: "Performance" },
    { label: "One-to-Ones", href: "/people/one-to-ones", capability: HR_CAPABILITIES.oneToOneRead, group: "Performance" },
    { label: "Conduct", href: "/people/conduct", anyOf: [HR_CAPABILITIES.conductRead, HR_CAPABILITIES.conductManage], group: "Performance" },
    { label: "Absence", href: "/people/absence", capability: HR_CAPABILITIES.absenceRead, group: "Pay & policy" },
    { label: "Policies", href: "/people/policies", anyOf: [HR_CAPABILITIES.policyRead, HR_CAPABILITIES.policyManage, HR_CAPABILITIES.employeeManage], group: "Pay & policy" },
    { label: "Settings", href: "/people/settings", anyOf: [CORE_CAPABILITIES.modulesManage, HR_CAPABILITIES.employeeManage, HR_CAPABILITIES.appraisalManage, HR_CAPABILITIES.oneToOneManage], group: "Pay & policy" },
  ],
  attentionProvider: peopleAttentionProvider,
};
