import {redirect} from 'next/navigation';
/** Preserve bookmarked filters while CRM owns the contracts workspace. */
export default async function LegacyContracts({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const query=new URLSearchParams();
 for(const [key,value] of Object.entries(await searchParams)) {
  if(Array.isArray(value))for(const item of value)query.append(key,item);
  else if(value!==undefined)query.set(key,value);
 }
 redirect(`/crm/contracts${query.size?'?'+query.toString():''}`);
}
