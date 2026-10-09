import { Banknote } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { PAYROLL_CAPABILITIES } from "@/core/permissions/capabilities";
import { payrollReadinessProvider } from "./services/preparation";

export const payrollManifest: ModuleManifest = {
  payrollReadinessProvider,
  id: "payroll",
  name: "Payroll",
  description: "UK payroll preparation, approved time, reviewed pay inputs, gross-to-net calculations and controlled payroll runs.",
  icon: Banknote,
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: ["people", "scheduling"],
  capabilities: Object.values(PAYROLL_CAPABILITIES),
  rootPath: "/payroll",
  accessCapability: "core.profile.self",
  status: "available",
  navigation: [
    { label: "Employee pay setup", href: "/payroll/employees", capability: PAYROLL_CAPABILITIES.employeeManage },
    { label: "Prepare payroll", href: "/payroll/prepare", capability: PAYROLL_CAPABILITIES.runRead },
    { label: "Payroll runs", href: "/payroll", capability: PAYROLL_CAPABILITIES.runRead },
    { label: "Settings", href: "/payroll/settings", capability: PAYROLL_CAPABILITIES.settingsManage },
  ],
};
