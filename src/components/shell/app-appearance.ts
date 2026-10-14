import type { CSSProperties } from "react";
import { accentColorForModule, type AccentColor } from "@/core/shared/module-colors";

/** Presentation only. App availability and destinations still come from the registry. */
const APP_TONES: Record<string, AccentColor> = {
  customers: "blue", crm: "violet", sales: "blue", marketing: "rose",
  service: "teal", tickets: "indigo", csat: "rose", manufacturing: "teal",
  products: "teal", stock: "teal", planning: "teal", logistics: "blue",
  quality: "indigo", safety: "amber", engineering: "indigo", maintenance: "amber",
  fleet: "blue", fieldservice: "teal", people: "violet", payroll: "teal",
  scheduling: "rose", teams: "indigo", kpis: "amber", projects: "violet",
  plan: "indigo", sop: "teal", finance: "teal", analytics: "blue", reports: "blue",
  templates: "violet", studio: "violet", "design-studio": "violet",
  automations: "amber", meetings: "rose", audit: "indigo", guides: "teal",
  settings: "indigo", apps: "blue", "my-work": "violet", profile: "violet",
};

export function appAppearance(appId: string): CSSProperties {
  const tone = APP_TONES[appId] ?? accentColorForModule(appId);
  return {
    "--app-accent": `var(--color-accent-${tone})`,
    "--app-tint": `var(--color-accent-${tone}-soft)`,
  } as CSSProperties;
}
