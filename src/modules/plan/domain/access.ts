/** Who can open a plan. A plan is private to its owner until it is shared. */

export type PlanViewer = {
  organisationId: string;
  userId: string;
  capabilities: { has(capability: string): boolean };
};

export function planWhere(session: PlanViewer) {
  return {
    organisationId: session.organisationId,
    ...(session.capabilities.has("plan.sensitive.read") ? {} : { sensitive: false }),
    OR: [
      { ownerUserId: session.userId },
      { audience: "company" },
      { shares: { some: { organisationId: session.organisationId, userId: session.userId } } },
    ],
  };
}

export function planVisible(input: { owner: boolean; company: boolean; shared: boolean; sensitive: boolean; canReadSensitive: boolean }) {
  if (input.sensitive && !input.canReadSensitive) return false;
  return input.owner || input.company || input.shared;
}

export function canEditPlan(plan: { ownerUserId: string; audience: string; shares: Array<{ userId: string; access: string }> }, userId: string) {
  if (plan.ownerUserId === userId) return true;
  if (plan.audience === "company") return true;
  return plan.shares.some((share) => share.userId === userId && share.access === "edit");
}

export function audienceLabel(audience: string, shareCount: number) {
  if (audience === "company") return "Everyone with Plan";
  if (shareCount > 0) return shareCount === 1 ? "Shared with 1 person" : `Shared with ${shareCount} people`;
  return "Only the owner";
}
