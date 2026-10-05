import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { requireMarketing } from "@/modules/marketing/services/queries";
import { campaignBriefOptions } from "@/modules/marketing/services/campaign-workspace";
import { CampaignBuilder } from "@/modules/marketing/components/campaign-builder";

export default async function NewCampaign() {
  const session = await requireSession();
  assertCapability(session, "marketing.campaign.create");
  await requireMarketing(session);
  const options = await campaignBriefOptions(session);
  return <div className="space-y-5">
    <div><Link href="/marketing" className="text-sm text-blue-600">← Campaigns</Link><h1 className="mt-2 text-2xl font-semibold tracking-tight">Build a campaign</h1><p className="mt-1 text-sm text-slate-500">Brief, audience, message, channels, budget and launch plan in one place.</p></div>
    <CampaignBuilder options={options} />
  </div>;
}
