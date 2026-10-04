import type { Condition, Step } from "./catalogue";

export type Template = { key: string; name: string; description: string; triggerEvent: string; conditions: Condition[]; steps: Step[] };
const step = (id: string, type: string, params: Record<string, string> = {}): Step => ({ id, type, params });

export const TEMPLATES: Template[] = [
  { key: "invoice-on-confirm", name: "Order confirmed → invoice", description: "When an order is confirmed, raise a draft invoice automatically.", triggerEvent: "sales.order.confirmed", conditions: [], steps: [step("1", "create_invoice")] },
  { key: "shipped-notify", name: "Shipment dispatched → tell the customer", description: "Email the customer tracking details the moment their order ships.", triggerEvent: "logistics.shipment.dispatched", conditions: [], steps: [step("1", "send_email", { to: "contact" })] },
  { key: "case-csat", name: "Case closed → ask for feedback", description: "Send a one-tap satisfaction survey after a service case closes.", triggerEvent: "service.case.changed", conditions: [{ field: "case.status", op: "eq", value: "RESOLVED" }], steps: [step("1", "wait", { amount: "1", unit: "days" }), step("2", "send_csat", { to: "contact" })] },
  { key: "mql-notify-sales", name: "New MQL → notify Sales", description: "The moment a lead becomes marketing qualified, let the owner know.", triggerEvent: "marketing.mql.created", conditions: [], steps: [step("1", "notify_user", { to: "owner", message: "{{lead.company}} just became marketing qualified." })] },
  { key: "opportunity-won-task", name: "Opportunity won → onboarding task", description: "Create a follow-up task the moment a deal is won.", triggerEvent: "sales.opportunity.won", conditions: [], steps: [step("1", "create_task", { subject: "Kick off onboarding for {{customer.name}}", assignee: "owner", dueInDays: "2" })] },
  { key: "delivery-failed-case", name: "Delivery fails → open a case", description: "Automatically raise a service case when a delivery fails.", triggerEvent: "logistics.delivery.failed", conditions: [], steps: [step("1", "create_case", { subject: "Delivery issue: {{shipment.reference}}", priority: "HIGH" })] },
];
