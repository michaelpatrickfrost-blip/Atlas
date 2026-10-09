"use server";
import { assertBusinessUserProvisioner } from "@/core/admin/access";
import {validNewPassword} from "@/core/auth/recovery";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES, CUSTOMER_CAPABILITIES, SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { COMPANY_ACCESS_AREAS } from "@/core/permissions/company-access";
import { companyProfileSchema, readCompanyProfile } from "@/core/setup/company-profile";
import { assertPrintableAccent } from "@/core/documents/company-brand";
import { managerPolicySchema } from "@/core/permissions/manager-level";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/core/audit/log";
import { MODULE_CATALOGUE } from "@/core/modules/registry";
export async function saveRole(form: FormData) {
 const session = await requireSession();
 assertCapability(session, CORE_CAPABILITIES.rolesManage);
 const id = String(form.get("roleId"));
 const known = new Set([...Object.values(CORE_CAPABILITIES), ...Object.values(CUSTOMER_CAPABILITIES), ...Object.values(SALES_CAPABILITIES), ...MODULE_CATALOGUE.flatMap(m => m.capabilities)]);
 const capabilities = [...new Set(form.getAll("capability").map(String))];
 if (capabilities.some(c => !known.has(c))) throw new Error("Unknown permission.");
 await db.$transaction(async tx => {
  const role = await tx.role.findFirstOrThrow({where:{id, organisationId:session.organisationId}});
  const own = await tx.roleOnMembership.findFirst({where:{roleId:id, membershipId:session.membershipId}});
  if (own && [CORE_CAPABILITIES.rolesManage, CORE_CAPABILITIES.usersManage].some(c => role.capabilities.includes(c) && !capabilities.includes(c))) throw new Error("You cannot remove your own access administration permissions.");
  await tx.role.update({where:{id, organisationId:session.organisationId}, data:{capabilities}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"role.permissions.changed",entityType:"Role",entityId:id,before:{capabilities:role.capabilities},after:{capabilities}}});
 });
 await writeAudit({organisationId:session.organisationId, actorUserId:session.userId, action:"role.permissions.updated", entityType:"Role", entityId:id, after:{capabilities}});
 revalidatePath("/", "layout");
}
export async function saveMemberRoles(form: FormData) {
 const session = await requireSession();
 assertCapability(session, CORE_CAPABILITIES.usersManage);
 const membershipId = String(form.get("membershipId"));
 if (membershipId === session.membershipId) throw new Error("Ask another administrator to change your own roles.");
 const roleIds = [...new Set(form.getAll("roleId").map(String))];
 await db.$transaction(async tx => {
  await tx.membership.findFirstOrThrow({where:{id:membershipId, organisationId:session.organisationId}});
  const roles = await tx.role.findMany({where:{id:{in:roleIds}, organisationId:session.organisationId}});
  if (roles.length !== roleIds.length) throw new Error("Invalid role.");
  await tx.roleOnMembership.deleteMany({where:{membershipId}});
  await tx.roleOnMembership.createMany({data:roleIds.map(roleId => ({membershipId, roleId}))});
 });
 await writeAudit({organisationId:session.organisationId, actorUserId:session.userId, action:"membership.roles.updated", entityType:"Membership", entityId:membershipId, after:{roleIds}});
 revalidatePath("/", "layout");
}

