import { db } from '@/core/db/client';
import type { BusinessPlanningProvider } from '@/core/planning/business';
export const peopleBusinessPlanning:BusinessPlanningProvider=async(session,request)=>{
 if(request.purpose!=='picker'||!session.capabilities.has('people.employee.read'))return {requiredCapabilities:[]};
 const rows=await db.employee.findMany({where:{organisationId:session.organisationId,status:{notIn:['LEFT','OFFBOARDING']},...(request.sourceIds?{id:{in:request.sourceIds}}:{}),...(request.search?{OR:[{firstName:{contains:request.search,mode:'insensitive'}},{lastName:{contains:request.search,mode:'insensitive'}},{department:{contains:request.search,mode:'insensitive'}}]}:{})},select:{id:true,firstName:true,lastName:true,department:true},orderBy:{lastName:'asc'},take:501});
 return {sources:rows.slice(0,500).map(p=>({module:'people',type:'employee',id:p.id,label:`${p.firstName} ${p.lastName}${p.department?` · ${p.department}`:''}`,href:`/people/employees/${p.id}`,capability:'people.employee.read'})),requiredCapabilities:['people.employee.read'],warnings:rows.length>500?['Search HR to narrow more than 500 people.']:[]};
};
