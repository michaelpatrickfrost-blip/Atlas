"use server";
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {db} from '@/core/db/client';
import {required,text,choice,integer,number,day,member,audit,changed} from '@/core/shared/operational-forms';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
export async function saveVehicle(f:FormData){
 const s=await requireSession();
 assertCapability(s,'fleet.vehicle.manage');
 await assertModuleEnabled(s,'fleet');const id=text(f,'id'),data={registration:required(f,'registration',30).toUpperCase(),name:required(f,'name'),make:text(f,'make'),model:text(f,'model'),vin:text(f,'vin',60),fuelType:choice(text(f,'fuelType')||'DIESEL',['DIESEL','PETROL','ELECTRIC','HYBRID','OTHER']),status:choice(text(f,'status')||'ACTIVE',['ACTIVE','OFF_ROAD','RETIRED']),driverUserId:await member(s,text(f,'driverUserId')),motDueAt:day(f,'motDueAt'),insuranceDueAt:day(f,'insuranceDueAt'),serviceDueAt:day(f,'serviceDueAt'),notes:text(f,'notes',12000)};let saved=id;await db.$transaction(async tx=>{if(id)changed((await tx.fleetVehicle.updateMany({where:{id,organisationId:s.organisationId,version:integer(f,'version',1)},data:{...data,version:{increment:1}}})).count);else saved=(await tx.fleetVehicle.create({data:{...data,organisationId:s.organisationId,odometer:integer(f,'odometer')}})).id;await audit(tx,s,'fleet.vehicle.saved','FleetVehicle',saved,{registration:data.registration,status:data.status});});revalidatePath('/fleet','layout');redirect('/fleet/'+saved);
}
export async function addFleetLog(f:FormData){
 const s=await requireSession();
 assertCapability(s,'fleet.vehicle.manage');
 await assertModuleEnabled(s,'fleet');const id=required(f,'id'),v=await db.fleetVehicle.findFirst({where:{id,organisationId:s.organisationId}});if(!v||v.status==='RETIRED')throw Error('Vehicle unavailable.');const kind=choice(required(f,'kind'),['INSPECTION','FUEL','SERVICE','REPAIR','TRIP']),odometer=integer(f,'odometer');if(odometer<v.odometer)throw Error('Odometer cannot decrease.');const result=text(f,'result');if(kind==='INSPECTION')choice(result,['PASS','DEFECT','UNSAFE'],'inspection result');const occurredAt=day(f,'occurredAt');if(!occurredAt||+occurredAt>Date.now()+86400000)throw Error('Choose the actual log date.');const notes=required(f,'notes',12000),quantity=kind==='FUEL'?number(f,'quantity',0.0001,10000):null,costMinor=text(f,'cost')?Math.round(number(f,'cost',0,1000000)*100):null;await db.$transaction(async tx=>{changed((await tx.fleetVehicle.updateMany({where:{id,organisationId:s.organisationId,version:integer(f,'version',1),status:{not:'RETIRED'}},data:{odometer,status:kind==='INSPECTION'&&result==='UNSAFE'?'OFF_ROAD':v.status,version:{increment:1}}})).count);const l=await tx.fleetLog.create({data:{organisationId:s.organisationId,vehicleId:id,kind,occurredAt,odometer,result,quantity,costMinor,currency:choice(text(f,'currency')||'GBP',['GBP','EUR','USD']),notes,authorUserId:s.userId}});await audit(tx,s,'fleet.log.recorded','FleetLog',l.id,{vehicleId:id,kind,result});});revalidatePath('/fleet','layout');
}
