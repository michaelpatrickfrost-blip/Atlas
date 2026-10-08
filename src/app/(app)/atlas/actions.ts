"use server";
import { assertUserProvisioner } from "@/core/admin/access";
import {randomBytes} from 'node:crypto';
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {db} from '@/core/db/client';
import {getImplementedModules} from '@/core/modules/registry';
import {STANDARD_ROLES} from '@/core/permissions/capabilities';
import {createRecoveryCredential} from '@/core/auth/recovery';
import {revalidatePath} from 'next/cache';
import bcrypt from 'bcryptjs';
import {wipeTestCompanies} from '@/core/admin/wipe-company';
export async function updateCompanyAccount(form:FormData){
 const session=await requireSession();
 assertCapability(session,'atlas.companies.manage');
 const organisationId=String(form.get('organisationId')),status=String(form.get('status')),subscriptionStatus=String(form.get('subscriptionStatus')),name=String(form.get('name')??'').trim(),planName=String(form.get('planName')??'').trim(),trial=String(form.get('trialEndsAt')??''),trialEndsAt=trial?new Date(`${trial}T23:59:59.999Z`):null,isTest=form.get('isTest')==='on';
 if(!name||name.length>150||!planName||planName.length>100||!['ACTIVE','SUSPENDED'].includes(status)||!['TRIAL','ACTIVE','PAST_DUE','CANCELLED'].includes(subscriptionStatus)||(trialEndsAt&&isNaN(trialEndsAt.getTime())))throw new Error('Enter valid account details.');
 if(organisationId===session.organisationId&&status==='SUSPENDED')throw new Error('You cannot suspend your current workspace.');
 const before=await db.organisation.findUniqueOrThrow({where:{id:organisationId}});
 if(before.kind==='INTERNAL')throw new Error('The Atlas internal workspace is managed through Atlas team.');
 if(before.archivedAt)throw new Error('Restore this company from Archive & export before changing its account.');
 if(isTest!==before.isTest)throw new Error('The test designation is fixed when a company is created. Real companies must be archived, not wiped.');
 await db.$transaction(async tx=>{await tx.organisation.update({where:{id:organisationId,archivedAt:null,kind:'CUSTOMER'},data:{name,status,subscriptionStatus,planName,trialEndsAt,isTest}});await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:'atlas.company.updated',entityType:'Organisation',entityId:organisationId,before:{name:before.name,status:before.status,subscriptionStatus:before.subscriptionStatus,isTest:before.isTest},after:{name,status,subscriptionStatus,planName,isTest}}});});
 revalidatePath('/atlas');revalidatePath(`/atlas/${organisationId}`);
}
export async function saveCompanyEntitlements(form:FormData){
 const session=await requireSession();
 assertCapability(session,'atlas.companies.manage');
 const organisationId=String(form.get('organisationId')),ids=form.getAll('moduleId').map(String),modules=getImplementedModules();
 await db.organisation.findFirstOrThrow({where:{id:organisationId,kind:'CUSTOMER',archivedAt:null}});
 if(ids.some(id=>!modules.some(m=>m.id===id)))throw new Error('Unknown or unimplemented module.');
 for(const m of modules.filter(m=>ids.includes(m.id)))if(m.dependencies.some(dep=>!ids.includes(dep)))throw new Error(`${m.name} requires its dependent apps to be included.`);
 await db.$transaction(async tx=>{for(const m of modules){const entitled=ids.includes(m.id);await tx.moduleState.upsert({where:{organisationId_moduleId:{organisationId,moduleId:m.id}},create:{organisationId,moduleId:m.id,entitled,enabled:false},update:{entitled,...(!entitled?{enabled:false}:{})}});}await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:'atlas.entitlements.updated',entityType:'Organisation',entityId:organisationId,after:{moduleIds:ids}}});});
 revalidatePath(`/atlas/${organisationId}`);revalidatePath('/apps');revalidatePath('/home');
}
export async function createCompanyAccount(form:FormData){
 const session=await requireSession();
 assertCapability(session,'atlas.companies.manage');
  assertUserProvisioner(session);
 const name=String(form.get('name')??'').trim(),ownerName=String(form.get('ownerName')??'').trim(),email=String(form.get('email')??'').trim().toLowerCase();
 if(!name||name.length>150||!ownerName||ownerName.length>100||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw new Error('Enter the company, administrator name and a valid email.');
 if(await db.user.findUnique({where:{email}}))throw new Error('This account already exists. A verified invitation flow is needed to join it to another company.');
 const credential=createRecoveryCredential(),passwordHash=await bcrypt.hash(randomBytes(32).toString('hex'),12);
 const organisationId=await db.$transaction(async tx=>{const organisation=await tx.organisation.create({data:{name,slug:`company-${crypto.randomUUID()}`,isTest:form.get('isTest')==='on',trialEndsAt:new Date(Date.now()+14*86400000)}}),user=await tx.user.create({data:{name:ownerName,email,passwordHash}}),membership=await tx.membership.create({data:{organisationId:organisation.id,userId:user.id}});for(const role of STANDARD_ROLES){const created=await tx.role.create({data:{organisationId:organisation.id,key:role.key,name:role.name,capabilities:role.capabilities}});if(role.key==='admin')await tx.roleOnMembership.create({data:{membershipId:membership.id,roleId:created.id}});}await tx.passwordReset.create({data:{membershipId:membership.id,tokenHash:credential.tokenHash,expiresAt:credential.expiresAt}});await tx.moduleState.createMany({data:getImplementedModules().map(m=>({organisationId:organisation.id,moduleId:m.id,entitled:true,enabled:true}))});await tx.auditEntry.create({data:{organisationId:organisation.id,actorUserId:session.userId,action:'atlas.company.created',entityType:'Organisation',entityId:organisation.id,after:{name,administratorUserId:user.id}}});return organisation.id;});
 revalidatePath('/atlas');
 return {organisationId,code:credential.code,expiresAt:credential.expiresAt.toISOString()};
}

export async function deleteTestCompany(form:FormData){
 const session=await requireSession();
 assertCapability(session,'atlas.companies.archive');
 const organisationId=String(form.get('organisationId')??''),typedName=String(form.get('confirmName')??'').trim();
 const org=await db.organisation.findUnique({where:{id:organisationId}});
 if(!org)throw new Error('Company not found.');
 if(org.kind==='INTERNAL')throw new Error('The Atlas staff workspace cannot be deleted.');
 if(!org.isTest)throw new Error('Only companies created as Test can be deleted. Archive a real company instead.');
 if(org.id===session.organisationId)throw new Error('Switch to another company before deleting this one.');
 if(typedName!==org.name)throw new Error('Type the company name exactly to confirm.');
 await wipeTestCompanies([organisationId],{actorUserId:session.userId,currentOrganisationId:session.organisationId,selection:[{id:org.id,name:org.name,updatedAt:org.updatedAt.toISOString()}]});
 console.info(`atlas.company.deleted org=${organisationId} name=${JSON.stringify(org.name)} by=${session.userId}`);
 revalidatePath('/atlas');
}
