import { addQuantity, quantity } from "@/core/shared/quantity";
import { componentQuantity, measuredQuantity } from "@/core/shared/measurement";
export type LoadMember = { id: string; quantity: number; processProfile: string | null; loadUnit: string | null; loadPerUnit: number | null; timingMode: string; cycleMinutes: number; coolingMinutes: number; setupMinutes: number; eligibleResourceIds: string[]; resourceId: string | null };
export function machineLoadPlan(machine: { id: string; loadUnit: string | null; loadCapacity: number | null; processProfiles: string[] }, members: LoadMember[]) {
  if (!machine.loadUnit || !machine.loadCapacity) throw new Error("Configure this machine’s shared load capacity and unit in Plant & machines.");
  if (members.length < 2 || members.length > 50 || new Set(members.map(row => row.id)).size !== members.length) throw new Error("Choose between two and fifty different batch operations.");
  const first = members[0];
  if (!first.processProfile || !machine.processProfiles.includes(first.processProfile)) throw new Error("This process profile is not approved for the machine.");
  let occupiedCapacity = 0;
  const weights: Array<{ id: string; quantity: number }> = [];
  for (const member of members) {
    if (member.timingMode !== "BATCH" || member.processProfile !== first.processProfile || member.cycleMinutes !== first.cycleMinutes || member.coolingMinutes !== first.coolingMinutes) throw new Error("A mixed load requires the same approved process profile, cycle and cooling time.");
    if (!(member.eligibleResourceIds.length ? member.eligibleResourceIds : [member.resourceId]).includes(machine.id)) throw new Error("Every selected operation must approve this machine.");
    if (!member.loadUnit || !member.loadPerUnit) throw new Error("Enter each product’s capacity footprint in its recipe before combining loads.");
    const footprint = measuredQuantity(componentQuantity(quantity(member.quantity), quantity(member.loadPerUnit), 0), member.loadUnit, machine.loadUnit).quantity;
    occupiedCapacity = addQuantity(occupiedCapacity, footprint);
    weights.push({ id: member.id, quantity: footprint });
  }
  if (occupiedCapacity > machine.loadCapacity) throw new Error(`The selected operations use ${occupiedCapacity} ${machine.loadUnit}; this machine can hold ${machine.loadCapacity}. Split the production quantities before combining them.`);
  return { profile: first.processProfile, unit: machine.loadUnit, capacity: machine.loadCapacity, occupiedCapacity, weights, durationMinutes: Math.max(...members.map(row => row.setupMinutes)) + first.cycleMinutes + first.coolingMinutes };
}
