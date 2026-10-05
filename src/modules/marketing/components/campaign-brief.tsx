import { CAMPAIGN_TYPES } from "../domain/policy";
import { CAMPAIGN_CHANNELS } from "../domain/campaign";
import { words } from "./format";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";
const group = "space-y-4 rounded-2xl border border-slate-200 bg-white p-5";
const iso = (value: Date | null | undefined) => (value ? value.toISOString().slice(0, 10) : "");
const pounds = (minor: number | undefined) => (minor ? (minor / 100).toFixed(2) : "");
export type BriefOptions = { audiences: { id: string; name: string }[]; products: { id: string; name: string; code: string }[]; members: { id: string; name: string }[]; programmes: { id: string; name: string }[] };
type Campaign = { name: string; code: string; description: string; type: string; ownerUserId: string; startAt: Date | null; endAt: Date | null; audienceId: string | null; productId: string | null; parentId: string | null; currency: string; objective: string; businessGoal: string; targetMarket: string; persona: string; positioning: string; message: string; offer: string; cta: string; channels: string[]; budgetMinor: number; targetLeads: number; targetCustomers: number; targetPipelineMinor: number; targetRevenueMinor: number; goal: string; risks: string; dependencies: string; teamName: string; region: string; language: string; utmCampaign: string; isProgramme: boolean };

function Area({ name, label, value, hint, rows = 3 }: { name: string; label: string; value?: string; hint?: string; rows?: number }) {
  return <label className="block text-xs font-medium">{label}<textarea name={name} rows={rows} maxLength={5000} defaultValue={value ?? ""} placeholder={hint} className={field} /></label>;
}

