/** The extra picture a sales plan needs. Coverage is pipeline divided by revenue still to reach the plan. */

export const SALES_BRIEF = [
  ["territories", "Territories", "Where this plan sells, and who owns each territory."],
  ["products", "Products and mix", "Which products carry the number, and the mix you are planning."],
  ["accounts", "Accounts that make the number", "The customers and opportunities this plan depends on."],
  ["newBusiness", "New and existing", "What comes from customers who already buy, and what must be won."],
  ["price", "Price and discount", "The price the plan uses, and how far discount can go."],
  ["activity", "Activity", "The calls, visits and quotations the plan expects."],
] as const;

export const MARKETING_BRIEF = [
  ["audience", "Who it is for", "The people this plan is trying to reach."],
  ["offer", "Offer", "What you are asking them to do."],
  ["channels", "Channels", "Where the work will run."],
  ["spend", "Spend", "What you intend to spend, and what must come back."],
  ["success", "What good looks like", "The result that means this plan worked."],
] as const;

export function briefFields(planType: string) {
  if (planType === "sales") return SALES_BRIEF;
  if (planType === "marketing") return MARKETING_BRIEF;
  return [] as const;
}

export function briefText(brief: unknown, key: string) {
  if (!brief || typeof brief !== "object" || Array.isArray(brief)) return "";
  const value = (brief as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

export function salesPicture(input: { revenuePlan: number | null; revenueActual: number | null; ordersActual: number | null; pipeline: number | null }) {
  const average = input.revenueActual != null && input.ordersActual ? input.revenueActual / input.ordersActual : null;
  if (input.revenuePlan == null || input.pipeline == null) {
    return { average, remaining: null as number | null, coverage: null as number | null, note: "Set a revenue target and keep pipeline on the plan to see coverage." };
  }
  const remaining = input.revenuePlan - (input.revenueActual ?? 0);
  if (remaining <= 0) return { average, remaining: 0, coverage: null as number | null, note: "Confirmed revenue has reached the plan." };
  return { average, remaining, coverage: input.pipeline / remaining, note: "Open pipeline divided by the revenue still needed to reach the plan." };
}
