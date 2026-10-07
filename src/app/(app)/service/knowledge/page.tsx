import { Knowledge } from '@/components/service-work/knowledge';
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){return <Knowledge moduleId="service" q={(await searchParams).q}/>;}
