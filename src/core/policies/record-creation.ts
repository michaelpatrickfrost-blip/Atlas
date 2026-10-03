import {db} from '@/core/db/client';
export async function assertRecordCreationAllowed(organisationId:string,entity:'products'|'customers'){
 const policy=await db.organisation.findUniqueOrThrow({where:{id:organisationId},select:{allowProductCreation:true,allowCustomerCreation:true}});
 if(!(entity==='products'?policy.allowProductCreation:policy.allowCustomerCreation))throw new Error(`Creating new ${entity} is disabled by your company administrator.`);
}
