import { ScrollText } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { AUDIT_AREA_CAPABILITY, AUDIT_OWN_CAPABILITY } from "@/core/audit/access";
import { AUDIT_CAPABILITIES, CORE_CAPABILITIES, ECHO_CAPABILITIES } from "@/core/permissions/capabilities";
import { auditAttention } from "./services/attention";

export const auditManifest: ModuleManifest = {
  id: "audit",
  name: "Audit",
  description: "See recorded changes by area, team or your own activity, and point people at a customer or sale.",
  icon: ScrollText,
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: [],
  capabilities: [...Object.values(AUDIT_CAPABILITIES), ...Object.values(ECHO_CAPABILITIES)],
  rootPath: "/audit",
  accessCapability: ECHO_CAPABILITIES.read,
  accessAnyOf: [ECHO_CAPABILITIES.read, AUDIT_CAPABILITIES.teamRead, CORE_CAPABILITIES.auditRead, AUDIT_AREA_CAPABILITY, AUDIT_OWN_CAPABILITY, CORE_CAPABILITIES.usersManage, CORE_CAPABILITIES.modulesManage],
  status: "available",
  navigation: [
    { label: "Activity", href: "/audit", anyOf: [AUDIT_CAPABILITIES.teamRead, CORE_CAPABILITIES.auditRead, AUDIT_AREA_CAPABILITY, AUDIT_OWN_CAPABILITY] },
    { label: "Access", href: "/audit/access", anyOf: [CORE_CAPABILITIES.usersManage, CORE_CAPABILITIES.modulesManage] },
    { label: "Echo", href: "/audit/echo", capability: ECHO_CAPABILITIES.read },
  ],
  attentionProvider: auditAttention,
};
