export const EQUIPMENT_STATES=['OPERATIONAL','LIMITED','OUT_OF_SERVICE','RETIRED'] as const;
export const WORK_TYPES=['BREAKDOWN','PREVENTIVE','INSPECTION','REPAIR'] as const;
export const WORK_STATES=['OPEN','IN_PROGRESS','WAITING_PARTS','COMPLETED','CANCELLED'] as const;
export function maintenanceTransition(from:string,to:string){const routes:Record<string,string[]>={OPEN:['IN_PROGRESS','CANCELLED'],IN_PROGRESS:['WAITING_PARTS','COMPLETED','CANCELLED'],WAITING_PARTS:['IN_PROGRESS','CANCELLED']};if(!(routes[from]??[]).includes(to))throw Error('Start the work before completing it. Completed or cancelled work cannot be changed.');}
export function downtimeMinutes(start:Date|null,end:Date|null,now=new Date()){return start?Math.max(0,Math.round((+(end??now)-+start)/60000)):0;}
