import { ShoppingBag } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { salesCustomerOverviewProvider } from "./services/customer-overview";
export const salesManifest: ModuleManifest = {
 id: "sales", name: "Sales", description: "Quotations and customer order processing.",
 icon: ShoppingBag, version: "0.3.0", minimumCoreVersion: "0.1.0", dependencies: [],
 capabilities: Object.values(SALES_CAPABILITIES).filter((c) => c.startsWith("sales.order.") || c.startsWith("sales.quote.") || c === SALES_CAPABILITIES.reportRead),
 rootPath: "/sales/orders", accessCapability: SALES_CAPABILITIES.orderRead, status: "available",
 navigation: [
  { label: "Orders", href: "/sales/orders", capability: SALES_CAPABILITIES.orderRead },
  { label: "Quotations", href: "/sales/quotes", capability: SALES_CAPABILITIES.quoteRead },
  { label: "Customers", href: "/customers", capability: "customers.read" },
  { label: "Reporting", href: "/sales/reporting", capability: SALES_CAPABILITIES.reportRead },
  { label: "Products", href: "/stock/products", capability: "core.products.read" },
  { label: "Pricelists", href: "/pricing", capability: "core.pricing.read" },
  { label: "Audit", href: "/sales/audit", capability: "core.audit.read" },
 ], customerOverviewProvider: salesCustomerOverviewProvider,
};
