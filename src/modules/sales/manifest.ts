import { requestServiceReplacement } from "./services/service-replacement";
import { salesTemplateContext } from "./services/template-context";
import {financeSource} from './services/finance-source';
import { salesAnalytics } from "./services/analytics";
import { planningDemand } from "./services/planning-demand";
import { ShoppingBag } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { salesCustomerOverviewProvider } from "./services/customer-overview";
export const salesManifest: ModuleManifest = {
 serviceOperationProvider:requestServiceReplacement,
 templateContextProvider: salesTemplateContext,salesFinanceSourceProvider:financeSource,
 analyticsProvider: salesAnalytics,
  planningDemandProvider: planningDemand,
 id: "sales", name: "Sales", description: "Orders, quotations, and customer sales processing.",
 icon: ShoppingBag, version: "0.3.0", minimumCoreVersion: "0.1.0", dependencies: [],
 capabilities: Object.values(SALES_CAPABILITIES).filter((c) => c.startsWith("sales.order.") || c.startsWith("sales.quote.") || c.startsWith("sales.site.") || c === SALES_CAPABILITIES.reportRead),
 rootPath: "/sales", accessCapability: SALES_CAPABILITIES.orderRead, status: "available",
 accessAnyOf: [SALES_CAPABILITIES.orderRead, "core.pricing.read"],
 navigation: [
  { label: "All Sales", href: "/sales/documents", capability: SALES_CAPABILITIES.orderRead },
  { label: "All price lists", href: "/sales/price-lists", capability: "core.pricing.read", group: "Price lists" },
  { label: "New price list", href: "/sales/price-lists/new", capability: "core.pricing.manage", group: "Price lists" },
  { label: "Projects", href: "/sales/projects", capability: SALES_CAPABILITIES.opportunityRead },
  { label: "Sites", href: "/sales/sites", capability: SALES_CAPABILITIES.siteRead },
  { label: "Templates", href: "/sales/templates", capability: SALES_CAPABILITIES.orderRead },
  { label: "Reports", href: "/sales/reporting", capability: SALES_CAPABILITIES.reportRead },
 ], customerOverviewProvider: salesCustomerOverviewProvider,
};
