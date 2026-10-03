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

/** Customer Master — the canonical customer identity, owned by Core (every
 *  module depends on it; it is not an installable module). See
 *  docs/CUSTOMER_MASTER.md. Sensitive sections (credit, tax, bank) have their
 *  own read/manage capabilities so a salesperson's role need not grant them. */
export const CUSTOMER_CAPABILITIES = {
  read: "customers.read",
  create: "customers.create",
  edit: "customers.edit",
  archive: "customers.archive",

  contactsManage: "customers.contacts.manage",
  addressesManage: "customers.addresses.manage",

  commercialRead: "customers.commercial.read",
  commercialManage: "customers.commercial.manage",

  creditRead: "customers.credit.read",
  creditManage: "customers.credit.manage",

  taxRead: "customers.tax.read",
  taxManage: "customers.tax.manage",

  bankRead: "customers.bank.read",
  bankReveal: "customers.bank.reveal",
  bankManage: "customers.bank.manage",

  documentsRead: "customers.documents.read",
  documentsManage: "customers.documents.manage",

  restrictedNotesRead: "customers.restricted_notes.read",
  restrictedNotesManage: "customers.restricted_notes.manage",
} as const;

export const SALES_CAPABILITIES = {
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
      ...Object.values(CUSTOMER_CAPABILITIES),
      ...Object.values(SALES_CAPABILITIES),
    ],
  },
  {
    key: "sales_user",
    name: "Sales User",
    capabilities: [
      CUSTOMER_CAPABILITIES.read,
      CUSTOMER_CAPABILITIES.create,
      CUSTOMER_CAPABILITIES.edit,
      CUSTOMER_CAPABILITIES.contactsManage,
      CUSTOMER_CAPABILITIES.addressesManage,
      CUSTOMER_CAPABILITIES.commercialRead,
      CUSTOMER_CAPABILITIES.creditRead,
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
      CUSTOMER_CAPABILITIES.read,
      CUSTOMER_CAPABILITIES.create,
      CUSTOMER_CAPABILITIES.edit,
      CUSTOMER_CAPABILITIES.archive,
      CUSTOMER_CAPABILITIES.contactsManage,
      CUSTOMER_CAPABILITIES.addressesManage,
      CUSTOMER_CAPABILITIES.commercialRead,
      CUSTOMER_CAPABILITIES.commercialManage,
      CUSTOMER_CAPABILITIES.creditRead,
      SALES_CAPABILITIES.opportunityRead,
      SALES_CAPABILITIES.opportunityManage,
      SALES_CAPABILITIES.quoteRead,
      SALES_CAPABILITIES.quoteCreate,
      SALES_CAPABILITIES.quoteApprove,
      SALES_CAPABILITIES.orderRead,
      SALES_CAPABILITIES.orderManage,
    ],
  },
  {
    key: "finance_manager",
    name: "Finance Manager",
    capabilities: [
      CUSTOMER_CAPABILITIES.read,
      CUSTOMER_CAPABILITIES.commercialRead,
      CUSTOMER_CAPABILITIES.creditRead,
      CUSTOMER_CAPABILITIES.creditManage,
      CUSTOMER_CAPABILITIES.taxRead,
      CUSTOMER_CAPABILITIES.taxManage,
      CUSTOMER_CAPABILITIES.bankRead,
      CUSTOMER_CAPABILITIES.bankReveal,
      CUSTOMER_CAPABILITIES.bankManage,
      CUSTOMER_CAPABILITIES.documentsRead,
      CUSTOMER_CAPABILITIES.documentsManage,
    ],
  },
];
