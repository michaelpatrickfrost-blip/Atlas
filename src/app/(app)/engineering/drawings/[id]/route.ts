import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {db} from '@/core/db/client';
import {readServiceFile} from '@/core/service-work/files';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){const s=await requireSession();assertCapability(s,'engineering.revision.read');await assertModuleEnabled(s,'engineering');assertCapability(s,'core.products.read');await assertModuleEnabled(s,'products');const {id}=await params,a=await db.engineeringAttachment.findFirst({where:{id,organisationId:s.organisationId,revision:{organisationId:s.organisationId}}});if(!a)return new Response('Drawing unavailable.',{status:404});const bytes=await readServiceFile(a.storageKey);return new Response(new Uint8Array(bytes),{headers:{'Content-Type':a.mime,'Content-Disposition':`inline; filename*=UTF-8''${encodeURIComponent(a.name)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});}
