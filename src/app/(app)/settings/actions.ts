"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES, CUSTOMER_CAPABILITIES, SALES_CAPABILITIES } from "@/core/permissions/capabilities";
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
 const name=String(form.get("name")??"").trim(), email=String(form.get("email")??"").trim().toLowerCase(),password=String(form.get("password")??"");
 if(!name || name.length>100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254 || password.length<12 || password.length>128) throw new Error("Enter a name, valid email and a password with 12–128 characters.");
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
