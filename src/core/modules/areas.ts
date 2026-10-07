/** Where an app sits in the launcher. Presentation only: it grants nothing and
 *  an app that is not listed here still appears, under "More". */
export const APP_AREAS = ["Customers", "Operations", "People", "Business", "More"] as const;
export type AppArea = (typeof APP_AREAS)[number];

const AREA_BY_MODULE: Record<string, AppArea> = {
  crm: "Customers",
  sales: "Customers",
  pricing: "Customers",
  marketing: "Customers",
  service: "Customers",
  products: "Operations",
  stock: "Operations",
  logistics: "Operations",
  planning: "Operations",
  manufacturing: "Operations",
  quality: "Operations",
  safety: "Operations",
  people: "People",
  payroll: "People",
  scheduling: "People",
  teams: "People",
  kpis: "People",
  finance: "Business",
  plan: "Business",
  sop: "Business",
  projects: "Business",
  analytics: "Business",
  audit: "Business",
};

export function areaForModule(moduleId: string): AppArea {
  return AREA_BY_MODULE[moduleId] ?? "More";
}