export async function createUser(form:FormData) {
 const session = await requireSession();
 assertCapability(session,CORE_CAPABILITIES.usersManage);
  assertBusinessUserProvisioner(session);
 const name=String(form.get("name")??"").trim(), email=String(form.get("email")??"").trim().toLowerCase(),password=String(form.get("password")??"");
 if(!name || name.length>100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254 || !validNewPassword(password)) throw new Error("Enter a name, valid email and a password with 12–128 characters.");
 const roleIds=[...new Set(form.getAll("roleId").map(String))];
 const {default:bcrypt}=await import("bcryptjs");
 const passwordHash=await bcrypt.hash(password,12);
 await db.$transaction(async tx=>{
  const roles=await tx.role.findMany({where:{id:{in:roleIds},organisationId:session.organisationId}});
  if(roles.length!==roleIds.length) throw new Error("Invalid role.");
  if(await tx.user.findUnique({where:{email}})) throw new Error("This email is already registered. Use another email; adding existing accounts requires an invitation flow.");
  const user=await tx.user.create({data:{email,name,passwordHash}});
  await tx.membership.create({data:{organisationId:session.organisationId,userId:user.id,roles:{create:roleIds.map(roleId=>({roleId}))}}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"user.created",entityType:"User",entityId:user.id,after:{name,email,roleIds}}});
 });
 revalidatePath("/settings");
}

export async function saveCompanyAccess(form:FormData){
 const session=await requireSession();
 assertCapability(session,CORE_CAPABILITIES.modulesManage);
 const restrictedAccessAreas=COMPANY_ACCESS_AREAS.map(area=>area.id).filter(id=>form.get(`allow_${id}`)!=='on');
 await db.$transaction(async tx=>{const before=await tx.organisation.findUniqueOrThrow({where:{id:session.organisationId},select:{restrictedAccessAreas:true}});await tx.organisation.update({where:{id:session.organisationId},data:{restrictedAccessAreas}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'company.workspace_access.updated',entityType:'Organisation',entityId:session.organisationId,before,after:{restrictedAccessAreas}}});});
 revalidatePath('/','layout');
}

export async function saveCompanyProfile(form:FormData){
 const session=await requireSession();
 assertCapability(session,CORE_CAPABILITIES.modulesManage);
 const patch={
  legalName:String(form.get('legalName')??'').trim(),
  tradingName:String(form.get('tradingName')??'').trim(),
  registrationNumber:String(form.get('registrationNumber')??'').trim(),
  vatNumber:String(form.get('vatNumber')??'').trim(),
  industry:String(form.get('industry')??'').trim(),
  website:String(form.get('website')??'').trim(),
  phone:String(form.get('phone')??'').trim(),
  email:String(form.get('email')??'').trim(),
  addressLine1:String(form.get('addressLine1')??'').trim(),
  city:String(form.get('city')??'').trim(),
  postcode:String(form.get('postcode')??'').trim(),
  country:String(form.get('country')??'GB').trim().toUpperCase(),
  timezone:String(form.get('timezone')??'Europe/London'),
  defaultCurrency:String(form.get('defaultCurrency')??'GBP').trim().toUpperCase(),
  fiscalYearStartMonth:Number(form.get('fiscalYearStartMonth')??4),
  locale:String(form.get('locale')??'en-GB'),
 };
 await db.$transaction(async tx=>{
  const before=await tx.organisation.findUniqueOrThrow({where:{id:session.organisationId},select:{companyProfile:true}});
  const parsed=companyProfileSchema.safeParse({...readCompanyProfile(before.companyProfile),...patch});
  if(!parsed.success)throw new Error(parsed.error.issues[0]?.message??'Check the company profile.');
  await tx.organisation.update({where:{id:session.organisationId},data:{companyProfile:parsed.data}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'company.profile.updated',entityType:'Organisation',entityId:session.organisationId,before,after:{companyProfile:parsed.data}}});
 });
 revalidatePath('/','layout');
}

function managerLimit(form: FormData, key: string) {
  const value = Number(form.get(key));
  if (!Number.isFinite(value) || value < 0 || value > 21474836) throw new Error("Enter a sign-off amount.");
  return Math.round(value * 100);
}

export async function saveManagerPolicy(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.modulesManage);
  const managerPolicy = managerPolicySchema.parse({
    crm: form.get("crm") === "on",
    finance: form.get("finance") === "on",
    financeLimitMinor: managerLimit(form, "financeLimit"),
    service: form.get("service") === "on",
    serviceLimitMinor: managerLimit(form, "serviceLimit"),
  });
  await db.$transaction(async (tx) => {
    const before = await tx.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { managerPolicy: true } });
    await tx.organisation.update({ where: { id: session.organisationId }, data: { managerPolicy } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "company.manager_level.updated", entityType: "Organisation", entityId: session.organisationId, before, after: { managerPolicy } } });
  });
  revalidatePath("/", "layout");
}

