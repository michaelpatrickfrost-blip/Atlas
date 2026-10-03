import {z} from 'zod';
export const salesPolicySchema=z.object({discountLimit:z.number().min(0).max(100).default(15),valueLimits:z.record(z.string().regex(/^[A-Z]{3}$/),z.number().int().min(0).max(2147483647)).default({GBP:5000000,EUR:5000000,USD:5000000})});
export function readSalesPolicy(value:unknown){const parsed=salesPolicySchema.safeParse(value);return parsed.success?parsed.data:salesPolicySchema.parse({});}
