/** Workflow policy is deterministic; business records remain in the shared server database. */
export function boundedNumber(value: FormDataEntryValue | null, label: string, min: number, max: number, integer = false): number {
  const number = Number(value);
  if (value === null || String(value).trim() === "" || !Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
    throw new Error(`${label} must be ${integer ? "a whole number " : ""}between ${min} and ${max}.`);
  }
  return number;
}

export function taskDeadline(anchor: Date, category: string, phase: "ONBOARDING" | "OFFBOARDING", title: string): Date {
  const offset = phase === "OFFBOARDING" ? 0 : title.includes("30-day") ? 30 : category === "Training" ? 7 : ["IT", "Documentation", "Compliance", "Payroll", "Facilities"].includes(category) ? -1 : 0;
  const date = new Date(anchor);
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

const transitions: Record<string, string[]> = {
  ONBOARDING: ["ACTIVE", "OFFBOARDING"], ACTIVE: ["ON_LEAVE", "OFFBOARDING"],
  ON_LEAVE: ["ACTIVE", "OFFBOARDING"], OFFBOARDING: ["ACTIVE", "LEFT"], LEFT: [],
};
export function validateEmployeeTransition(from: string, to: string, openTasks: number) {
  if (from === to) return;
  if (!transitions[from]?.includes(to)) throw new Error(`Cannot change ${from.replaceAll("_", " ")} to ${to.replaceAll("_", " ")}.`);
  if ((from === "ONBOARDING" && to === "ACTIVE" || to === "LEFT") && openTasks > 0) {
    throw new Error(`Complete the ${openTasks} outstanding checklist tasks before changing status.`);
  }
}