export async function saveWorkspaceDetails(form:FormData){
 const session=await requireSession();
 assertCapability(session,CORE_CAPABILITIES.modulesManage);
 const name=String(form.get('name')??'').trim();if(!name||name.length>120)throw new Error('Enter a company name up to 120 characters.');
 const data={name,allowCustomerCreation:form.get('allowCustomerCreation')==='on',allowProductCreation:form.get('allowProductCreation')==='on'};
 await db.$transaction(async tx=>{const before=await tx.organisation.findUniqueOrThrow({where:{id:session.organisationId},select:{name:true,allowCustomerCreation:true,allowProductCreation:true}});await tx.organisation.update({where:{id:session.organisationId},data});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'company.settings.updated',entityType:'Organisation',entityId:session.organisationId,before,after:data}});});revalidatePath('/','layout');
}

function clip(form: FormData, key: string, max: number) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function logoDataUrlFrom(bytes: Buffer) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return `data:image/png;base64,${bytes.toString("base64")}`;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return `data:image/webp;base64,${bytes.toString("base64")}`;
  const gif = bytes.subarray(0, 6).toString("ascii");
  if (gif === "GIF87a" || gif === "GIF89a") return `data:image/gif;base64,${bytes.toString("base64")}`;
  return null;
}

export async function saveCompanyBrand(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.modulesManage);
  const accentColour = assertPrintableAccent(String(form.get("accentColour") ?? ""));
  const patch = {
    legalName: clip(form, "legalName", 200),
    tradingName: clip(form, "tradingName", 200),
    registrationNumber: clip(form, "registrationNumber", 40),
    vatNumber: clip(form, "vatNumber", 40),
    website: clip(form, "website", 200),
    phone: clip(form, "phone", 40),
    email: clip(form, "email", 200),
    addressLine1: clip(form, "addressLine1", 200),
    city: clip(form, "city", 80),
    postcode: clip(form, "postcode", 20),
    country: clip(form, "country", 2).toUpperCase() || "GB",
    accentColour,
    tagline: clip(form, "tagline", 140),
    terms: clip(form, "terms", 8000),
    paymentDetails: clip(form, "paymentDetails", 1500),
    documentFooter: clip(form, "documentFooter", 400),
  };
  const remove = form.get("remove") === "on";
  const file = form.get("logo");
  let uploaded: string | null = null;
  if (!remove && file instanceof File && file.size > 0) {
    if (file.size > 350_000) throw new Error("Logo must be 350 KB or smaller.");
    uploaded = logoDataUrlFrom(Buffer.from(await file.arrayBuffer()));
    if (!uploaded) throw new Error("Use a PNG, JPG, WEBP or GIF logo. PNG or JPG is printed on invoices.");
  }
  await db.$transaction(async (tx) => {
    const before = await tx.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { companyProfile: true, logoDataUrl: true } });
    const parsed = companyProfileSchema.safeParse({ ...readCompanyProfile(before.companyProfile), ...patch });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the brand details.");
    const logoDataUrl = remove ? null : uploaded ?? before.logoDataUrl;
    await tx.organisation.update({ where: { id: session.organisationId }, data: { companyProfile: parsed.data, logoDataUrl } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "company.brand.updated", entityType: "Organisation", entityId: session.organisationId, before: { logo: before.logoDataUrl ? "set" : "empty" }, after: { logo: logoDataUrl ? "set" : "cleared", accentColour, termsLength: parsed.data.terms.length, paymentDetails: parsed.data.paymentDetails ? "set" : "empty" } } });
  });
  revalidatePath("/", "layout");
}
