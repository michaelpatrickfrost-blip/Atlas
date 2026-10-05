export const CAMPAIGN_CHANNELS = ["Email", "Social", "Paid search", "Paid social", "Website", "Content", "SEO", "Events", "Direct mail", "Trade press", "Telesales", "Partners"] as const;
export const BUDGET_CATEGORIES = ["Advertising", "Content", "Events", "Agency", "Print", "Software", "Sponsorship", "Samples", "Travel", "Other"] as const;
export const ACTIVITY_KINDS = ["TASK", "EMAIL", "SOCIAL_POST", "ADVERT", "EVENT", "CONTENT", "CALL", "MAILER", "PR"] as const;
export const ACTIVITY_STATUSES = ["PLANNED", "IN_PROGRESS", "DONE", "CANCELLED"] as const;
export const ACTIVITY_PHASES = ["Plan", "Build", "Launch", "Run", "Follow up", "Review"] as const;
export const AD_PROVIDERS = ["Google Ads", "Meta", "LinkedIn", "Microsoft Ads", "TikTok", "Trade press", "Other"] as const;
export const STAGE_LABEL: Record<string, string> = { IDEA: "Idea", PLANNING: "Drafting", CONTENT: "Creative", APPROVAL: "In review", SCHEDULED: "Scheduled", LIVE: "Live", PAUSED: "Paused", COMPLETED: "Finished", CANCELLED: "Cancelled", ARCHIVED: "Archived" };
export const STAGE_ORDER = ["IDEA", "PLANNING", "CONTENT", "APPROVAL", "SCHEDULED", "LIVE", "COMPLETED"] as const;

/** Ready-made starting points for the campaign builder. Every word can be changed before the campaign is created. */
export const CAMPAIGN_TEMPLATES = [
  { id: "launch", label: "Product launch", blurb: "Introduce a new product or range to customers and prospects.", type: "PRODUCT_LAUNCH", weeks: 8, channels: ["Email", "Social", "Website", "Trade press", "Telesales"], objective: "Launch the new range so existing customers know it is available and new prospects ask for a quote.", goal: "Quotes requested for the new range", message: "A better way to do the job, in stock and ready to deliver.", offer: "Introductory price on first orders placed in the launch month.", cta: "Ask for a quote" },
  { id: "leads", label: "Lead generation", blurb: "Bring in new enquiries for the sales team to follow up.", type: "LEAD_GENERATION", weeks: 6, channels: ["Paid search", "Paid social", "Website", "Email"], objective: "Generate qualified enquiries from businesses that have not bought from us before.", goal: "Qualified leads handed to sales", message: "The supplier that turns up on the day it said it would.", offer: "Free site survey or sample pack.", cta: "Book a site survey" },
  { id: "winback", label: "Win back lapsed customers", blurb: "Re-open the conversation with customers who have stopped ordering.", type: "REACTIVATION", weeks: 4, channels: ["Email", "Telesales", "Direct mail"], objective: "Bring back customers who have not ordered in the last twelve months.", goal: "Lapsed customers placing an order", message: "A lot has changed since you last ordered. Here is what is new.", offer: "Welcome-back discount on the next order.", cta: "Get your new price list" },
  { id: "upsell", label: "Sell more to customers", blurb: "Show existing customers products they do not buy from you yet.", type: "CROSS_SELL", weeks: 6, channels: ["Email", "Telesales", "Partners"], objective: "Grow order value by introducing existing customers to ranges they buy elsewhere.", goal: "Customers buying a second range", message: "One order, one delivery, one invoice.", offer: "Bundle price when ordered with their usual products.", cta: "Add it to your next order" },
  { id: "event", label: "Event or trade show", blurb: "Fill a stand, an open day or a seminar and follow up afterwards.", type: "EVENT", weeks: 10, channels: ["Events", "Email", "Social", "Telesales"], objective: "Get the right people to the event and turn the conversations into quotes.", goal: "Meetings booked at the event", message: "Come and see it working.", offer: "Show-only offer for orders placed within 14 days.", cta: "Book a time to meet us" },
  { id: "brand", label: "Brand awareness", blurb: "Make sure the market knows who you are and what you stand for.", type: "BRAND", weeks: 12, channels: ["Social", "Content", "Trade press", "SEO"], objective: "Make us the first name the market thinks of for this kind of work.", goal: "People reached in the target market", message: "Made properly, delivered on time.", offer: "", cta: "See how we work" },
  { id: "seasonal", label: "Seasonal promotion", blurb: "A time-limited offer tied to a season or a busy period.", type: "CUSTOMER_ACQUISITION", weeks: 4, channels: ["Email", "Social", "Paid social", "Direct mail"], objective: "Bring orders forward ahead of the busy season.", goal: "Orders placed during the promotion", message: "Order now and be ready before the rush.", offer: "Limited-time price until the end of the month.", cta: "Order before the deadline" },
  { id: "loyalty", label: "Keep customers", blurb: "Stay in front of good customers so they keep ordering.", type: "CUSTOMER_RETENTION", weeks: 12, channels: ["Email", "Content", "Telesales"], objective: "Keep our best customers ordering and catch problems before they leave.", goal: "Customers retained", message: "We value your business, and here is how we are making it easier.", offer: "Priority delivery slots for regular customers.", cta: "Tell us how we are doing" },
] as const;

