import {z} from 'zod';
const orderFieldsSchema=z.object({customerPo:z.boolean().default(true),requestedDelivery:z.boolean().default(true),promisedDelivery:z.boolean().default(true)}).default({customerPo:true,requestedDelivery:true,promisedDelivery:true});
const pointersSchema=z.object({completeSale:z.boolean().default(true),completeDelivery:z.boolean().default(true),mayStillBeDone:z.boolean().default(true)}).default({completeSale:true,completeDelivery:true,mayStillBeDone:true});
export const salesPolicySchema=z.object({discountLimit:z.number().min(0).max(100).default(15),valueLimits:z.record(z.string().regex(/^[A-Z]{3}$/),z.number().int().min(0).max(2147483647)).default({GBP:5000000,EUR:5000000,USD:5000000}),orderFields:orderFieldsSchema,pointers:pointersSchema});
export function readSalesPolicy(value:unknown){const parsed=salesPolicySchema.safeParse(value);return parsed.success?parsed.data:salesPolicySchema.parse({});}
