import { redirect } from "next/navigation";
export default async function Page({params}:{params:Promise<{opportunityId:string}>}) { const p = await params; redirect(`/crm/opportunities/${p.opportunityId}`); }
