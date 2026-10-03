import {getSession} from '@/core/auth/session';
import {assertDesktopRequest} from '@/server/data-api/request';
export async function GET(request:Request){try{assertDesktopRequest(request);const session=await getSession();if(!session)return Response.json({error:'Sign in required.'},{status:401});return Response.json({...session,capabilities:[...session.capabilities]},{headers:{'Cache-Control':'private, no-store'}});}catch{return Response.json({error:'Data connection rejected.'},{status:403});}}
