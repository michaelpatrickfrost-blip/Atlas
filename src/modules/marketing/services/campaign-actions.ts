"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { parseCampaignDetails, mergeCampaignDetails } from "../domain/campaign-details";
import { moneyMinor } from "../domain/planning";
import { db } from "@/core/db/client";
import { requireSession, type Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { requireMarketing } from "./queries";
import { CAMPAIGN_TYPES } from "../domain/policy";
import { ACTIVITY_KINDS, ACTIVITY_STATUSES, AD_PROVIDERS, BUDGET_CATEGORIES, CAMPAIGN_CHANNELS, channelCategory, launchPlan } from "../domain/campaign";

class CampaignInputError extends Error {}
const checkedDetails=(form:FormData)=>{try{return parseCampaignDetails(form);}catch(error){throw new CampaignInputError(error instanceof Error?error.message:"Check the campaign details.");}};
const text = (form: FormData, name: string, max = 300) => String(form.get(name) ?? "").trim().slice(0, max);
const long = (form: FormData, name: string) => text(form, name, 5000);
const pounds = (form: FormData, name: string) => {const value=text(form,name,30);try{return value?moneyMinor(value):0;}catch(error){throw new CampaignInputError(error instanceof Error?error.message:"Check the amount.");}};
const whole = (form: FormData, name: string) => { const value = text(form, name, 12); if (!value) return 0; const number = Number(value); if (!Number.isInteger(number) || number < 0 || number > 100_000_000) throw new CampaignInputError("Enter a whole number, zero or more."); return number; };
const date = (form: FormData, name: string) => { const value = text(form, name, 10); if (!value) return null; const parsed = new Date(`${value}T00:00:00Z`); if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0,10)!==value) throw new CampaignInputError("Enter a valid date."); return parsed; };
const pick = <T extends string>(value: string, options: readonly T[], fallback: T) => (options.includes(value as T) ? (value as T) : fallback);

async function manager(capability = "marketing.campaign.manage") {
  const session = await requireSession();
  assertCapability(session, capability);
  await requireMarketing(session);
  return session;
}
async function owned(session: Session, id: string) {
  const campaign = await db.marketingCampaign.findFirst({ where: { id, organisationId: session.organisationId } });
  if (!campaign) throw new CampaignInputError("This campaign no longer exists.");
  return campaign;
}
const refresh = (id: string) => { revalidatePath("/marketing", "layout"); revalidatePath(`/marketing/campaigns/${id}`); };
const audit = (session: Session, action: string, entityId: string, after: object = {}, client: Pick<Prisma.TransactionClient,"auditEntry"> = db) => client.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: `marketing.${action}`, entityType: "MarketingCampaign", entityId, after } });

async function briefFields(session: Session, form: FormData) {
  const organisationId = session.organisationId;
  const name = text(form, "name", 250);
  if (!name) throw new CampaignInputError("Give the campaign a name.");
  const startAt = date(form, "startAt"), endAt = date(form, "endAt");
  if (startAt && endAt && endAt < startAt) throw new CampaignInputError("The end date must be after the start date.");
  const audienceId = text(form, "audienceId", 60) || null, productId = text(form, "productId", 60) || null, parentId = text(form, "parentId", 60) || null, ownerUserId = text(form, "ownerUserId", 60);
  if (audienceId && !(await db.marketingAudience.findFirst({ where: { id: audienceId, organisationId }, select: { id: true } }))) throw new CampaignInputError("Choose an audience from your list.");
  if (productId && !(await db.product.findFirst({ where: { id: productId, organisationId }, select: { id: true } }))) throw new CampaignInputError("Choose a product from the catalogue.");
  if (parentId && !(await db.marketingCampaign.findFirst({ where: { id: parentId, organisationId }, select: { id: true } }))) throw new CampaignInputError("Choose a programme from your campaigns.");
  if (ownerUserId && !(await db.membership.findFirst({ where: { organisationId, userId: ownerUserId, active:true }, select: { id: true } }))) throw new CampaignInputError("Choose an owner from your team.");
  const currency = text(form, "currency", 3).toUpperCase() || "GBP";
  if (!/^[A-Z]{3}$/.test(currency)) throw new CampaignInputError("Currency is a three-letter code, for example GBP.");
  return {
    name, description: long(form, "description"), type: pick(text(form, "type", 40), CAMPAIGN_TYPES, "CUSTOM"), startAt, endAt, audienceId, productId, parentId, currency,
    objective: long(form, "objective"), businessGoal: long(form, "businessGoal"), targetMarket: long(form, "targetMarket"), persona: long(form, "persona"), positioning: long(form, "positioning"), message: long(form, "message"), offer: long(form, "offer"), cta: text(form, "cta", 300),
    channels: [...new Set(form.getAll("channels").map(String).filter((channel) => (CAMPAIGN_CHANNELS as readonly string[]).includes(channel)))],
    budgetMinor: pounds(form, "budget"), targetLeads: whole(form, "targetLeads"), targetCustomers: whole(form, "targetCustomers"), targetPipelineMinor: pounds(form, "targetPipeline"), targetRevenueMinor: pounds(form, "targetRevenue"),
    goal: text(form, "goal", 300), risks: long(form, "risks"), dependencies: long(form, "dependencies"), teamName: text(form, "teamName", 150), region: text(form, "region", 150), language: text(form, "language", 40) || "en", ...(form.has("brand")?{brand:text(form,"brand",100)||"DEFAULT"}:{}),
    utmCampaign: text(form, "utmCampaign", 150).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, ""), isProgramme: form.get("isProgramme") === "on",
    ...(ownerUserId ? { ownerUserId } : {}),
  };
}

