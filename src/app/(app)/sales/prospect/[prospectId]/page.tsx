import { redirect } from "next/navigation";
export default async function Page({params}:{params:Promise<{prospectId:string}>}) { const p = await params; redirect(`/crm/prospect/${p.prospectId}`); }
