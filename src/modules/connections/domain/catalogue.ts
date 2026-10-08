import { SETUP_CATALOGUE, type SetupTemplate } from "@/core/setup/catalogue";

export type ConnectionTemplate = Omit<SetupTemplate, "group"> & { group: string; dependsOn: string[]; behaviour: string };
const dependencies: Record<string, string[]> = {
  contacts: ["customers"], "customer-commercial": ["customers", "price-lists"], prices: ["products", "price-lists"],
  locations: ["warehouses"], "sales-orders": ["customers", "products"], "sales-quotes": ["customers", "products"],
};
export const CONNECTION_TEMPLATES: ConnectionTemplate[] = [
  ...SETUP_CATALOGUE.map(template => ({ ...template,
    group: template.id.startsWith("sales-") ? "Sales" : template.group,
    dependsOn: dependencies[template.id] ?? [],
    behaviour: template.id === "customers" ? "Creates new customer records; existing codes are rejected."
      : template.id.startsWith("sales-") ? "Creates new drafts only; existing references are rejected."
      : "Creates records or updates matching codes. Review the rules before attaching.",
    ...(template.id.startsWith("sales-") ? { summary: "Import customer-linked draft documents with product lines, resolved pricing and tax.", notes: ["Import customers and products first. Documents remain drafts for review in Sales.", "Rows sharing a reference must have the same customer, date and notes. Existing references are rejected.", "Blank references create a separate document per row. Blank prices use customer pricing, including discounts.", "Currency must match the customer's pricing currency. Customer delivery addresses determine UK VAT/export treatment."] } : {}),
  })),
  {
    id: "work-centres", group: "Manufacturing", title: "Work centres", summary: "Production departments and areas that contain your machines.",
    required: ["code", "name"], columns: ["code", "name", "description"], example: ["PACK", "Packing", "Packing and finishing"],
    dependsOn: [], behaviour: "Creates new centres or updates matching codes; existing active status is preserved.",
    notes: ["Use a unique code for each work centre. Import these before machines.", "An existing code updates its name and description without changing its resources or history."],
  },
  {
    id: "machines", group: "Manufacturing", title: "Machines & resources", summary: "Machines, lines, teams and workstations attached to their work centre.",
    required: ["workCentreCode", "name", "type"], columns: ["workCentreCode", "name", "type", "nominalUnitsPerHour", "planningEfficiencyPercent"],
    example: ["PACK", "Packing machine 1", "MACHINE", "120", "85"], dependsOn: ["work-centres"],
    behaviour: "Matches by work centre and exact resource name; ambiguous existing names are rejected.",
    notes: ["Import work centres first. Existing active status and production history are preserved.", "type is MACHINE, PRODUCTION_LINE, LABOUR_TEAM, WORKSTATION, CELL or SUBCONTRACT.", "Capacity is optional and positive; efficiency is greater than zero and up to 100. Blank capacity/efficiency keep existing values (new resources default to 100% efficiency)."],
  },
];
export function connectionTemplate(id: string) { return CONNECTION_TEMPLATES.find(template => template.id === id); }
