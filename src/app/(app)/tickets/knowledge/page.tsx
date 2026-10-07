import { Knowledge } from '@/components/service-work/knowledge';
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){return <Knowledge moduleId="tickets" q={(await searchParams).q}/>;}
