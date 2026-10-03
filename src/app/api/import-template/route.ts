import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { csvText } from "@/core/shared/csv";
const templates:Record<string,string[][]>={customers:[['customerCode','name','parentCustomerCode','hierarchyRole','customerGroup','currency','country','billingLine1','billingCity','billingPostcode','deliveryLine1','deliveryCity','deliveryPostcode'],['C-100','Example Group','','GROUP','Wholesale','GBP','GB','1 Example Street','London','SW1A 1AA','2 Example Road','London','SW1A 1AB']],products:[['code','name','kind','unit','price','currency','taxCategory'],['SKU-100','Example product','PRODUCT','each','25.00','GBP','STANDARD']],prices:[['productCode','minimumQuantity','unitPrice','validFrom','validTo'],['SKU-100','1','22.50','','']]};
export async function GET(request:Request) {
 const session=await requireSession();
 assertCapability(session,'core.profile.self');
 const entity=new URL(request.url).searchParams.get('entity')??'';
 if(!templates[entity])return new Response('Unknown template',{status:400});
 return new Response('\uFEFF'+csvText(templates[entity]),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="atlas-${entity}-template.csv"`,'Cache-Control':'private, no-store'}});
}
