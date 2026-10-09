"use server";
import bcrypt from 'bcryptjs';
import {headers} from 'next/headers';
import {signInAddress} from './address-context';
import {db} from '@/core/db/client';
import {requireSession,createSessionCookie,clearSessionCookie} from './session';
import {assertCapability} from '@/core/permissions/check';
import {hashRecoveryCode,validNewPassword} from './recovery';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {platformCapabilities} from '@/core/admin/access';
/** Public recovery is authorised by possession of a hashed, single-use credential. */
export async function completePasswordRecovery(form:FormData){
 const code=String(form.get('code')??'').trim(),password=String(form.get('password')??'');
 if(!validNewPassword(password))throw new Error('Use 12–128 characters, up to 72 UTF-8 bytes.');
 if(password!==String(form.get('confirmPassword')??''))throw new Error('Passwords do not match.');
 if(!/^[a-f0-9]{64}$/.test(code))throw new Error('This recovery code is invalid or expired.');
 const address=signInAddress((await headers()).get('x-atlas-request-path')??'/reset-password',{companySlug:String(form.get('companySlug')??''),portal:String(form.get('portal')??'')});
 const passwordHash=await bcrypt.hash(password,12),now=new Date();
 const token=await db.$transaction(async tx=>{const reset=await tx.passwordReset.findUnique({where:{tokenHash:hashRecoveryCode(code)},include:{membership:{include:{organisation:true,user:{include:{platformAdmin:true,_count:{select:{memberships:true}}}}}}}});
  if(!reset||reset.usedAt||reset.expiresAt<=now||!reset.membership.active||reset.membership.organisation.status!=='ACTIVE')throw new Error('This recovery code is invalid or expired.');
  const platform=reset.purpose==='PLATFORM';
  const {companySlug,portal}=address;
  if((companySlug && (platform || reset.membership.organisation.slug!==companySlug)) || (portal==='atlas' && !platform))throw new Error('This code does not belong to this sign-in address.');
  if(platform ? (!platformCapabilities(reset.membership.user.platformAdmin).length||reset.membership.organisation.kind!=='INTERNAL') : (!!reset.membership.user.platformAdmin||reset.membership.user._count.memberships!==1))throw new Error('This recovery code is invalid or expired.');
  const claimed=await tx.passwordReset.updateMany({where:{id:reset.id,usedAt:null,expiresAt:{gt:now}},data:{usedAt:now}});if(claimed.count!==1)throw new Error('This recovery code is invalid or expired.');
  await tx.user.update({where:{id:reset.membership.userId},data:{passwordHash,authVersion:{increment:1}}});await tx.passwordReset.updateMany({where:{membership:{userId:reset.membership.userId},usedAt:null},data:{usedAt:now}});
  await tx.auditEntry.create({data:{organisationId:reset.membership.organisationId,actorUserId:reset.membership.userId,action:'account.password.recovered',entityType:'Membership',entityId:reset.membershipId}});
  await tx.membership.update({where:{id:reset.membershipId},data:{lastLoginAt:now}});
  return {userId:reset.membership.userId,organisationId:reset.membership.organisationId,platform};
 });
 // The code proved who this is and the password is now theirs, so open their company directly.
 await clearSessionCookie();await createSessionCookie(token);redirect(token.platform?'/atlas':'/home');
}
export async function changeOwnPassword(form:FormData){
 const session=await requireSession();
 assertCapability(session,'core.profile.self');
 const password=String(form.get('password')??'');if(!validNewPassword(password))throw new Error('Use 12–128 characters, up to 72 UTF-8 bytes.');if(password!==String(form.get('confirmPassword')??''))throw new Error('Passwords do not match.');
 const user=await db.user.findUniqueOrThrow({where:{id:session.userId}});if(!await bcrypt.compare(String(form.get('currentPassword')??''),user.passwordHash))throw new Error('Current password is incorrect.');
 const passwordHash=await bcrypt.hash(password,12);
 await db.$transaction(async tx=>{const updated=await tx.user.updateMany({where:{id:user.id,authVersion:user.authVersion},data:{passwordHash,authVersion:{increment:1}}});if(updated.count!==1)throw new Error('Account changed. Sign in again.');await tx.passwordReset.updateMany({where:{membership:{userId:user.id},usedAt:null},data:{usedAt:new Date()}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:user.id,action:'account.password.changed',entityType:'User',entityId:user.id}});});await createSessionCookie({userId:session.userId,organisationId:session.organisationId});revalidatePath('/','layout');
}
export async function signOutOtherSessions(){
 const session=await requireSession();
 assertCapability(session,'core.profile.self');
 await db.$transaction(async tx=>{await tx.membership.update({where:{id:session.membershipId,organisationId:session.organisationId},data:{sessionVersion:{increment:1}}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'account.other_sessions.revoked',entityType:'Membership',entityId:session.membershipId}});});await createSessionCookie({userId:session.userId,organisationId:session.organisationId});revalidatePath('/','layout');
}
