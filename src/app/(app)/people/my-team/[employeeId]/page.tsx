import {TeamMemberWorkspace} from "@/modules/people/components/team-member-workspace";
export default async function Page({params}:{params:Promise<{employeeId:string}>}){return <TeamMemberWorkspace employeeId={(await params).employeeId}/>;}
