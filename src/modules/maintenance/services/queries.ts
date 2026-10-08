import {requireSession} from '@/core/auth/session';
import {assertCapability,can} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {getEnabledModuleIds} from '@/core/modules/runtime';
import {db} from '@/core/db/client';
import {members} from '@/core/shared/operational-forms';
export async function maintenanceWorkspace(){const s=await requireSession();assertCapability(s,'maintenance.work.read');await assertModuleEnabled(s,'maintenance');const enabled=await getEnabledModuleIds(s.organisationId),vehicleAccess=can(s,'fleet.vehicle.read')&&enabled.has('fleet');const [equipment,vehicles,work,people]=await Promise.all([db.maintenanceEquipment.findMany({where:{organisationId:s.organisationId},orderBy:{name:'asc'},take:201}),vehicleAccess?db.fleetVehicle.findMany({where:{organisationId:s.organisationId},select:{id:true,name:true,registration:true},take:201}):[],db.maintenanceWorkOrder.findMany({where:{organisationId:s.organisationId,...(!vehicleAccess?{vehicleId:null}:{})},orderBy:{createdAt:'desc'},take:201}),members(s)]);return {s,equipment,vehicles,work,people,enabled};}
