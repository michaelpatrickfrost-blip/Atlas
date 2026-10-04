import {WorkSpace,type Params} from '@/modules/projects/components/workspace';
export default async function Page({searchParams}:{searchParams:Promise<Params>}){return <WorkSpace section="tasks" filters={await searchParams}/>;}