export async function createCampaignAction(form:FormData) {
  const session=await requireSession();
  assertCapability(session,"marketing.campaign.create");
  try {return await createCampaignDraft(session,form);}catch(error){if(error instanceof CampaignInputError)return {error:error.message};throw error;}
}
async function createCampaignDraft(session:Session,form: FormData) {
  await requireMarketing(session);
  const data = await briefFields(session, form);
  const details=form.get('briefWorkspace')==='1'?checkedDetails(form):null;
  const typed = text(form, "code", 50).toUpperCase().replace(/[^A-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  const split = data.channels.map(channel=>({channel,plannedMinor:pounds(form,`split:${channel}`)})).filter(row=>row.plannedMinor>0);
  if(split.reduce((total,row)=>total+row.plannedMinor,0)>data.budgetMinor)throw new CampaignInputError('Channel allocations exceed the campaign budget.');
  const campaign=await db.$transaction(async tx=>{
    const count=await tx.marketingCampaign.count({where:{organisationId:session.organisationId}});
    const code=typed||`CMP-${String(count+1).padStart(4,"0")}`;
    if(await tx.marketingCampaign.findFirst({where:{organisationId:session.organisationId,code},select:{id:true}}))throw new CampaignInputError(`The code ${code} is already used by another campaign.`);
    const row=await tx.marketingCampaign.create({data:{...data,...(details?{brief:mergeCampaignDetails({},details) as Prisma.InputJsonValue}:{}),ownerUserId:data.ownerUserId??session.userId,organisationId:session.organisationId,code,utmCampaign:data.utmCampaign||code.toLowerCase()}});
    const month=data.startAt?.toISOString().slice(0,7)??'';
    if(split.length)await tx.marketingBudgetLine.createMany({data:split.map(line=>({organisationId:session.organisationId,campaignId:row.id,category:channelCategory(line.channel),label:line.channel,month,plannedMinor:line.plannedMinor,forecastMinor:line.plannedMinor}))});
    if(form.get("seedPlan")==="on")await tx.marketingActivity.createMany({data:launchPlan(data.channels,data.startAt,data.endAt).map(step=>({...step,organisationId:session.organisationId,campaignId:row.id,ownerUserId:row.ownerUserId}))});
    await audit(session,"campaign.created",row.id,{code,name:data.name},tx);
    return row;
  },{isolationLevel:'Serializable'});
  refresh(campaign.id);
  redirect(`/marketing/campaigns/${campaign.id}`);
}

export async function saveCampaignBriefAction(form:FormData) {
  const session=await requireSession();
  assertCapability(session,"marketing.campaign.manage");
  try {return await saveCampaignBrief(session,form);}catch(error){if(error instanceof CampaignInputError)return {error:error.message};throw error;}
}
async function saveCampaignBrief(session:Session,form: FormData) {
  await requireMarketing(session);
  const campaign=await owned(session,text(form,"campaignId",60));
  const data=await briefFields(session,form);
  if(data.parentId===campaign.id)throw new CampaignInputError('A campaign cannot be part of itself.');
  const version=Number(form.get('version'));
  if(!Number.isSafeInteger(version)||version<1)throw new CampaignInputError('Refresh the campaign before saving.');
  const details=form.get('briefWorkspace')==='1'?checkedDetails(form):null;
  await db.$transaction(async tx=>{
    const changed=await tx.marketingCampaign.updateMany({where:{id:campaign.id,organisationId:session.organisationId,version},data:{...data,...(details?{brief:mergeCampaignDetails(campaign.brief,details) as Prisma.InputJsonValue}:{}),version:{increment:1}}});
    if(changed.count!==1)throw new CampaignInputError('This campaign changed. Refresh before saving; your entered details are still here.');
    await audit(session,"campaign.brief_saved",campaign.id,{name:data.name},tx);
  });
  refresh(campaign.id);
}

export async function saveBudgetLineAction(form: FormData) {
  const session = await manager();
  const campaign = await owned(session, text(form, "campaignId", 60)), id = text(form, "id", 60);
  const month = text(form, "month", 7);
  if (month && !/^\d{4}-\d{2}$/.test(month)) throw new Error("Choose the month.");
  const data = { category: pick(text(form, "category", 40), BUDGET_CATEGORIES, "Other"), label: text(form, "label", 200), month, plannedMinor: pounds(form, "planned"), committedMinor: pounds(form, "committed"), actualMinor: pounds(form, "actual"), forecastMinor: pounds(form, "forecast") };
  if (!data.label) throw new Error("Say what this money is for.");
  if (id) { const changed = await db.marketingBudgetLine.updateMany({ where: { id, campaignId: campaign.id, organisationId: session.organisationId }, data }); if (!changed.count) throw new Error("This budget line no longer exists."); }
  else await db.marketingBudgetLine.create({ data: { ...data, organisationId: session.organisationId, campaignId: campaign.id } });
  await audit(session, "campaign.budget_line_saved", campaign.id, { label: data.label, plannedMinor: data.plannedMinor, actualMinor: data.actualMinor });
  refresh(campaign.id);
}

export async function deleteBudgetLineAction(form: FormData) {
  const session = await manager();
  const campaign = await owned(session, text(form, "campaignId", 60));
  await db.marketingBudgetLine.deleteMany({ where: { id: text(form, "id", 60), campaignId: campaign.id, organisationId: session.organisationId } });
  refresh(campaign.id);
}

export async function saveActivityAction(form: FormData) {
  const session = await manager();
  const campaign = await owned(session, text(form, "campaignId", 60)), id = text(form, "id", 60);
  const name = text(form, "name", 250);
  if (!name) throw new Error("Name the activity.");
  const startAt = date(form, "startAt"), endAt = date(form, "endAt");
  if (startAt && endAt && endAt < startAt) throw new Error("The end date must be after the start date.");
  const ownerUserId = text(form, "ownerUserId", 60) || null;
  if (ownerUserId && !(await db.membership.findFirst({ where: { organisationId: session.organisationId, userId: ownerUserId }, select: { id: true } }))) throw new Error("Choose an owner from your team.");
  const data = { name, channel: text(form, "channel", 60), kind: pick(text(form, "kind", 30), ACTIVITY_KINDS, "TASK"), status: pick(text(form, "status", 30), ACTIVITY_STATUSES, "PLANNED"), phase: text(form, "phase", 40), startAt, endAt, ownerUserId, notes: long(form, "notes"), costMinor: pounds(form, "cost") };
  if (id) { const changed = await db.marketingActivity.updateMany({ where: { id, campaignId: campaign.id, organisationId: session.organisationId }, data }); if (!changed.count) throw new Error("This activity no longer exists."); }
  else await db.marketingActivity.create({ data: { ...data, organisationId: session.organisationId, campaignId: campaign.id } });
  refresh(campaign.id);
}

export async function setActivityStatusAction(form: FormData) {
  const session = await manager();
  const campaign = await owned(session, text(form, "campaignId", 60));
  await db.marketingActivity.updateMany({ where: { id: text(form, "id", 60), campaignId: campaign.id, organisationId: session.organisationId }, data: { status: pick(text(form, "status", 30), ACTIVITY_STATUSES, "PLANNED") } });
  refresh(campaign.id);
}

export async function deleteActivityAction(form: FormData) {
  const session = await manager();
  const campaign = await owned(session, text(form, "campaignId", 60));
  await db.marketingActivity.deleteMany({ where: { id: text(form, "id", 60), campaignId: campaign.id, organisationId: session.organisationId } });
  refresh(campaign.id);
}

export async function addPaidSpendAction(form: FormData) {
  const session = await manager();
  const campaign = await owned(session, text(form, "campaignId", 60));
  const day = date(form, "day");
  if (!day) throw new Error("Choose the date.");
  await db.marketingPaidSpend.create({ data: { organisationId: session.organisationId, campaignId: campaign.id, provider: pick(text(form, "provider", 40), AD_PROVIDERS, "Other"), account: text(form, "account", 150), externalCampaign: text(form, "externalCampaign", 200), day, spendMinor: pounds(form, "spend"), impressions: whole(form, "impressions"), clicks: whole(form, "clicks"), conversions: whole(form, "conversions"), importedBy: session.userId } });
  refresh(campaign.id);
}

export async function deletePaidSpendAction(form: FormData) {
  const session = await manager();
  const campaign = await owned(session, text(form, "campaignId", 60));
  await db.marketingPaidSpend.deleteMany({ where: { id: text(form, "id", 60), campaignId: campaign.id, organisationId: session.organisationId } });
  refresh(campaign.id);
}
