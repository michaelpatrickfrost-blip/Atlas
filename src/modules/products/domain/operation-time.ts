/** One timing basis shared by recipe costing, MRP and executable scheduling. */
export type OperationTiming = {
  setupMinutes: number;
  runMinutesPerUnit: number;
  timingMode?: string;
  batchCapacity?: number;
  cycleMinutes?: number;
  coolingMinutes?: number;
  waitMinutes?: number;
};

export function operationTime(op: OperationTiming, quantity: number, normalBatch = quantity, spread = false) {
  const values = [quantity, op.setupMinutes, op.runMinutesPerUnit, op.cycleMinutes ?? 0, op.coolingMinutes ?? 0, op.waitMinutes ?? 0];
  if (values.some((v) => !Number.isFinite(v) || v < 0) || quantity <= 0) throw new Error("Operation quantities and times must be finite and non-negative.");
  const batch = op.timingMode === "BATCH";
  if (op.timingMode && !["PER_UNIT", "BATCH"].includes(op.timingMode)) throw new Error("Choose a per-unit or batch-cycle operation.");
  const capacity = batch ? op.batchCapacity ?? 0 : normalBatch;
  if (!(capacity > 0) || !Number.isFinite(capacity)) throw new Error("Enter a positive operation batch capacity.");
  if (batch && !(Number(op.cycleMinutes) > 0)) throw new Error("Enter the firing or drying cycle time.");
  const batches = spread ? quantity / capacity : Math.ceil(quantity / capacity);
  const setupMinutes = batches * op.setupMinutes;
  const runMinutes = batch ? batches * ((op.cycleMinutes ?? 0) + (op.coolingMinutes ?? 0)) : quantity * op.runMinutesPerUnit;
  return { batches, setupMinutes, runMinutes, durationMinutes: Math.max(1, setupMinutes + runMinutes), waitMinutes: op.waitMinutes ?? 0 };
}
