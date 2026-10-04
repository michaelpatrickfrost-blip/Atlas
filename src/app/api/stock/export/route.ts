import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { inventoryExportRows } from '@/modules/stock/services/export';
import { csvResponse } from '@/core/shared/csv-export';
export async function GET(request:Request) {
 try {
  const session=await requireSession();assertCapability(session,'stock.read');
  const params=new URL(request.url).searchParams,type=params.get('type')??'stock';if(!['stock','movements'].includes(type))return Response.json({error:'Unknown export.'},{status:400});
  return csvResponse(`atlas-${type}.csv`,await inventoryExportRows(type,(params.get('warehouse')??'').slice(0,100),(params.get('q')??'').slice(0,150),(params.get(type==='movements'?'direction':'state')??'')));
 }catch(error){const message=error instanceof Error?error.message:'Export failed.';return Response.json({error:message},{status:message.includes('UNAUTHENTICATED')?401:message.includes('FORBIDDEN')?403:400,headers:{'Cache-Control':'no-store'}});}
}
