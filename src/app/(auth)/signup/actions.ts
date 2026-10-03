"use server";
import bcrypt from "bcryptjs";
import { db } from "@/core/db/client";
import { createSessionCookie } from "@/core/auth/session";
import { STANDARD_ROLES } from "@/core/permissions/capabilities";
import { getImplementedModules } from "@/core/modules/registry";
import { redirect } from "next/navigation";
export async function signup(_previous:{error:string},form:FormData):Promise<{error:string}> {
 const name=String(form.get("name")??"").trim(), company=String(form.get("company")??"").trim(), email=String(form.get("email")??"").trim().toLowerCase(),password=String(form.get("password")??"");
 if(!name || name.length>100 || !company || company.length>150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254 || password.length<12 || password.length>128) return {error:"Enter your name, company, valid email and a password with 12–128 characters."};
 if(await db.user.findUnique({where:{email}})) return {error:"Unable to create this account. Try signing in or use a different email."};
 const passwordHash=await bcrypt.hash(password,12);
 let token;
 try {
 token=await db.$transaction(async tx=>{
  const user=await tx.user.create({data:{name,email,passwordHash}});
  const organisation=await tx.organisation.create({data:{name:company,slug:`${company.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,50)}-${crypto.randomUUID().slice(0,8)}`}});
  const roles=await Promise.all(STANDARD_ROLES.map(role=>tx.role.create({data:{...role,organisationId:organisation.id}})));
  const admin=roles.find(role=>role.key==="admin")!;
  await tx.membership.create({data:{organisationId:organisation.id,userId:user.id,roles:{create:{roleId:admin.id}}}});
  await tx.moduleState.createMany({data:getImplementedModules().map(module=>({organisationId:organisation.id,moduleId:module.id,enabled:true,entitled:true}))});
  await tx.auditEntry.create({data:{organisationId:organisation.id,actorUserId:user.id,action:"workspace.created",entityType:"Organisation",entityId:organisation.id}});
  return {userId:user.id,organisationId:organisation.id};
 });
 }catch{return {error:"Unable to create this workspace. Try again with a different email."};}
 await createSessionCookie(token);
 redirect("/home");
}
