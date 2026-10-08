import { ShieldCheck } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { safetyProvider } from "./services/provider";
import { safetyAttention, searchSafety } from "./services/queries";

export const safetyManifest: ModuleManifest = {
  id: "safety",
  name: "Safety",
  description: "Workplace risk, incidents, control of work and assurance.",
  icon: ShieldCheck,
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: ["people"],
  capabilities: Object.values(C),
  rootPath: "/safety",
  accessCapability: C.todayRead,
  status: "available",
  safetyProvider,
  attentionProvider: async ({ session }) => safetyAttention(session),
  searchProvider: async ({ session, query }) => searchSafety(session, query),
  navigation: [
    { label: "Today", href: "/safety", capability: C.todayRead },
    { label: "Risk", href: "/safety/risk", capability: C.riskRead },
    { label: "Workplace", href: "/safety/workplace", capability: C.riskRead },
    { label: "Incidents", href: "/safety/incidents", anyOf: [C.incidentRead, C.incidentReport] },
    { label: "Control", href: "/safety/control", anyOf: [C.permitRequest, C.holdManage, C.isolationApply, C.equipmentRead] },
    { label: "Assurance", href: "/safety/assurance", anyOf: [C.inspectionExecute, C.auditExecute, C.actionRead, C.statutoryManage, C.documentRead, C.competenceRead] },
    { label: "Reports", href: "/safety/reports", capability: C.reportRead },
  ],
};
