import { z } from "zod";

/** Company switches. Off means the app keeps its current permissions. */
export const managerPolicySchema = z.object({
  crm: z.boolean().default(false),
  finance: z.boolean().default(false),
  financeLimitMinor: z.number().int().min(0).max(2_147_483_647).default(1_000_000),
  service: z.boolean().default(false),
  serviceLimitMinor: z.number().int().min(0).max(2_147_483_647).default(1_000_000),
});

export type ManagerPolicy = z.infer<typeof managerPolicySchema>;

export const MANAGER_SIGNOFF_POLICY = "Manager level sign-off";

export function readManagerPolicy(value: unknown): ManagerPolicy {
  const parsed = managerPolicySchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : managerPolicySchema.parse({});
}

export function crmPushAllowed(policy: ManagerPolicy, capabilities: { has(capability: string): boolean }) {
  if (!policy.crm) return true;
  return capabilities.has("sales.pipeline.manage");
}

export function financeNeedsManagerSignOff(policy: ManagerPolicy, input: { gross: bigint; currency: string; companyCurrency: string }) {
  if (!policy.finance) return false;
  if (input.currency !== input.companyCurrency) return true;
  return input.gross >= BigInt(policy.financeLimitMinor);
}

export function serviceNeedsManagerSignOff(policy: ManagerPolicy, input: { complaint: boolean; linkedGross: number; foreign: boolean }) {
  if (!policy.service) return false;
  if (input.complaint) return true;
  if (input.foreign) return true;
  return input.linkedGross > 0 && input.linkedGross >= policy.serviceLimitMinor;
}

/** Inclusive ranges. A null maximum means no upper bound. Touching endpoints overlap. */
export function rangesOverlap(aMin: bigint, aMax: bigint | null, bMin: bigint, bMax: bigint | null) {
  const aEndsBefore = aMax !== null && aMax < bMin;
  const bEndsBefore = bMax !== null && bMax < aMin;
  return !aEndsBefore && !bEndsBefore;
}

export function isManagerLevelSnapshot(value: unknown) {
  return !!value && typeof value === "object" && !Array.isArray(value) && (value as { managerLevel?: unknown }).managerLevel === true;
}
