import { redirect } from 'next/navigation';
export default async function Quotes({searchParams}:{searchParams:Promise<any>}){
  const params = new URLSearchParams(Object.entries(await searchParams).filter(([,v])=>!!v) as [string,string][]);
  redirect(`/sales/documents?${params.toString()}`);
}
