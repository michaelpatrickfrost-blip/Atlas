import {describe,it,expect,vi} from 'vitest';
vi.mock('@/core/auth/session',()=>({requireSession:async()=>({capabilities:new Set(['sales.order.create'])})}));
vi.mock('@/modules/sales/services/working-drafts',()=>({persistWorkingDraft:async()=>({savedAt:'2026-10-03T12:00:00Z'})}));
import {POST} from '@/app/api/sales/draft/route';
describe('draft endpoint same-origin protection',()=>{
 const req=(origin:string)=>new Request('http://localhost:13400/api/sales/draft',{method:'POST',headers:{origin,host:'127.0.0.1:13400','content-type':'application/json'},body:JSON.stringify({id:'draft',version:1,payload:{mode:'order'}})});
 it('uses the actual request Host when a local runtime internally names itself localhost',async()=>{expect((await POST(req('http://127.0.0.1:13400'))).status).toBe(200);});
 it('rejects cross-origin draft writes',async()=>{expect((await POST(req('https://foreign.example'))).status).toBe(403);});
});
