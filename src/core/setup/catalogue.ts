export type SetupTemplate = {
  id: string;
  group: "Customers" | "Catalogue & pricing" | "Stock" | "People";
  title: string;
  summary: string;
  required: string[];
  columns: string[];
  example: string[];
  notes: string[];
};

export const SETUP_CATALOGUE: SetupTemplate[] = [
  {
    id: "customers",
    group: "Customers",
    title: "Customers & hierarchy",
    summary: "Groups, customers and branches, with billing and delivery addresses.",
    required: ["customerCode", "name"],
    columns: ["customerCode", "name", "tradingName", "parentCustomerCode", "hierarchyRole", "customerGroup", "status", "currency", "industry", "website", "country", "billingLine1", "billingCity", "billingPostcode", "deliveryLine1", "deliveryCity", "deliveryPostcode"],
    example: ["C-100", "Example Group", "Example Trading", "", "GROUP", "Wholesale", "ACTIVE", "GBP", "Food", "https://example.com", "GB", "1 Example Street", "London", "SW1A 1AA", "2 Example Road", "London", "SW1A 1AB"],
    notes: [
      "Creates new customers. An existing customer code is rejected so this file cannot overwrite a live account.",
      "hierarchyRole is GROUP, CUSTOMER or BRANCH. Leave it blank for CUSTOMER.",
      "parentCustomerCode must already exist in the company or earlier in this file. Do not create a loop.",
      "status is ACTIVE, PROSPECT, ON_HOLD or INACTIVE. Atlas owners default a blank status to ACTIVE.",
    ],
  },
  {
    id: "contacts",
    group: "Customers",
    title: "Customer contacts",
    summary: "People at each customer. Match them by customer code.",
    required: ["customerCode", "firstName", "surname"],
    columns: ["customerCode", "firstName", "surname", "jobTitle", "department", "email", "phone", "mobile", "isPrimary"],
    example: ["C-100", "Ada", "North", "Buyer", "Purchasing", "ada@example.com", "02079460000", "", "yes"],
    notes: [
      "Import customers first.",
      "The same customer code and email updates that contact. Without an email, the same first and last name is updated.",
      "Only one row per customer can be the primary contact. isPrimary is yes or no.",
    ],
  },
  {
    id: "customer-commercial",
    group: "Customers",
    title: "Customer trading setup",
    summary: "Default pricelist, purchase-order rules and delivery preferences.",
    required: ["customerCode"],
    columns: ["customerCode", "priceListKey", "customerPoRequired", "orderReferenceRequired", "partialShipmentAllowed", "backordersAllowed", "deliveryMethod", "shippingTerms"],
    example: ["C-100", "WHOLESALE", "yes", "no", "yes", "yes", "Delivery", "DAP"],
    notes: [
      "Import customers and price lists first.",
      "priceListKey is the list key, such as WHOLESALE, not the list name.",
      "Yes/no fields left blank keep the current value on an existing setup, or the Atlas default on a new one.",
    ],
  },
  {
    id: "products",
    group: "Catalogue & pricing",
    title: "Products & services",
    summary: "Shared catalogue codes, standard price and tax category.",
    required: ["code", "name", "kind", "price", "currency", "taxCategory"],
    columns: ["code", "name", "kind", "unit", "price", "currency", "taxCategory"],
    example: ["SKU-100", "Example product", "PRODUCT", "each", "25.00", "GBP", "STANDARD"],
    notes: [
      "kind is PRODUCT, SERVICE or CHARGE.",
      "taxCategory is STANDARD, ZERO_RATED or EXEMPT.",
      "An existing product code is updated. This does not replace recipes, stock or customer-specific codes.",
    ],
  },
  {
    id: "price-lists",
    group: "Catalogue & pricing",
    title: "Price lists",
    summary: "Named lists such as wholesale or export, each with one currency.",
    required: ["key", "name", "currency"],
    columns: ["key", "name", "currency"],
    example: ["WHOLESALE", "Wholesale", "GBP"],
    notes: [
      "key is a short code used by later files: letters, numbers and hyphens, up to 31 characters.",
      "An existing key updates the list name and currency. That currency is the sales currency for quotes and orders on the list. It does not delete prices already on the list.",
    ],
  },
  {
    id: "prices",
    group: "Catalogue & pricing",
    title: "Price list prices",
    summary: "Product prices, discounts, quantity breaks and optional validity dates.",
    required: ["priceListKey", "productCode", "minimumQuantity", "unitPrice"],
    columns: ["priceListKey", "productCode", "minimumQuantity", "unitPrice", "discount", "validFrom", "validTo"],
    example: ["WHOLESALE", "SKU-100", "1", "22.50", "10", "", ""],
    notes: [
      "Import products and price lists first.",
      "The price list currency is the sales currency for quotes and orders that use it.",
      "discount is optional, from 0 to 100, and comes off the set price. Leave it blank to keep a discount already saved.",
      "minimumQuantity is a whole number of 1 or more. A second row with a higher quantity is a quantity break.",
      "Dates are YYYY-MM-DD. Leave them blank for a price with no end date.",
    ],
  },
  {
    id: "warehouses",
    group: "Stock",
    title: "Warehouses",
    summary: "Sites that hold stock.",
    required: ["code", "name"],
    columns: ["code", "name"],
    example: ["MAIN", "Main warehouse"],
    notes: ["An existing warehouse code updates the name. Stock balances are not changed."],
  },
  {
    id: "locations",
    group: "Stock",
    title: "Stock locations",
    summary: "Bins and areas inside a warehouse.",
    required: ["warehouseCode", "code", "name"],
    columns: ["warehouseCode", "parentLocationCode", "code", "name"],
    example: ["MAIN", "", "A-01", "Aisle A"],
    notes: [
      "Import warehouses first.",
      "parentLocationCode is another location in the same warehouse, or blank for a top-level location.",
      "An existing location code in that warehouse updates the name and parent.",
    ],
  },
  {
    id: "employees",
    group: "People",
    title: "People",
    summary: "Employee records, departments and line managers.",
    required: ["employeeNumber", "firstName", "lastName", "email", "jobTitle", "startDate"],
    columns: ["employeeNumber", "firstName", "lastName", "email", "jobTitle", "department", "employmentType", "startDate", "annualSalary", "currency", "phone", "managerEmployeeNumber"],
    example: ["EMP-100", "Sam", "Ellis", "sam@example.com", "Warehouse lead", "Operations", "FULL_TIME", "2026-04-01", "32000", "GBP", "", ""],
    notes: [
      "New people start onboarding and receive the standard checklist, first appraisal and first one-to-one.",
      "employmentType is FULL_TIME, PART_TIME, FIXED_TERM, CONTRACTOR or APPRENTICE.",
      "annualSalary is yearly pay in major units, such as 32000. Leave it blank to leave pay unset.",
      "An existing employee number updates the job details and does not add another checklist.",
    ],
  },
];

export const SETUP_ORDER = ["customers", "contacts", "products", "price-lists", "prices", "customer-commercial", "warehouses", "locations", "employees"];

export function setupTemplate(id: string) {
  return SETUP_CATALOGUE.find((template) => template.id === id);
}

export function templateCsvRows(id: string) {
  const template = setupTemplate(id);
  if (!template) return null;
  return [template.columns, template.example];
}
