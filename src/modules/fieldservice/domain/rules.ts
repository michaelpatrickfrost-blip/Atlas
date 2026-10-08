export const JOB_TYPES=['INSTALLATION','REPAIR','SERVICE','INSPECTION'] as const;
export const JOB_STATES=['SCHEDULED','TRAVELLING','ON_SITE','WAITING','COMPLETED','CANCELLED'] as const;
export function jobTransition(from:string,to:string){const routes:Record<string,string[]>={SCHEDULED:['TRAVELLING','ON_SITE','CANCELLED'],TRAVELLING:['ON_SITE','CANCELLED'],ON_SITE:['WAITING','COMPLETED','CANCELLED'],WAITING:['ON_SITE','CANCELLED']};if(!(routes[from]??[]).includes(to))throw Error('Arrive on site before completing the job. Closed jobs cannot be changed.');}
