import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { addressValueSchema, customFieldSchema, safeFieldPattern, type CustomField, type FieldStorage, type FieldValue } from "./schema";

export function assertFieldAccess(session: Session, field: CustomField, intent: "read" | "write") {
  if (field.readCapability) assertCapability(session, field.readCapability);
  if (intent === "write" && field.writeCapability) assertCapability(session, field.writeCapability);
}

function decimalValue(storage: Extract<FieldStorage, { type: "decimal" | "money" }>, input: unknown): string {
  const text = z.string().regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/).max(40).parse(input);
  const unsigned = text.replace(/^-/, ""), [whole, fraction = ""] = unsigned.split(".");
  if ((whole === "0" ? 0 : whole.length) > storage.precision - storage.scale || fraction.length > storage.scale) throw new Error("The value exceeds the declared decimal precision; rounding is not automatic.");
  const value = new Prisma.Decimal(text);
  if (storage.min !== undefined && value.lt(storage.min)) throw new Error("The value is below the minimum.");
  if (storage.max !== undefined && value.gt(storage.max)) throw new Error("The value exceeds the maximum.");
  return value.toFixed();
}

/** Strict values only; never coerce strings to numbers/booleans or infer currency/timezone. */
export function validateFieldValue(input: unknown, raw: unknown): FieldValue | null {
  const field = validateFieldConstraints(input), storage = field.storage;
  if (raw === undefined || raw === null || raw === "") {
    if (field.required) throw new Error(`${field.label} is required.`);
    return null;
  }
  switch (storage.type) {
    case "string": {
      const value = z.string().min(storage.minLength).max(storage.maxLength).parse(raw);
      if (!storage.multiline && /[\r\n]/.test(value)) throw new Error("Use a single line of text.");
      if (storage.pattern && !safeFieldPattern(storage.pattern).test(value)) throw new Error("The value does not match the allowed characters.");
      return { type: storage.type, value };
    }
    case "integer": case "duration": {
      const value = z.number().int().min(storage.min ?? (storage.type === "duration" ? 0 : -Number.MAX_SAFE_INTEGER)).max(storage.max ?? Number.MAX_SAFE_INTEGER).parse(raw);
      return { type: storage.type, value };
    }
    case "decimal": return { type: "decimal", value: decimalValue(storage, raw) };
    case "money": {
      const value = z.strictObject({ amount: z.string(), currency: z.string().regex(/^[A-Z]{3}$/) }).parse(raw);
      if (!storage.currencies.includes(value.currency)) throw new Error("Choose an allowed currency.");
      return { type: "money", value: { amount: decimalValue(storage, value.amount), currency: value.currency } };
    }
    case "boolean": return { type: "boolean", value: z.boolean().parse(raw) };
    case "date": return { type: "date", value: z.iso.date().parse(raw) };
    case "datetime": return { type: "datetime", value: new Date(z.iso.datetime().parse(raw)).toISOString() };
    case "email": return { type: "email", value: z.email().max(320).parse(raw).toLowerCase() };
    case "phone": return { type: "phone", value: z.string().regex(/^\+[1-9]\d{6,14}$/).parse(raw) };
    case "url": {
      const value = new URL(z.url().max(2000).parse(raw));
      if (!storage.protocols.includes(value.protocol.slice(0, -1) as "https" | "http") || value.username || value.password) throw new Error("Use an allowed web address without credentials.");
      return { type: "url", value: value.href };
    }
    case "enum": case "multi_enum": {
      const values = storage.type === "enum" ? [z.string().parse(raw)] : z.array(z.string()).max(storage.maxSelections).parse(raw);
      if (field.required && !values.length) throw new Error(`${field.label} is required.`);
      if (new Set(values).size !== values.length) throw new Error("Duplicate selected value.");
      if (values.some(id => !storage.options.some(option => option.id === id && !option.retired))) throw new Error("Choose a current allowed value.");
      return storage.type === "enum" ? { type: "enum", value: values[0] } : { type: "multi_enum", value: [...values].sort() };
    }
    case "reference": return { type: "reference", value: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).parse(raw) };
    case "address": {
      const value = addressValueSchema.parse(raw);
      if (!storage.countries.includes(value.country)) throw new Error("Choose an allowed country.");
      return { type: "address", value };
    }
  }
}

/** Validate the definition's own constraints before publication, including decimal bounds. */
export function validateFieldConstraints(input: unknown): CustomField {
  const field = customFieldSchema.parse(input), storage = field.storage;
  if (storage.type === "decimal" || storage.type === "money") {
    if (storage.min !== undefined) decimalValue({ ...storage, min: undefined, max: undefined }, storage.min);
    if (storage.max !== undefined) decimalValue({ ...storage, min: undefined, max: undefined }, storage.max);
    if (storage.min !== undefined && storage.max !== undefined && new Prisma.Decimal(storage.min).gt(storage.max)) throw new Error("Minimum exceeds maximum.");
  }
  return field;
}
