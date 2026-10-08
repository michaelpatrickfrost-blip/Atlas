import {redirect} from "next/navigation";
import HRHome from "./workspace/page";
export default async function PeoplePage({searchParams}:{searchParams:Promise<{q?:string;status?:string;department?:string}>}){const f=await searchParams;const params=new URLSearchParams();for(const key of ['q','status','department'] as const)if(f[key])params.set(key,f[key]!);if(params.size)redirect(`/people/directory?${params}`);return <HRHome/>;}
