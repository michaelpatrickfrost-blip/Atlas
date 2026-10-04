import { ModuleSpace } from "@/components/shell/module-space";
import { auditManifest } from "@/modules/audit/manifest";

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return <ModuleSpace module={auditManifest} wide>{children}</ModuleSpace>;
}
