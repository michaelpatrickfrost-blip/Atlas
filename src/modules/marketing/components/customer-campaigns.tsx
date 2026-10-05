import Link from "next/link";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";

/** Which marketing campaigns reached this customer. Shown on Sales records so both teams see the same history. */
export async function CustomerCampaigns({ partyId }: { partyId: string }) {
  const session = await requireSession();
  if (!can(session, "marketing.campaign.read")) return null;
  const organisationId = session.organisationId;
  if (!(await db.moduleState.findFirst({ where: { organisationId, moduleId: "marketing", enabled: true, entitled: true }, select: { id: true } }))) return null;
  const profiles = await db.marketingProfile.findMany({ where: { organisationId, partyId }, select: { id: true } });
  const touches = profiles.length ? await db.marketingTouch.findMany({ where: { organisationId, profileId: { in: profiles.map((profile) => profile.id) } }, select: { campaignId: true, channel: true, source: true, occurredAt: true }, orderBy: { occurredAt: "desc" }, take: 200 }) : [];
  const campaigns = touches.length ? await db.marketingCampaign.findMany({ where: { organisationId, id: { in: [...new Set(touches.map((touch) => touch.campaignId))] } }, select: { id: true, code: true, name: true } }) : [];
  const rows = campaigns.map((campaign) => { const own = touches.filter((touch) => touch.campaignId === campaign.id); return { ...campaign, count: own.length, last: own[0].occurredAt, first: own[own.length - 1].occurredAt, channels: [...new Set(own.map((touch) => touch.channel || touch.source).filter(Boolean))] }; }).sort((a, b) => b.last.getTime() - a.last.getTime());
  const day = (value: Date) => value.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">Marketing</h3><p className="mt-1 text-xs text-slate-500">Campaigns that reached this customer. A confirmed order is credited to them in Marketing&apos;s attribution report.</p></div><Link href={`/marketing/profiles?partyId=${partyId}`} className="text-xs font-medium text-blue-600">{profiles.length} contact{profiles.length === 1 ? "" : "s"} in Marketing →</Link></div>
    {rows.length ? <ul className="mt-3 divide-y divide-slate-100">{rows.map((row) => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm"><Link href={`/marketing?focus=${row.id}`} className="font-medium text-blue-700">{row.code} · {row.name}</Link><span className="text-xs text-slate-500">{row.count} touch{row.count === 1 ? "" : "es"}{row.channels.length ? ` · ${row.channels.slice(0, 3).join(", ")}` : ""} · first {day(row.first)} · last {day(row.last)}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">{profiles.length ? "No campaign has reached this customer yet." : "This customer's contacts are not in Marketing yet. Contacts with an email are added automatically within a few minutes."}</p>}
  </section>;
}
