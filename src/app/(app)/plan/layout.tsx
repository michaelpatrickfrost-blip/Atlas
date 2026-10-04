import type { ReactNode } from "react";
import { ModuleSpace } from "@/components/shell/module-space";
import { planManifest } from "@/modules/plan/manifest";

export default function Layout({ children }: { children: ReactNode }) {
  return <ModuleSpace module={planManifest} wide chrome="quiet">{children}</ModuleSpace>;
}
