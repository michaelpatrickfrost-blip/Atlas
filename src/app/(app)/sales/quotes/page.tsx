import { redirect } from 'next/navigation';
export default async function Quotes({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=new URLSearchParams();for(const [key,value] of Object.entries(await searchParams)){for(const item of Array.isArray(value)?value:value?[value]:[])params.append(key,item);}
 redirect(`/sales/documents?${params.toString()}`);
}
