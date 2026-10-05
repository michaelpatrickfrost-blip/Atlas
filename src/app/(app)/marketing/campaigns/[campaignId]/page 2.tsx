import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { StatusPill } from "@/components/ui/status-pill";
import { Tabs } from "@/components/ui/tabs";
import { requireMarketing } from "@/modules/marketing/services/queries";
import { campaignBriefOptions, loadCampaignWorkspace } from "@/modules/marketing/services/campaign-workspace";
import { addPaidSpendAction, deleteActivityAction, deleteBudgetLineAction, deletePaidSpendAction, saveActivityAction, saveBudgetLineAction, saveCampaignBriefAction, setActivityStatusAction } from "@/modules/marketing/services/campaign-actions";
import { updateCampaign } from "@/modules/marketing/services/commands";
import { CAMPAIGN_TRANSITIONS } from "@/modules/marketing/domain/policy";
import { ACTIVITY_KINDS, ACTIVITY_PHASES, ACTIVITY_STATUSES, AD_PROVIDERS, BUDGET_CATEGORIES, CAMPAIGN_CHANNELS, STAGE_LABEL, STAGE_ORDER, campaignReadiness } from "@/modules/marketing/domain/campaign";
import { ActionForm } from "@/modules/marketing/components/action-form";
import { CampaignBriefFields } from "@/modules/marketing/components/campaign-brief";
import { TrackingLink } from "@/modules/marketing/components/tracking-link";
import { campaignTone, money, words } from "@/modules/marketing/components/format";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";
const card = "rounded-2xl border border-slate-200 bg-white p-5";
const th = "px-4 py-2.5 text-left text-xs font-medium text-slate-500";
const td = "px-4 py-2.5";
const date = (value: Date | null) => (value ? value.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const iso = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : "");
const pounds = (minor: number) => (minor ? (minor / 100).toFixed(2) : "");
const tone = (status: string) => (status === "DONE" ? "success" : status === "IN_PROGRESS" ? "warning" : status === "CANCELLED" ? "danger" : "neutral") as "success" | "warning" | "danger" | "neutral";

