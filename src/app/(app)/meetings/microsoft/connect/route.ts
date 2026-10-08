import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {db} from '@/core/db/client';
import {microsoftReady,tokenUrl,callbackUrl} from '@/modules/meetings/services/microsoft';
import {randomBytes,createHash} from 'node:crypto';
import {NextResponse} from 'next/server';
export async function GET(){const s=await requireSession();assertCapability(s,'meetings.calendar.connect');await assertModuleEnabled(s,'meetings');if(!microsoftReady())return NextResponse.redirect('https://atlassystem.online/meetings?view=connections&notice=configuration');const state=randomBytes(32).toString('base64url'),verifier=randomBytes(48).toString('base64url'),stateHash=createHash('sha256').update(state).digest('hex');await db.meetingOAuthState.create({data:{stateHash,organisationId:s.organisationId,userId:s.userId,verifier,expiresAt:new Date(Date.now()+600000)}});const query=new URLSearchParams({client_id:process.env.ATLAS_MICROSOFT_CLIENT_ID!,response_type:'code',redirect_uri:callbackUrl,response_mode:'query',scope:'openid offline_access User.Read Calendars.ReadWrite Calendars.ReadWrite.Shared',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'});return NextResponse.redirect(tokenUrl().replace('/token','/authorize')+'?'+query);}
