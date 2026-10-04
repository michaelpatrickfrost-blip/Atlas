import {WorkSpace,type Params} from '@/modules/projects/components/workspace';
export default async function Page({params,searchParams}:{params:Promise<{section:string}>;searchParams:Promise<Params>}){return <WorkSpace section={(await params).section} filters={await searchParams}/>;}
