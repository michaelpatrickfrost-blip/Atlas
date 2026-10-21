import { z } from "zod";

export const fieldKeySchema = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/);

export const addressValueSchema = z.strictObject({
  line1: z.string().min(1).max(200), line2: z.string().max(200).default(""), city: z.string().min(1).max(100),
  region: z.string().max(100).default(""), postalCode: z.string().max(40).default(""), country: z.string().regex(/^[A-Z]{2}$/),
});
export type FieldValue =
  | { type: "string" | "email" | "url" | "phone" | "date" | "datetime" | "enum" | "reference"; value: string }
  | { type: "integer" | "duration"; value: number }
  | { type: "decimal"; value: string }
  | { type: "money"; value: { amount: string; currency: string } }
  | { type: "boolean"; value: boolean }
  | { type: "multi_enum"; value: string[] }
  | { type: "address"; value: z.infer<typeof addressValueSchema> };
