import {TimesheetsWorkspace} from "@/modules/people/components/timesheets-workspace";
export default async function Page({searchParams}:{searchParams:Promise<{week?:string;employeeId?:string}>}){return <TimesheetsWorkspace query={await searchParams}/>;}
