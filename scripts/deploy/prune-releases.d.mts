export type RetirementPlan = {
  protectedPaths: string[];
  kept: string[];
  candidates: { directory: string; outputs: string[] }[];
};
export function planRetirement(root: string, pointers: string[], inUse?: string[]): RetirementPlan;
export function retirePlannedOutputs(plan: Pick<RetirementPlan, 'candidates'>, log?: (directory: string) => void): void;
