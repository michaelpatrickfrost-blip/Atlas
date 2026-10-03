import { Users } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { peopleAttentionProvider } from "./services/attention";

export const peopleManifest: ModuleManifest = {
  id: "people",
  name: "HR",
  description: "Employee records, onboarding, offboarding, appraisals, absence, rotas and payroll.",
  icon: Users,
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: [],
  capabilities: Object.values(HR_CAPABILITIES),
  rootPath: "/people",
  accessCapability: HR_CAPABILITIES.employeeRead,
  status: "available",
  navigation: [
    { label: "Employees", href: "/people", capability: HR_CAPABILITIES.employeeRead },
    { label: "Onboarding", href: "/people/onboarding", capability: HR_CAPABILITIES.onboardingManage },
    { label: "Offboarding", href: "/people/offboarding", capability: HR_CAPABILITIES.offboardingManage },
    { label: "Appraisals", href: "/people/appraisals", capability: HR_CAPABILITIES.appraisalRead },
    { label: "One-to-Ones", href: "/people/one-to-ones", capability: HR_CAPABILITIES.oneToOneRead },
    { label: "Absence", href: "/people/absence", capability: HR_CAPABILITIES.absenceRead },
    { label: "Rotas", href: "/people/rotas", capability: HR_CAPABILITIES.rotaRead },
    { label: "Payroll", href: "/people/payroll", capability: HR_CAPABILITIES.payrollRead },
  ],
  attentionProvider: peopleAttentionProvider,
};
