import { z } from "zod";
import { slaSchema } from "./sla";
export const fieldSchema = z.object({ key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/), label: z.string().min(1).max(100), type: z.enum(["text", "textarea", "number", "date", "select", "checkbox"]), required: z.boolean().default(false), options: z.array(z.string().max(100)).max(30).default([]) });
export const serviceSchema = z.object({ id: z.string().min(1).max(60), name: z.string().min(1).max(100), type: z.string().min(1).max(60).default("SERVICE_REQUEST"), fields: z.array(fieldSchema).max(30).default([]), approval: z.boolean().default(false), requiredEvidence: z.boolean().default(false) });
export const queueConfigSchema = z.object({
  sla: slaSchema.default({ responseMinutes: 240, resolutionMinutes: 2400, warningMinutes: 60, pauseStates: ["PENDING_REQUESTER", "WAITING_CUSTOMER"], calendar: { timezone: "Europe/London", weekdays: [1, 2, 3, 4, 5], start: 540, end: 1020, holidays: [] } }),
  services: z.array(serviceSchema).max(100).default([]),
  caseTypes: z.array(z.string().min(1).max(60)).default([]),
  categories: z.array(z.string().min(1).max(100)).default([]),
  routing: z.array(z.object({ type: z.string().optional(), category: z.string().optional(), priority: z.string().optional(), severity: z.string().optional() })).max(50).default([]),
});
export function queueConfig(value: unknown) { return queueConfigSchema.parse(value ?? {}); }
export function validateAnswers(fields: z.infer<typeof fieldSchema>[], value: Record<string, unknown>) {
  const result: Record<string, string | boolean | number> = {};
  for (const field of fields) {
    const answer = value[field.key];
    if (field.required && (answer === undefined || answer === "" || answer === null || (field.type === "checkbox" && answer !== true))) throw new Error(`${field.label} is required.`);
    if (answer === undefined || answer === "" || answer === null) continue;
    if (field.type === "number") { const n = Number(answer); if (!Number.isFinite(n)) throw new Error(`${field.label} must be a number.`); result[field.key] = n; }
    else if (field.type === "checkbox") result[field.key] = answer === true;
    else { const text = String(answer); if (text.length > 4000) throw new Error(`${field.label} is too long.`); if (field.type === "select" && !field.options.includes(text)) throw new Error(`Choose a valid ${field.label}.`); if (field.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(`Choose a valid ${field.label}.`); result[field.key] = text; }
  }
  return result;
}
export const WORK_STATUSES = ["NEW", "ASSIGNED", "IN_PROGRESS", "PENDING_REQUESTER", "PENDING_INTERNAL", "PENDING_EXTERNAL", "ANSWERED", "RESOLVED", "CLOSED", "CANCELLED"] as const;
export const FINAL_WORK = ["RESOLVED", "CLOSED", "CANCELLED"];
export const WORK_TYPES = ["INCIDENT", "SERVICE_REQUEST", "TASK", "PROBLEM", "CHANGE", "ACCESS_REQUEST"];
export function suggestedPriority(impact: string, urgency: string) {
  const score = ["INDIVIDUAL", "TEAM", "DEPARTMENT", "BUSINESS"].indexOf(impact) + ["LOW", "NORMAL", "HIGH", "IMMEDIATE"].indexOf(urgency);
  return score >= 5 ? "URGENT" : score >= 3 ? "HIGH" : score >= 1 ? "NORMAL" : "LOW";
}
