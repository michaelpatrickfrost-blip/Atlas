import { describe, it, expect, vi, beforeEach } from 'vitest';
const mock=vi.hoisted(()=>({session:vi.fn(),load:vi.fn(),audit:vi.fn(),workbook:vi.fn()}));
vi.mock('@/core/auth/session',()=>({getSession:mock.session}));
vi.mock('@/core/reports/catalogue',()=>({loadReport:mock.load}));
vi.mock('@/core/reports/workbook',()=>({reportWorkbook:mock.workbook}));
vi.mock('@/core/audit/log',()=>({writeAudit:mock.audit}));
import { GET } from '@/app/api/reports/route';
import { ReportError } from '@/core/reports/filters';
const session={organisationId:'tenant',userId:'reader',organisationName:'Company',capabilities:new Set(['core.profile.self'])};
const result={spec:{id:'customers.records'},rows:[],columns:[{key:'name'}],total:0};
beforeEach(()=>{vi.clearAllMocks();mock.session.mockResolvedValue(session);mock.load.mockResolvedValue(result);mock.workbook.mockResolvedValue(new Uint8Array([1,2,3]));mock.audit.mockResolvedValue(undefined);});
describe('Reports HTTP boundary',()=>{
 it('returns 401 before querying data for anonymous requests',async()=>{mock.session.mockResolvedValue(null);const response=await GET(new Request('https://atlas.test/api/reports?dataset=customers.records'));expect(response.status).toBe(401);expect(mock.load).not.toHaveBeenCalled();expect(response.headers.get('Cache-Control')).toContain('no-store');});
 it('reports unavailable datasets as forbidden without workbook or audit work',async()=>{mock.load.mockRejectedValue(new ReportError('Unavailable',403));const response=await GET(new Request('https://atlas.test/api/reports?dataset=hidden&download=xlsx'));expect(response.status).toBe(403);expect(mock.workbook).not.toHaveBeenCalled();expect(mock.audit).not.toHaveBeenCalled();});
 it('does not treat a preview as an export or record an export audit',async()=>{const response=await GET(new Request('https://atlas.test/api/reports?dataset=customers.records'));expect(response.status).toBe(200);expect(mock.load).toHaveBeenCalledWith(session,expect.objectContaining({dataset:'customers.records'}),false);expect(mock.audit).not.toHaveBeenCalled();});
 it('audits an explicit XLSX download without copying search or record contents into history',async()=>{const response=await GET(new Request('https://atlas.test/api/reports?dataset=customers.records&download=xlsx&search=private-text'));expect(response.status).toBe(200);expect(response.headers.get('content-type')).toContain('spreadsheetml');expect(response.headers.get('content-disposition')).toMatch(/atlas-customers.records-.*xlsx/);expect(mock.audit).toHaveBeenCalledWith(expect.objectContaining({organisationId:'tenant',actorUserId:'reader',after:expect.objectContaining({hasSearch:true,rows:0})}));expect(JSON.stringify(mock.audit.mock.calls)).not.toContain('private-text');});
 it('rejects tampered tenant options and unsupported file formats',async()=>{for(const q of ['organisationId=other','download=csv'])expect((await GET(new Request(`https://atlas.test/api/reports?dataset=customers.records&${q}`))).status).toBe(400);expect(mock.load).not.toHaveBeenCalled();});
});
