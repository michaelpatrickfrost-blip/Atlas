import type {Session} from '@/core/auth/session';
import {db} from '@/core/db/client';
/** Oversight adds department scope; it does not grant any business capability. */
export async function managedDepartments(session:Session){const groups=await db.workTeam.findMany({where:{organisationId:session.organisationId,members:{some:{membershipId:session.membershipId,isManager:true,membership:{active:true,organisationId:session.organisationId,userId:session.userId}}}},select:{departments:true}});return [...new Set(groups.flatMap(g=>g.departments))];}