type Step = readonly [name: string, kind: (typeof ACTIVITY_KINDS)[number], phase: (typeof ACTIVITY_PHASES)[number], from: number, to: number | "END"];
const CHANNEL_STEPS: Record<string, readonly Step[]> = {
  Email: [["Write and design the launch email", "EMAIL", "Build", -14, -4], ["Send the launch email", "EMAIL", "Launch", 0, 0], ["Send the follow-up email", "EMAIL", "Follow up", 7, 7]],
  Social: [["Create the social posts and images", "SOCIAL_POST", "Build", -10, -3], ["Publish launch-week posts", "SOCIAL_POST", "Launch", 0, 7], ["Keep posting through the campaign", "SOCIAL_POST", "Run", 8, "END"]],
  "Paid search": [["Set up search adverts and keywords", "ADVERT", "Build", -10, -2], ["Search adverts live", "ADVERT", "Run", 0, "END"]],
  "Paid social": [["Build paid social adverts and audiences", "ADVERT", "Build", -10, -2], ["Paid social adverts live", "ADVERT", "Run", 0, "END"]],
  Website: [["Build the landing page and enquiry form", "CONTENT", "Build", -14, -3], ["Put the campaign on the home page", "CONTENT", "Launch", 0, 0]],
  Content: [["Write the lead article or guide", "CONTENT", "Build", -14, -4], ["Publish and share the article", "CONTENT", "Launch", 0, 2]],
  SEO: [["Update pages and keywords for the campaign", "CONTENT", "Build", -14, 0]],
  Events: [["Book the event, stand and travel", "EVENT", "Plan", -42, -28], ["Invite customers and prospects", "EVENT", "Build", -21, -7], ["Run the event", "EVENT", "Launch", 0, 1], ["Follow up everyone we met", "CALL", "Follow up", 2, 10]],
  "Direct mail": [["Design and print the mailer", "MAILER", "Build", -21, -7], ["Mailer lands with customers", "MAILER", "Launch", 0, 2]],
  "Trade press": [["Book advert space and send the press release", "PR", "Build", -28, -10], ["Advert and coverage appear", "PR", "Launch", 0, 14]],
  Telesales: [["Brief the sales team and build the call list", "TASK", "Build", -5, -1], ["Follow-up calls to people who responded", "CALL", "Follow up", 2, 14]],
  Partners: [["Brief partners and share the campaign pack", "TASK", "Build", -10, -2]],
};
const COMMON: readonly Step[] = [["Agree the brief and sign off the budget", "TASK", "Plan", -21, -16], ["Check results each week", "TASK", "Run", 7, "END"], ["Hand new leads to sales", "TASK", "Follow up", 3, "END"], ["Campaign review: what worked and what to repeat", "TASK", "Review", 9999, 9999]];
const DAY = 86_400_000;
export type PlannedStep = { name: string; channel: string; kind: string; phase: string; startAt: Date | null; endAt: Date | null };
/** A dated launch plan for the chosen channels, worked back from the start date. */
export function launchPlan(channels: readonly string[], start: Date | null, end: Date | null): PlannedStep[] {
  const finish = end ?? (start ? new Date(start.getTime() + 42 * DAY) : null);
  const at = (offset: number | "END") => !start || !finish ? null : offset === "END" ? finish : offset === 9999 ? new Date(finish.getTime() + 7 * DAY) : new Date(Math.min(start.getTime() + offset * DAY, Math.max(finish.getTime(), start.getTime() + offset * DAY)));
  const rows = [...COMMON.map((step) => ({ step, channel: "" })), ...channels.flatMap((channel) => (CHANNEL_STEPS[channel] ?? []).map((step) => ({ step, channel })))];
  return rows.map(({ step: [name, kind, phase, from, to], channel }) => ({ name, channel, kind, phase, startAt: at(from), endAt: at(to) }))
    .sort((a, b) => ACTIVITY_PHASES.indexOf(a.phase as never) - ACTIVITY_PHASES.indexOf(b.phase as never) || (a.startAt?.getTime() ?? 0) - (b.startAt?.getTime() ?? 0));
}
const CHANNEL_CATEGORY: Record<string, (typeof BUDGET_CATEGORIES)[number]> = { "Paid search": "Advertising", "Paid social": "Advertising", "Trade press": "Advertising", Events: "Events", Content: "Content", Website: "Content", SEO: "Content", Social: "Content", "Direct mail": "Print", Email: "Software" };
export const channelCategory = (channel: string) => CHANNEL_CATEGORY[channel] ?? "Other";

/** What a finished brief needs. Drives the readiness score on the builder and the campaign. */
export function campaignReadiness(c: { objective: string; audienceId: string | null; targetMarket: string; message: string; cta: string; channels: readonly string[]; startAt: Date | null; endAt: Date | null; budgetMinor: number; targetLeads: number; targetRevenueMinor: number; targetPipelineMinor: number; targetCustomers: number }, plan: { activities: number; allocatedMinor: number }) {
  const checks = [
    { label: "Objective written", done: !!c.objective.trim() },
    { label: "Audience chosen or target market described", done: !!c.audienceId || !!c.targetMarket.trim() },
    { label: "Key message", done: !!c.message.trim() },
    { label: "Call to action", done: !!c.cta.trim() },
    { label: "At least one channel", done: c.channels.length > 0 },
    { label: "Start and end dates", done: !!c.startAt && !!c.endAt },
    { label: "Budget set", done: c.budgetMinor > 0 },
    { label: "Budget split into lines", done: plan.allocatedMinor > 0 },
    { label: "A target to measure against", done: c.targetLeads > 0 || c.targetCustomers > 0 || c.targetPipelineMinor > 0 || c.targetRevenueMinor > 0 },
    { label: "Activities planned", done: plan.activities > 0 },
  ];
  return { checks, score: Math.round((checks.filter((check) => check.done).length / checks.length) * 100) };
}
