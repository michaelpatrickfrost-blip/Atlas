import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { can } from "@/core/permissions/check";

/** Everything the campaign workspace shows: the brief, its plan and money, and what it has produced. */
export async function loadCampaignWorkspace(session: Session, campaignId: string) {
  const organisationId = session.organisationId;
  const campaign = await db.marketingCampaign.findFirst({ where: { id: campaignId, organisationId }, include: { audience: { select: { id: true, name: true } } } });
  if (!campaign) return null;
  const [lines, activities, spend, leads, touches, posts, messages, children, owner, product, parent] = await Promise.all([
    db.marketingBudgetLine.findMany({ where: { organisationId, campaignId }, orderBy: [{ month: "asc" }, { createdAt: "asc" }] }),
    db.marketingActivity.findMany({ where: { organisationId, campaignId }, orderBy: [{ startAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }] }),
    db.marketingPaidSpend.findMany({ where: { organisationId, campaignId }, orderBy: { day: "desc" }, take: 200 }),
    db.marketingLead.findMany({ where: { organisationId, campaignId }, select: { id: true, status: true, prospectId: true, mqlAt: true, profile: { select: { partyId: true, contactId: true } } }, orderBy: { mqlAt: "desc" }, take: 500 }),
    db.marketingTouch.findMany({ where: { organisationId, campaignId }, select: { profileId: true, channel: true, source: true, occurredAt: true }, orderBy: { occurredAt: "asc" }, take: 5000 }),
    db.marketingSocialPost.findMany({ where: { organisationId, campaignId }, select: { id: true, caption: true, status: true, scheduledAt: true, publishedAt: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.marketingMessage.findMany({ where: { organisationId, campaignId }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.marketingCampaign.findMany({ where: { organisationId, parentId: campaignId }, select: { id: true, name: true, code: true, status: true, budgetMinor: true, currency: true } }),
    db.user.findUnique({ where: { id: campaign.ownerUserId }, select: { name: true } }),
    campaign.productId ? db.product.findFirst({ where: { id: campaign.productId, organisationId }, select: { id: true, code: true, name: true } }) : null,
    campaign.parentId ? db.marketingCampaign.findFirst({ where: { id: campaign.parentId, organisationId }, select: { id: true, name: true } }) : null,
  ]);

  // People and customers reached, and what those customers went on to order.
  const profileIds = [...new Set(touches.map((touch) => touch.profileId))];
  const profiles = profileIds.length ? await db.marketingProfile.findMany({ where: { organisationId, id: { in: profileIds } }, select: { id: true, partyId: true } }) : [];
  const partyOf = new Map(profiles.map((profile) => [profile.id, profile.partyId]));
  const firstTouch = new Map<string, Date>();
  for (const touch of touches) { const partyId = partyOf.get(touch.profileId); if (partyId && !firstTouch.has(partyId)) firstTouch.set(partyId, touch.occurredAt); }
  const seeSales = can(session, "sales.order.read");
  const orders = seeSales && firstTouch.size ? await db.salesOrder.findMany({ where: { organisationId, partyId: { in: [...firstTouch.keys()] }, commercialStatus: "CONFIRMED" }, select: { id: true, reference: true, partyId: true, netAmount: true, currency: true, createdAt: true, party: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 2000 }) : [];
  const influenced = orders.filter((order) => order.createdAt >= (firstTouch.get(order.partyId) ?? new Date(8.64e15)) && order.currency === campaign.currency);
  const names = [campaign.code, campaign.name, campaign.utmCampaign].filter(Boolean);
  const deals = can(session, "sales.opportunity.read") ? await db.opportunity.findMany({ where: { organisationId, OR: names.map((name) => ({ campaign: { equals: name, mode: "insensitive" as const } })) }, select: { id: true, name: true, status: true, valueAmount: true, valueCurrency: true, party: { select: { name: true } } }, take: 500 }) : [];

  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
  const planned = sum(lines.map((line) => line.plannedMinor)), committed = sum(lines.map((line) => line.committedMinor)), lineActual = sum(lines.map((line) => line.actualMinor));
  const adSpend = sum(spend.map((row) => row.spendMinor)), activityCost = sum(activities.map((row) => row.costMinor));
  const actual = lineActual + adSpend;
  const revenue = sum(influenced.map((order) => order.netAmount));
  const open = deals.filter((deal) => deal.status === "OPEN"), won = deals.filter((deal) => deal.status === "WON");
  const channels = new Map<string, number>();
  for (const touch of touches) { const key = touch.channel || touch.source || "Other"; channels.set(key, (channels.get(key) ?? 0) + 1); }
  return {
    campaign, owner: owner?.name ?? "—", product, parent, children, lines, activities, spend, leads, posts, messages, deals, influenced: influenced.slice(0, 25), seeSales,
    totals: { planned, committed, lineActual, adSpend, activityCost, actual, remaining: campaign.budgetMinor - actual, unallocated: campaign.budgetMinor - planned },
    results: {
      touches: touches.length, people: profileIds.length, customers: firstTouch.size, leads: leads.length, handed: leads.filter((lead) => lead.prospectId).length,
      pipeline: sum(open.map((deal) => deal.valueAmount)), openDeals: open.length, wonDeals: won.length, wonValue: sum(won.map((deal) => deal.valueAmount)),
      orders: influenced.length, revenue, impressions: sum(spend.map((row) => row.impressions)), clicks: sum(spend.map((row) => row.clicks)), conversions: sum(spend.map((row) => row.conversions)),
      costPerLead: leads.length && actual ? Math.round(actual / leads.length) : null, returnOn: actual ? (revenue - actual) / actual : null,
      channels: [...channels].sort((a, b) => b[1] - a[1]).slice(0, 8),
    },
  };
}
export type CampaignWorkspace = NonNullable<Awaited<ReturnType<typeof loadCampaignWorkspace>>>;

export async function campaignBriefOptions(session: Session, exceptId?: string) {
  const organisationId = session.organisationId;
  const [audiences, products, members, programmes] = await Promise.all([
    can(session, "marketing.audience.read") ? db.marketingAudience.findMany({ where: { organisationId }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 200 }) : [],
    db.product.findMany({ where: { organisationId, active: true }, select: { id: true, name: true, code: true }, orderBy: { name: "asc" }, take: 1000 }),
    db.membership.findMany({ where: { organisationId }, select: { userId: true, user: { select: { name: true } } }, orderBy: { user: { name: "asc" } } }),
    db.marketingCampaign.findMany({ where: { organisationId, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 200 }),
  ]);
  return { audiences, products, members: members.map((member) => ({ id: member.userId, name: member.user.name })), programmes };
}
