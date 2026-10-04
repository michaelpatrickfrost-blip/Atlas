export const RESOURCE_TYPES = [
  { id: "MACHINE", label: "Machine" },
  { id: "PRODUCTION_LINE", label: "Production line" },
  { id: "LABOUR_TEAM", label: "Labour team" },
  { id: "WORKSTATION", label: "Workstation" },
  { id: "CELL", label: "Cell" },
  { id: "SUBCONTRACT", label: "Subcontract bench" },
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number]["id"];

export function resourceType(value: string): ResourceType {
  const found = RESOURCE_TYPES.find((item) => item.id === value);
  if (!found) throw new Error("Choose what kind of resource this is.");
  return found.id;
}

export function resourceLabel(value: string) {
  return RESOURCE_TYPES.find((item) => item.id === value)?.label ?? "Machine";
}

/** A released work order keeps the machine named on the recipe. A typed work-centre name still matches when no machine was chosen. */
export function releasedAssignment(
  operation: { workCentreId?: string | null; resourceId?: string | null; workCentre?: string | null },
  centresByName: Map<string, string>,
) {
  const named = operation.workCentre?.trim() ? centresByName.get(operation.workCentre.trim().toLowerCase()) ?? null : null;
  return {
    workCentreId: operation.workCentreId || named,
    resourceId: operation.resourceId || null,
  };
}