function Progress({ label, actual, target, text }: { label: string; actual: number; target: number; text: string }) {
  const share = target ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  return <div><div className="flex items-baseline justify-between gap-3 text-sm"><span className="font-medium">{label}</span><span className="tabular-nums text-slate-500">{text}</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${share >= 100 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${share}%` }} /></div><p className="mt-1 text-xs text-slate-400">{target ? `${Math.round((actual / target) * 100)}% of target` : "No target set"}</p></div>;
}
function Said({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium text-slate-500">{label}</p><p className={`mt-1 whitespace-pre-line text-sm ${value ? "" : "text-slate-400"}`}>{value || "Not written yet"}</p></div>;
}

export default async function CampaignPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const session = await requireSession();
  assertCapability(session, "marketing.campaign.read");
  await requireMarketing(session);
  const [data, options] = await Promise.all([loadCampaignWorkspace(session, campaignId), campaignBriefOptions(session, campaignId)]);
  if (!data) notFound();
  const { campaign: c, totals, results } = data;
  const manage = can(session, "marketing.campaign.manage");
  const cash = (minor: number) => money(minor, c.currency);
  const ready = campaignReadiness(c, { activities: data.activities.length, allocatedMinor: totals.planned });
  const next = (CAMPAIGN_TRANSITIONS[c.status] ?? []).filter((status) => status !== "LIVE");
  const stage = STAGE_ORDER.indexOf(c.status as (typeof STAGE_ORDER)[number]);
  const memberName = new Map(options.members.map((member) => [member.id, member.name]));
  const hidden = <input type="hidden" name="campaignId" value={c.id} />;
  const doneCount = data.activities.filter((row) => row.status === "DONE").length;
  const today = new Date();
  const late = data.activities.filter((row) => row.endAt && row.endAt < today && !["DONE", "CANCELLED"].includes(row.status)).length;

  const activityFields = (row?: (typeof data.activities)[number]) => <div className="grid gap-3 sm:grid-cols-4">
    <label className="block text-xs font-medium sm:col-span-2">Activity<input name="name" maxLength={250} defaultValue={row?.name} placeholder="Send the launch email" className={field} /></label>
    <label className="block text-xs font-medium">Kind<select name="kind" defaultValue={row?.kind ?? "TASK"} className={field}>{ACTIVITY_KINDS.map((kind) => <option key={kind} value={kind}>{words(kind)}</option>)}</select></label>
    <label className="block text-xs font-medium">Phase<select name="phase" defaultValue={row?.phase ?? "Build"} className={field}>{ACTIVITY_PHASES.map((phase) => <option key={phase}>{phase}</option>)}</select></label>
    <label className="block text-xs font-medium">Channel<select name="channel" defaultValue={row?.channel ?? ""} className={field}><option value="">All channels</option>{CAMPAIGN_CHANNELS.map((channel) => <option key={channel}>{channel}</option>)}</select></label>
    <label className="block text-xs font-medium">Owner<select name="ownerUserId" defaultValue={row?.ownerUserId ?? ""} className={field}><option value="">Nobody yet</option>{options.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
    <label className="block text-xs font-medium">Starts<input name="startAt" type="date" defaultValue={iso(row?.startAt ?? null)} className={field} /></label>
    <label className="block text-xs font-medium">Due<input name="endAt" type="date" defaultValue={iso(row?.endAt ?? null)} className={field} /></label>
    <label className="block text-xs font-medium">Status<select name="status" defaultValue={row?.status ?? "PLANNED"} className={field}>{ACTIVITY_STATUSES.map((status) => <option key={status} value={status}>{words(status)}</option>)}</select></label>
    <label className="block text-xs font-medium">Cost<input name="cost" inputMode="decimal" defaultValue={pounds(row?.costMinor ?? 0)} placeholder="0.00" className={field} /></label>
    <label className="block text-xs font-medium sm:col-span-2">Notes<input name="notes" maxLength={5000} defaultValue={row?.notes} className={field} /></label>
  </div>;
  const lineFields = (row?: (typeof data.lines)[number]) => <div className="grid gap-3 sm:grid-cols-4">
    <label className="block text-xs font-medium sm:col-span-2">What the money is for<input name="label" maxLength={200} defaultValue={row?.label} placeholder="Trade magazine half page" className={field} /></label>
    <label className="block text-xs font-medium">Category<select name="category" defaultValue={row?.category ?? "Advertising"} className={field}>{BUDGET_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
    <label className="block text-xs font-medium">Month<input name="month" type="month" defaultValue={row?.month} className={field} /></label>
    <label className="block text-xs font-medium">Planned<input name="planned" inputMode="decimal" defaultValue={pounds(row?.plannedMinor ?? 0)} placeholder="0.00" className={field} /></label>
    <label className="block text-xs font-medium">Committed (ordered)<input name="committed" inputMode="decimal" defaultValue={pounds(row?.committedMinor ?? 0)} placeholder="0.00" className={field} /></label>
    <label className="block text-xs font-medium">Spent<input name="actual" inputMode="decimal" defaultValue={pounds(row?.actualMinor ?? 0)} placeholder="0.00" className={field} /></label>
    <label className="block text-xs font-medium">Expected final cost<input name="forecast" inputMode="decimal" defaultValue={pounds(row?.forecastMinor ?? 0)} placeholder="0.00" className={field} /></label>
  </div>;

  const overview = <>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className={`${card} space-y-4`}>
        <h3 className="font-semibold">The brief</h3>
        <div className="grid gap-4 sm:grid-cols-2"><Said label="Objective" value={c.objective} /><Said label="Business goal" value={c.businessGoal} /><Said label="Target market" value={c.targetMarket} /><Said label="Who we are talking to" value={c.persona} /><Said label="Key message" value={c.message} /><Said label="Offer" value={c.offer} /><Said label="Call to action" value={c.cta} /><Said label="Positioning" value={c.positioning} /></div>
        <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">{c.channels.length ? c.channels.map((channel) => <span key={channel} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{channel}</span>) : <span className="text-sm text-slate-400">No channels chosen</span>}</div>
        <dl className="grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">{[["Audience", data.campaign.audience?.name ?? "Not chosen"], ["Product", data.product ? `${data.product.code} · ${data.product.name}` : "Not tied to one"], ["Region", c.region || "—"], ["Team", c.teamName || "—"], ["Programme", data.parent?.name ?? "Stands alone"], ["Tracking name", c.utmCampaign || "—"]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-0.5 font-medium">{value}</dd></div>)}</dl>
      </div>
      <div className="space-y-5">
        <div className={card}><div className="flex items-baseline justify-between"><h3 className="font-semibold">Ready to launch</h3><span className="text-2xl font-semibold tabular-nums">{ready.score}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${ready.score === 100 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${ready.score}%` }} /></div><ul className="mt-4 space-y-1.5 text-sm">{ready.checks.map((check) => <li key={check.label} className={`flex items-center gap-2 ${check.done ? "text-slate-500" : "font-medium"}`}><span className={`grid size-4 shrink-0 place-items-center rounded-full text-[10px] ${check.done ? "bg-emerald-500 text-white" : "border border-slate-300"}`}>{check.done ? "✓" : ""}</span>{check.label}</li>)}</ul></div>
        {(c.risks || c.dependencies) && <div className={`${card} space-y-3`}><Said label="Risks" value={c.risks} /><Said label="Depends on" value={c.dependencies} /></div>}
      </div>
    </div>
    {data.children.length > 0 && <div className={card}><h3 className="font-semibold">Campaigns in this programme</h3><div className="mt-3 divide-y divide-slate-100">{data.children.map((child) => <Link key={child.id} href={`/marketing/campaigns/${child.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="font-medium">{child.name}<span className="ml-2 font-normal text-slate-400">{child.code}</span></span><span className="flex items-center gap-3"><span className="tabular-nums text-slate-500">{money(child.budgetMinor, child.currency)}</span><StatusPill label={STAGE_LABEL[child.status] ?? words(child.status)} tone={campaignTone(child.status)} /></span></Link>)}</div></div>}
  </>;

  const brief = manage ? <ActionForm action={saveCampaignBriefAction} label="Save brief">{hidden}<CampaignBriefFields campaign={c} options={options} /></ActionForm> : <p className="text-sm text-slate-500">You can read this campaign but not change it.</p>;

  const plan = <>
    <div className="grid gap-3 sm:grid-cols-4">{[["Activities", data.activities.length], ["Done", doneCount], ["Overdue", late], ["Planned cost", cash(totals.activityCost)]].map(([label, value]) => <div key={label} className={card}><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-2xl font-semibold tabular-nums ${label === "Overdue" && late ? "text-red-700" : ""}`}>{value}</p></div>)}</div>
    {ACTIVITY_PHASES.map((phase) => ({ phase, rows: data.activities.filter((row) => (row.phase || "Plan") === phase) })).concat([{ phase: "Other" as never, rows: data.activities.filter((row) => row.phase && !(ACTIVITY_PHASES as readonly string[]).includes(row.phase)) }]).filter((group) => group.rows.length).map((group) => <div key={group.phase} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5"><h3 className="text-sm font-semibold">{group.phase}</h3><span className="text-xs text-slate-500">{group.rows.filter((row) => row.status === "DONE").length} of {group.rows.length} done</span></div>
      {group.rows.map((row) => <details key={row.id} className="group border-b border-slate-100 last:border-0">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50">
          <span className={`min-w-0 flex-1 font-medium ${row.status === "DONE" ? "text-slate-400 line-through" : ""}`}>{row.name}<span className="ml-2 font-normal text-slate-400">{row.channel || "All channels"} · {words(row.kind)}</span></span>
          <span className="text-slate-500">{row.ownerUserId ? memberName.get(row.ownerUserId) ?? "—" : "Unassigned"}</span>
          <span className={`w-44 text-right tabular-nums ${row.endAt && row.endAt < today && !["DONE", "CANCELLED"].includes(row.status) ? "font-medium text-red-700" : "text-slate-500"}`}>{row.startAt ? `${date(row.startAt)}${row.endAt && row.endAt.getTime() !== row.startAt.getTime() ? ` – ${date(row.endAt)}` : ""}` : "No date"}</span>
          <StatusPill label={words(row.status)} tone={tone(row.status)} />
        </summary>
        {manage && <div className="space-y-3 bg-slate-50 px-4 py-4">
          <ActionForm action={saveActivityAction} label="Save activity">{hidden}<input type="hidden" name="id" value={row.id} />{activityFields(row)}</ActionForm>
          <div className="flex gap-2">{row.status !== "DONE" && <form action={setActivityStatusAction}>{hidden}<input type="hidden" name="id" value={row.id} /><input type="hidden" name="status" value="DONE" /><button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium">Mark done</button></form>}<form action={deleteActivityAction}>{hidden}<input type="hidden" name="id" value={row.id} /><button className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-700">Remove</button></form></div>
        </div>}
      </details>)}
    </div>)}
    {!data.activities.length && <p className={`${card} text-sm text-slate-500`}>Nothing is planned yet. Add the first activity below.</p>}
    {manage && <div className={card}><h3 className="mb-3 font-semibold">Add an activity</h3><ActionForm action={saveActivityAction} label="Add activity">{hidden}{activityFields()}</ActionForm></div>}
  </>;

  const budget = <>
    <div className="grid gap-3 sm:grid-cols-5">{[["Budget", cash(c.budgetMinor)], ["Split into lines", cash(totals.planned)], ["Committed", cash(totals.committed)], ["Spent", cash(totals.actual)], [totals.remaining < 0 ? "Over budget" : "Left to spend", cash(Math.abs(totals.remaining))]].map(([label, value]) => <div key={label} className={card}><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-xl font-semibold tabular-nums ${label === "Over budget" ? "text-red-700" : ""}`}>{value}</p></div>)}</div>
    {totals.unallocated !== 0 && c.budgetMinor > 0 && <p className={`rounded-xl p-3 text-sm ${totals.unallocated < 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>{totals.unallocated < 0 ? `The lines add up to ${cash(-totals.unallocated)} more than the budget.` : `${cash(totals.unallocated)} of the budget is not yet split into lines.`}</p>}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="hidden grid-cols-[minmax(0,1fr)_110px_90px_100px_100px_100px] border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 sm:grid"><span className="px-4 py-2.5">Budget line</span><span className="px-4 py-2.5">Category</span><span className="px-4 py-2.5">Month</span><span className="px-4 py-2.5 text-right">Planned</span><span className="px-4 py-2.5 text-right">Committed</span><span className="px-4 py-2.5 text-right">Spent</span></div>
      {data.lines.map((row) => <details key={row.id} className="border-b border-slate-100 last:border-0">
        <summary className="grid cursor-pointer list-none grid-cols-2 text-sm hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_110px_90px_100px_100px_100px]"><span className="px-4 py-3 font-medium">{row.label || row.category}</span><span className="px-4 py-3 text-slate-500">{row.category}</span><span className="px-4 py-3 text-slate-500">{row.month || "—"}</span><span className="px-4 py-3 text-right tabular-nums">{cash(row.plannedMinor)}</span><span className="px-4 py-3 text-right tabular-nums text-slate-500">{cash(row.committedMinor)}</span><span className={`px-4 py-3 text-right tabular-nums ${row.actualMinor > row.plannedMinor ? "font-medium text-red-700" : ""}`}>{cash(row.actualMinor)}</span></summary>
        {manage && <div className="space-y-3 bg-slate-50 px-4 py-4"><ActionForm action={saveBudgetLineAction} label="Save line">{hidden}<input type="hidden" name="id" value={row.id} />{lineFields(row)}</ActionForm><form action={deleteBudgetLineAction}>{hidden}<input type="hidden" name="id" value={row.id} /><button className="text-sm font-medium text-red-700">Remove line</button></form></div>}
      </details>)}
      {!data.lines.length && <p className="p-5 text-sm text-slate-500">The budget has not been split up yet. Add a line for each thing the money will be spent on.</p>}
    </div>
    {manage && <div className={card}><h3 className="mb-3 font-semibold">Add a budget line</h3><ActionForm action={saveBudgetLineAction} label="Add line">{hidden}{lineFields()}</ActionForm></div>}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><h3 className="font-semibold">Advertising spend</h3><span className="text-sm text-slate-500">{cash(totals.adSpend)} · {results.clicks.toLocaleString("en-GB")} clicks · {results.conversions.toLocaleString("en-GB")} enquiries</span></div>
      {data.spend.length > 0 && <table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className={th}>Date</th><th className={th}>Where</th><th className={th}>Advert</th><th className={`${th} text-right`}>Spend</th><th className={`${th} text-right`}>Seen</th><th className={`${th} text-right`}>Clicks</th><th className={`${th} text-right`}>Enquiries</th><th className={`${th} text-right`}>Cost per click</th><th className={th} /></tr></thead><tbody>{data.spend.map((row) => <tr key={row.id} className="border-t border-slate-100"><td className={td}>{date(row.day)}</td><td className={td}>{row.provider}</td><td className={`${td} text-slate-500`}>{row.externalCampaign || "—"}</td><td className={`${td} text-right tabular-nums`}>{cash(row.spendMinor)}</td><td className={`${td} text-right tabular-nums`}>{row.impressions.toLocaleString("en-GB")}</td><td className={`${td} text-right tabular-nums`}>{row.clicks.toLocaleString("en-GB")}</td><td className={`${td} text-right tabular-nums`}>{row.conversions.toLocaleString("en-GB")}</td><td className={`${td} text-right tabular-nums text-slate-500`}>{row.clicks ? `£${(row.spendMinor / row.clicks / 100).toFixed(2)}` : "—"}</td><td className={`${td} text-right`}>{manage && <form action={deletePaidSpendAction}>{hidden}<input type="hidden" name="id" value={row.id} /><button className="text-xs text-red-700">Remove</button></form>}</td></tr>)}</tbody></table>}
      {manage && <div className="border-t border-slate-200 p-4"><ActionForm action={addPaidSpendAction} label="Add spend">{hidden}<div className="grid gap-3 sm:grid-cols-4">
        <label className="block text-xs font-medium">Date<input name="day" type="date" defaultValue={iso(today)} className={field} /></label>
        <label className="block text-xs font-medium">Where<select name="provider" className={field}>{AD_PROVIDERS.map((provider) => <option key={provider}>{provider}</option>)}</select></label>
        <label className="block text-xs font-medium sm:col-span-2">Advert or ad set<input name="externalCampaign" maxLength={200} placeholder="Search: drainage contractors" className={field} /></label>
        <label className="block text-xs font-medium">Spend<input name="spend" inputMode="decimal" placeholder="0.00" className={field} /></label>
        <label className="block text-xs font-medium">Times seen<input name="impressions" type="number" min={0} className={field} /></label>
        <label className="block text-xs font-medium">Clicks<input name="clicks" type="number" min={0} className={field} /></label>
        <label className="block text-xs font-medium">Enquiries<input name="conversions" type="number" min={0} className={field} /></label>
      </div></ActionForm></div>}
    </div>
  </>;

  const top = Math.max(1, ...results.channels.map(([, count]) => count));
  const resultsTab = <>
    <div className={`${card} grid gap-6 sm:grid-cols-2`}>
      <Progress label="Leads" actual={results.leads} target={c.targetLeads} text={`${results.leads} of ${c.targetLeads || "—"}`} />
      <Progress label="Customers reached" actual={results.customers} target={c.targetCustomers} text={`${results.customers} of ${c.targetCustomers || "—"}`} />
      <Progress label="Pipeline" actual={results.pipeline + results.wonValue} target={c.targetPipelineMinor} text={`${cash(results.pipeline + results.wonValue)} of ${c.targetPipelineMinor ? cash(c.targetPipelineMinor) : "—"}`} />
      <Progress label="Revenue from orders" actual={results.revenue} target={c.targetRevenueMinor} text={`${cash(results.revenue)} of ${c.targetRevenueMinor ? cash(c.targetRevenueMinor) : "—"}`} />
    </div>
    <div className="grid gap-3 sm:grid-cols-4">{[["People reached", results.people.toLocaleString("en-GB")], ["Leads passed to sales", results.handed], ["Cost per lead", results.costPerLead != null ? cash(results.costPerLead) : "—"], ["Return on spend", results.returnOn != null ? `${results.returnOn >= 0 ? "+" : ""}${Math.round(results.returnOn * 100)}%` : "—"]].map(([label, value]) => <div key={label} className={card}><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p></div>)}</div>
    <div className="grid gap-5 lg:grid-cols-2">
      <div className={card}><h3 className="font-semibold">Where responses came from</h3>{results.channels.length ? <div className="mt-3 space-y-2.5">{results.channels.map(([channel, count]) => <div key={channel} className="flex items-center gap-3 text-sm"><span className="w-28 shrink-0 truncate">{words(channel)}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${(count / top) * 100}%` }} /></div><span className="w-10 text-right tabular-nums text-slate-500">{count}</span></div>)}</div> : <p className="mt-2 text-sm text-slate-500">No responses recorded yet. They appear here when people open, click or enquire through this campaign&apos;s tracked links.</p>}</div>
      <div className={card}><h3 className="font-semibold">Deals from this campaign</h3>{data.deals.length ? <div className="mt-2 divide-y divide-slate-100">{data.deals.slice(0, 12).map((deal) => <Link key={deal.id} href={`/crm/opportunities/${deal.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="min-w-0"><span className="block truncate font-medium">{deal.name}</span><span className="text-xs text-slate-500">{deal.party.name}</span></span><span className="flex shrink-0 items-center gap-3"><span className="tabular-nums">{money(deal.valueAmount, deal.valueCurrency)}</span><StatusPill label={words(deal.status)} tone={deal.status === "WON" ? "success" : deal.status === "LOST" ? "danger" : "neutral"} /></span></Link>)}</div> : <p className="mt-2 text-sm text-slate-500">No deals name this campaign yet. Put <span className="font-medium text-slate-700">{c.code}</span> in the Campaign box on a deal in CRM and it shows here.</p>}</div>
    </div>
    {data.seeSales && <div className={card}><h3 className="font-semibold">Orders from customers this campaign reached</h3>{data.influenced.length ? <div className="mt-2 divide-y divide-slate-100">{data.influenced.map((order) => <Link key={order.id} href={`/sales/orders/${order.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span><span className="font-medium">{order.reference}</span><span className="ml-2 text-slate-500">{order.party.name}</span></span><span className="flex items-center gap-4"><span className="text-slate-500">{date(order.createdAt)}</span><span className="tabular-nums">{cash(order.netAmount)}</span></span></Link>)}</div> : <p className="mt-2 text-sm text-slate-500">No confirmed orders yet from customers reached by this campaign.</p>}<p className="mt-3 text-xs text-slate-400">Confirmed sales orders placed after the customer first responded to this campaign.</p></div>}
  </>;

  const content = <>
    <div className={card}><h3 className="font-semibold">Tracked link</h3><p className="mb-3 mt-1 text-sm text-slate-500">Use a tracked link in every email, post and advert so the results are credited to this campaign.</p><TrackingLink campaign={c.utmCampaign || c.code.toLowerCase()} channels={c.channels} /></div>
    <div className="grid gap-5 lg:grid-cols-2">
      <div className={card}><div className="flex items-center justify-between"><h3 className="font-semibold">Emails and messages</h3><Link href="/marketing/messages" className="text-sm text-blue-600">Write a message</Link></div>{data.messages.length ? <div className="mt-2 divide-y divide-slate-100">{data.messages.map((message) => <div key={message.id} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="min-w-0"><span className="block truncate font-medium">{message.name}</span><span className="block truncate text-xs text-slate-500">{words(message.channel)} · {message.subject}</span></span><StatusPill label={words(message.status)} tone={message.status === "SENT" ? "success" : "neutral"} /></div>)}</div> : <p className="mt-2 text-sm text-slate-500">No messages are attached to this campaign yet.</p>}</div>
      <div className={card}><div className="flex items-center justify-between"><h3 className="font-semibold">Social posts</h3><Link href="/marketing/social" className="text-sm text-blue-600">Schedule a post</Link></div>{data.posts.length ? <div className="mt-2 divide-y divide-slate-100">{data.posts.map((post) => <div key={post.id} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="min-w-0"><span className="line-clamp-2">{post.caption}</span><span className="text-xs text-slate-500">{post.publishedAt ? `Published ${date(post.publishedAt)}` : post.scheduledAt ? `Scheduled ${date(post.scheduledAt)}` : "Not scheduled"}</span></span><StatusPill label={words(post.status)} tone={post.status === "PUBLISHED" ? "success" : post.status === "FAILED" ? "danger" : "neutral"} /></div>)}</div> : <p className="mt-2 text-sm text-slate-500">No social posts are attached to this campaign yet.</p>}</div>
    </div>
  </>;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><Link href={`/marketing?focus=${c.id}`} className="text-sm text-blue-600">← Campaigns</Link><p className="mt-2 text-xs font-medium text-slate-500">{c.code} · {words(c.type)}{c.isProgramme ? " · Programme" : ""}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{c.name}</h1><p className="mt-1 text-sm text-slate-500">{data.owner} · {date(c.startAt)} – {date(c.endAt)}{c.goal ? ` · ${c.goal}` : ""}</p></div>
      <div className="flex flex-wrap items-center gap-2"><StatusPill label={STAGE_LABEL[c.status] ?? words(c.status)} tone={campaignTone(c.status)} />{manage && next.map((status) => <form key={status} action={updateCampaign}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="version" value={c.version} /><input type="hidden" name="status" value={status} /><button className={`rounded-xl px-3 py-2 text-sm font-medium ${status === "CANCELLED" ? "text-red-700" : "border border-slate-200 bg-white"}`}>{status === "CANCELLED" ? "Cancel campaign" : `Move to ${(STAGE_LABEL[status] ?? words(status)).toLowerCase()}`}</button></form>)}</div>
    </div>
    <ol className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white text-xs font-medium">{STAGE_ORDER.map((status, index) => <li key={status} className={`flex-1 border-r border-slate-200 px-3 py-2.5 text-center last:border-0 ${index === stage ? "bg-blue-600 text-white" : stage > index ? "bg-blue-50 text-blue-700" : "text-slate-400"}`}>{STAGE_LABEL[status]}</li>)}</ol>
    {!c.audienceId && ["PLANNING", "CONTENT", "APPROVAL"].includes(c.status) && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Choose an audience in the Brief tab before this campaign can be scheduled.</p>}
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{[["Budget", cash(c.budgetMinor)], ["Spent", cash(totals.actual)], ["Leads", c.targetLeads ? `${results.leads} / ${c.targetLeads}` : results.leads], ["Pipeline", cash(results.pipeline)], ["Revenue", cash(results.revenue)], ["Plan", `${doneCount} / ${data.activities.length} done`]].map(([label, value]) => <div key={label} className={card}><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{value}</p></div>)}</div>
    <Tabs tabs={[{ id: "overview", label: "Overview", content: overview }, { id: "brief", label: "Brief", content: brief }, { id: "plan", label: "Plan", count: data.activities.length, content: plan }, { id: "budget", label: "Budget", count: data.lines.length, content: budget }, { id: "results", label: "Results", content: resultsTab }, { id: "content", label: "Content and links", count: data.messages.length + data.posts.length, content }]} />
  </div>;
}
