import {
  Boxes,
  Wallet,
  Truck,
  Users,
  Banknote,
  FolderKanban,
  Factory,
  LifeBuoy,
  Car,
  Megaphone,
} from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";

/**
 * Realistic shells for future core modules. These are not implemented — they exist
 * so the Apps screen and module dependency model are representative, and so a future
 * agent sees the pattern to follow when building e.g. `atlas-module-stock`. Each stub
 * declares no capabilities, routes or navigation; it only registers identity and
 * dependency metadata. Build one for real by following docs/MODULE_SPEC.md.
 */
function stub(partial: Pick<ModuleManifest, "id" | "name" | "description" | "icon" | "dependencies">): ModuleManifest {
  return {
    ...partial,
    version: "0.0.0",
    minimumCoreVersion: "0.1.0",
    capabilities: [],
    rootPath: `/${partial.id}`,
    accessCapability: `${partial.id}.__unimplemented`,
    navigation: [],
    status: "coming_soon",
  };
}

export const stockStub = stub({ id: "stock", name: "Stock", description: "Products, warehouses, inventory and movements.", icon: Boxes, dependencies: [] });
export const financeStub = stub({ id: "finance", name: "Finance", description: "Invoices, bills, payments and reporting.", icon: Wallet, dependencies: [] });
export const purchasingStub = stub({ id: "purchasing", name: "Purchasing", description: "Suppliers, RFQs, purchase orders and receipts.", icon: Truck, dependencies: ["stock"] });
export const peopleStub = stub({ id: "people", name: "People", description: "Employees, departments, leave and records.", icon: Users, dependencies: [] });
export const payrollStub = stub({ id: "payroll", name: "Payroll", description: "Payroll, deductions and statutory processes.", icon: Banknote, dependencies: ["people"] });
export const projectsStub = stub({ id: "projects", name: "Projects", description: "Projects, tasks, time and profitability.", icon: FolderKanban, dependencies: [] });
export const manufacturingStub = stub({ id: "manufacturing", name: "Manufacturing", description: "BOMs, work centres and production orders.", icon: Factory, dependencies: ["stock"] });
export const serviceStub = stub({ id: "service", name: "Service", description: "Tickets, SLAs and customer support.", icon: LifeBuoy, dependencies: [] });
export const fleetStub = stub({ id: "fleet", name: "Fleet", description: "Vehicles, maintenance and operating records.", icon: Car, dependencies: [] });
export const marketingStub = stub({ id: "marketing", name: "Marketing", description: "Campaigns, audiences and automation.", icon: Megaphone, dependencies: [] });

export const stubModules: ModuleManifest[] = [
  stockStub,
  financeStub,
  purchasingStub,
  peopleStub,
  payrollStub,
  projectsStub,
  manufacturingStub,
  serviceStub,
  fleetStub,
  marketingStub,
];
