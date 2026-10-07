import { SopWorkspace } from '@/modules/sop/components/workspace';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){return <SopWorkspace query={await searchParams}/>;}