/** Every part of a campaign brief, in the order you would plan it. Used to start a campaign and to edit one. */
export function CampaignBriefFields({ campaign, options }: { campaign?: Campaign; options: BriefOptions }) {
  const c = campaign;
  return <div className="space-y-5">
    <fieldset className={group}><legend className="px-1 text-sm font-semibold">The campaign</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium sm:col-span-2">Campaign name<input name="name" required maxLength={250} defaultValue={c?.name} placeholder="Spring drainage range launch" className={field} /></label>
        {!c && <label className="block text-xs font-medium">Code (optional)<input name="code" maxLength={50} placeholder="Made for you if left blank" className={field} /></label>}
        <label className="block text-xs font-medium">Type<select name="type" defaultValue={c?.type ?? "LEAD_GENERATION"} className={field}>{CAMPAIGN_TYPES.map((type) => <option key={type} value={type}>{words(type)}</option>)}</select></label>
        <label className="block text-xs font-medium">Owner<select name="ownerUserId" defaultValue={c?.ownerUserId ?? ""} className={field}>{!c && <option value="">Me</option>}{options.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
        <label className="block text-xs font-medium">Team<input name="teamName" maxLength={150} defaultValue={c?.teamName} placeholder="Marketing, with Sales north" className={field} /></label>
        <label className="block text-xs font-medium">Starts<input name="startAt" type="date" defaultValue={iso(c?.startAt)} className={field} /></label>
        <label className="block text-xs font-medium">Ends<input name="endAt" type="date" defaultValue={iso(c?.endAt)} className={field} /></label>
        <label className="block text-xs font-medium">Part of a programme<select name="parentId" defaultValue={c?.parentId ?? ""} className={field}><option value="">Stands alone</option>{options.programmes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm"><input type="checkbox" name="isProgramme" defaultChecked={c?.isProgramme} className="size-4" />This is a programme that other campaigns sit under</label>
      </div>
      <Area name="description" label="Summary" value={c?.description} hint="One paragraph anyone in the business could read and understand." />
    </fieldset>

    <fieldset className={group}><legend className="px-1 text-sm font-semibold">Why we are doing it</legend>
      <Area name="objective" label="Objective" value={c?.objective} hint="What this campaign must achieve, in one or two sentences." />
      <Area name="businessGoal" label="Business goal it supports" value={c?.businessGoal} hint="Grow the contractor channel by 15% this year." rows={2} />
      <label className="block text-xs font-medium">Headline goal<input name="goal" maxLength={300} defaultValue={c?.goal} placeholder="120 qualified leads by the end of June" className={field} /></label>
    </fieldset>

    <fieldset className={group}><legend className="px-1 text-sm font-semibold">Who it is for</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium">Audience<select name="audienceId" defaultValue={c?.audienceId ?? ""} className={field}><option value="">Not chosen yet</option>{options.audiences.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        <label className="block text-xs font-medium">Product or range<select name="productId" defaultValue={c?.productId ?? ""} className={field}><option value="">Not tied to one product</option>{options.products.map((row) => <option key={row.id} value={row.id}>{row.code} · {row.name}</option>)}</select></label>
        <label className="block text-xs font-medium">Region<input name="region" maxLength={150} defaultValue={c?.region} placeholder="North West, UK" className={field} /></label>
        <label className="block text-xs font-medium">Language<input name="language" maxLength={40} defaultValue={c?.language ?? "en"} className={field} /></label>
      </div>
      <Area name="targetMarket" label="Target market" value={c?.targetMarket} hint="Groundworks contractors with 10 to 50 staff buying through merchants." rows={2} />
      <Area name="persona" label="The person we are talking to" value={c?.persona} hint="Contracts manager. Cares about delivery on the day and not being let down on site." rows={2} />
    </fieldset>

    <fieldset className={group}><legend className="px-1 text-sm font-semibold">What we are saying</legend>
      <Area name="positioning" label="Positioning" value={c?.positioning} hint="Why us, against the alternatives." rows={2} />
      <Area name="message" label="Key message" value={c?.message} hint="The one thing they should remember." rows={2} />
      <Area name="offer" label="Offer" value={c?.offer} hint="Free site survey, or 10% off first order before 30 June." rows={2} />
      <label className="block text-xs font-medium">Call to action<input name="cta" maxLength={300} defaultValue={c?.cta} placeholder="Book a site survey" className={field} /></label>
    </fieldset>

    <fieldset className={group}><legend className="px-1 text-sm font-semibold">Where it runs</legend>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">{CAMPAIGN_CHANNELS.map((channel) => <label key={channel} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" name="channels" value={channel} defaultChecked={c?.channels.includes(channel)} className="size-4" />{channel}</label>)}</div>
      <label className="block text-xs font-medium">Tracking name for links (UTM campaign)<input name="utmCampaign" maxLength={150} defaultValue={c?.utmCampaign} placeholder="spring-drainage-launch" className={field} /><span className="mt-1 block font-normal text-slate-500">Used on links so visits and leads are credited to this campaign.</span></label>
    </fieldset>

    <fieldset className={group}><legend className="px-1 text-sm font-semibold">Money and targets</legend>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-xs font-medium">Budget<input name="budget" inputMode="decimal" defaultValue={pounds(c?.budgetMinor)} placeholder="0.00" className={field} /></label>
        <label className="block text-xs font-medium">Currency<input name="currency" maxLength={3} defaultValue={c?.currency ?? "GBP"} className={field} /></label>
        <label className="block text-xs font-medium">Target leads<input name="targetLeads" type="number" min={0} defaultValue={c?.targetLeads || ""} className={field} /></label>
        <label className="block text-xs font-medium">Target new customers<input name="targetCustomers" type="number" min={0} defaultValue={c?.targetCustomers || ""} className={field} /></label>
        <label className="block text-xs font-medium">Target pipeline<input name="targetPipeline" inputMode="decimal" defaultValue={pounds(c?.targetPipelineMinor)} placeholder="0.00" className={field} /></label>
        <label className="block text-xs font-medium">Target revenue<input name="targetRevenue" inputMode="decimal" defaultValue={pounds(c?.targetRevenueMinor)} placeholder="0.00" className={field} /></label>
      </div>
    </fieldset>

    <fieldset className={group}><legend className="px-1 text-sm font-semibold">What could get in the way</legend>
      <Area name="risks" label="Risks" value={c?.risks} hint="Stock of the new range may not land before launch." rows={2} />
      <Area name="dependencies" label="Depends on" value={c?.dependencies} hint="Price list signed off; product photography; sales team briefed." rows={2} />
    </fieldset>
  </div>;
}
