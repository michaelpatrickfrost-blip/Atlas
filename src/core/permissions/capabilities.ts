/**
 * Capability strings follow `<module>.<entity>.<action>`. Core capabilities use
 * the `core` module namespace. Capabilities are declared by module manifests
 * (see src/core/modules/registry.ts) and granted to roles — never checked by
 * hardcoded role name in application code. See docs/PERMISSIONS.md.
 */

export const CORE_CAPABILITIES = {
  modulesManage: "core.modules.manage",
  usersManage: "core.users.manage",
  rolesManage: "core.roles.manage",
} as const;

export const SALES_CAPABILITIES = {
  customerRead: "sales.customer.read",
  customerManage: "sales.customer.manage",
  opportunityRead: "sales.opportunity.read",
  opportunityManage: "sales.opportunity.manage",
  quoteRead: "sales.quote.read",
  quoteCreate: "sales.quote.create",
  quoteApprove: "sales.quote.approve",
  orderRead: "sales.order.read",
  orderManage: "sales.order.manage",
} as const;

/** Standard roles seeded for every new organisation. Orgs may edit/add roles later. */
export const STANDARD_ROLES: Array<{ key: string; name: string; capabilities: string[] }> = [
  {
    key: "admin",
    name: "Administrator",
    capabilities: [
      ...Object.values(CORE_CAPABILITIES),
      ...Object.values(SALES_CAPABILITIES),
    ],
  },
  {
    key: "sales_user",
    name: "Sales User",
    capabilities: [
      SALES_CAPABILITIES.customerRead,
      SALES_CAPABILITIES.opportunityRead,
      SALES_CAPABILITIES.opportunityManage,
      SALES_CAPABILITIES.quoteRead,
      SALES_CAPABILITIES.quoteCreate,
      SALES_CAPABILITIES.orderRead,
    ],
  },
  {
    key: "sales_manager",
    name: "Sales Manager",
    capabilities: [
      SALES_CAPABILITIES.customerRead,
      SALES_CAPABILITIES.customerManage,
      SALES_CAPABILITIES.opportunityRead,
      SALES_CAPABILITIES.opportunityManage,
      SALES_CAPABILITIES.quoteRead,
      SALES_CAPABILITIES.quoteCreate,
      SALES_CAPABILITIES.quoteApprove,
      SALES_CAPABILITIES.orderRead,
      SALES_CAPABILITIES.orderManage,
    ],
  },
];
