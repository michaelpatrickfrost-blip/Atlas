/** Everything the automation builder offers. Pure data: safe to import on the client. */
export type FieldDef = { path: string; label: string; type: "text" | "number" | "money" | "date" | "enum"; options?: string[] };

export type TriggerDef = { event: string; label: string; group: string; sentence: string; fields: FieldDef[] };

const party: FieldDef[] = [
  { path: "customer.name", label: "Customer name", type: "text" },
  { path: "customer.country", label: "Customer country", type: "text" },
  { path: "contact.email", label: "Contact email", type: "text" },
];
const order: FieldDef[] = [
  { path: "order.reference", label: "Order number", type: "text" },
  { path: "order.total", label: "Order total (£)", type: "money" },
  { path: "order.type", label: "Order type", type: "enum", options: ["STANDARD", "BLANKET", "CALL_OFF", "INTERNAL"] },
  { path: "order.status", label: "Order status", type: "enum", options: ["DRAFT", "CONFIRMED", "CANCELLED", "CLOSED"] },
  { path: "order.lines", label: "Number of lines", type: "number" },
];

export const TRIGGERS: TriggerDef[] = [
  { event: "sales.order.confirmed", label: "An order is confirmed", group: "Sales", sentence: "an order is confirmed", fields: [...order, ...party] },
  { event: "sales.order.created", label: "An order is created", group: "Sales", sentence: "an order is created", fields: [...order, ...party] },
  { event: "sales.order.cancelled", label: "An order is cancelled", group: "Sales", sentence: "an order is cancelled", fields: [...order, ...party] },
  { event: "sales.quote.sent", label: "A quotation is sent", group: "Sales", sentence: "a quotation is sent", fields: [{ path: "quote.reference", label: "Quote number", type: "text" }, { path: "quote.total", label: "Quote total (£)", type: "money" }, ...party] },
  { event: "sales.quote.accepted", label: "A quotation is accepted", group: "Sales", sentence: "a quotation is accepted", fields: [{ path: "quote.reference", label: "Quote number", type: "text" }, { path: "quote.total", label: "Quote total (£)", type: "money" }, ...party] },
  { event: "sales.opportunity.won", label: "An opportunity is won", group: "CRM", sentence: "an opportunity is won", fields: [{ path: "opportunity.name", label: "Opportunity", type: "text" }, { path: "opportunity.value", label: "Value (£)", type: "money" }, ...party] },
  { event: "sales.opportunity.lost", label: "An opportunity is lost", group: "CRM", sentence: "an opportunity is lost", fields: [{ path: "opportunity.name", label: "Opportunity", type: "text" }, { path: "opportunity.value", label: "Value (£)", type: "money" }, ...party] },
  { event: "sales.opportunity.created", label: "An opportunity is created", group: "CRM", sentence: "an opportunity is created", fields: [{ path: "opportunity.name", label: "Opportunity", type: "text" }, { path: "opportunity.value", label: "Value (£)", type: "money" }, ...party] },
  { event: "sales.prospect.created", label: "A prospect is created", group: "CRM", sentence: "a prospect is created", fields: [{ path: "prospect.company", label: "Company", type: "text" }, { path: "prospect.source", label: "Source", type: "text" }, { path: "contact.email", label: "Email", type: "text" }] },
  { event: "sales.prospect.qualified", label: "A prospect is qualified", group: "CRM", sentence: "a prospect is qualified", fields: [{ path: "prospect.company", label: "Company", type: "text" }, { path: "prospect.source", label: "Source", type: "text" }] },
  { event: "logistics.shipment.dispatched", label: "A shipment is dispatched", group: "Logistics", sentence: "a shipment is dispatched", fields: [{ path: "shipment.reference", label: "Shipment", type: "text" }, { path: "shipment.carrier", label: "Carrier", type: "text" }, ...order, ...party] },
  { event: "logistics.shipment.delivered", label: "A shipment is delivered", group: "Logistics", sentence: "a shipment is delivered", fields: [{ path: "shipment.reference", label: "Shipment", type: "text" }, { path: "shipment.carrier", label: "Carrier", type: "text" }, ...order, ...party] },
  { event: "logistics.fulfilment.short", label: "An order is short of stock", group: "Logistics", sentence: "an order is short of stock", fields: [...order, ...party] },
  { event: "logistics.delivery.failed", label: "A delivery fails", group: "Logistics", sentence: "a delivery fails", fields: [{ path: "shipment.reference", label: "Shipment", type: "text" }, ...party] },
  { event: "finance.invoice.created", label: "A draft invoice is created", group: "Finance", sentence: "a draft invoice is created", fields: [{ path: "invoice.reference", label: "Invoice number", type: "text" }, { path: "invoice.total", label: "Invoice total (£)", type: "money" }, ...party] },
  { event: "finance.invoice.posted", label: "An invoice is posted", group: "Finance", sentence: "an invoice is posted", fields: [{ path: "invoice.reference", label: "Invoice number", type: "text" }, { path: "invoice.total", label: "Invoice total (£)", type: "money" }, ...party] },
  { event: "manufacturing.order.completed", label: "A production order is completed", group: "Production", sentence: "a production order is completed", fields: [{ path: "production.number", label: "Production order", type: "text" }, { path: "production.product", label: "Product", type: "text" }, { path: "production.quantity", label: "Quantity", type: "number" }] },
  { event: "service.case.created", label: "A service case is opened", group: "Service", sentence: "a service case is opened", fields: [{ path: "case.number", label: "Case number", type: "text" }, { path: "case.priority", label: "Priority", type: "enum", options: ["LOW", "NORMAL", "HIGH", "URGENT"] }, { path: "case.type", label: "Type", type: "text" }, ...party] },
  { event: "service.case.changed", label: "A service case changes", group: "Service", sentence: "a service case changes", fields: [{ path: "case.number", label: "Case number", type: "text" }, { path: "case.status", label: "Status", type: "text" }, { path: "case.priority", label: "Priority", type: "text" }, ...party] },
  { event: "customer.created", label: "A customer is created", group: "Customers", sentence: "a customer is created", fields: party },
  { event: "customer.on_hold", label: "A customer goes on hold", group: "Customers", sentence: "a customer goes on hold", fields: party },
  { event: "contract.sent", label: "A contract is sent", group: "Contracts", sentence: "a contract is sent", fields: [{ path: "contract.title", label: "Contract", type: "text" }, ...party] },
  { event: "contract.signed", label: "A contract is signed", group: "Contracts", sentence: "a contract is signed", fields: [{ path: "contract.title", label: "Contract", type: "text" }, ...party] },
  { event: "csat.responded", label: "A customer answers a survey", group: "Feedback", sentence: "a customer answers a satisfaction survey", fields: [{ path: "csat.score", label: "Score (1-5)", type: "number" }, { path: "csat.comment", label: "Comment", type: "text" }, ...party] },
  { event: "marketing.mql.created", label: "A lead becomes marketing qualified", group: "Marketing", sentence: "a lead becomes marketing qualified", fields: [{ path: "lead.company", label: "Company", type: "text" }, { path: "lead.score", label: "Score", type: "number" }] },
  { event: "marketing.form.submitted", label: "A web form is submitted", group: "Marketing", sentence: "a web form is submitted", fields: [{ path: "form.name", label: "Form", type: "text" }, { path: "contact.email", label: "Email", type: "text" }] },
  { event: "marketing.event.attended", label: "Someone attends an event", group: "Marketing", sentence: "someone attends an event", fields: [{ path: "event.name", label: "Event", type: "text" }, { path: "contact.email", label: "Email", type: "text" }] },
  { event: "email.failed", label: "An email fails to send", group: "System", sentence: "an email fails to send", fields: [{ path: "error", label: "Error", type: "text" }] },
];

export const SCHEDULE_TRIGGER = { event: "schedule", label: "On a schedule", group: "Time", sentence: "the schedule is due", fields: [] as FieldDef[] };

export const OPERATORS: Array<{ key: string; label: string; types: string[] }> = [
  { key: "eq", label: "is", types: ["text", "number", "money", "enum", "date"] },
  { key: "neq", label: "is not", types: ["text", "number", "money", "enum", "date"] },
  { key: "gt", label: "is more than", types: ["number", "money", "date"] },
  { key: "gte", label: "is at least", types: ["number", "money"] },
  { key: "lt", label: "is less than", types: ["number", "money", "date"] },
  { key: "lte", label: "is at most", types: ["number", "money"] },
  { key: "contains", label: "contains", types: ["text"] },
  { key: "notContains", label: "does not contain", types: ["text"] },
  { key: "empty", label: "is empty", types: ["text", "number", "money", "enum", "date"] },
  { key: "notEmpty", label: "is filled in", types: ["text", "number", "money", "enum", "date"] },
];

export type Condition = { field: string; op: string; value?: string };

/** Recipient choices used by email, survey, invite and notify steps. */
export const RECIPIENTS = [
  { key: "contact", label: "The customer's contact" },
  { key: "owner", label: "The record owner" },
  { key: "rule_owner", label: "Me (the person who built this)" },
  { key: "custom", label: "A specific email address" },
] as const;

export type ActionField = { name: string; label: string; kind: "text" | "textarea" | "number" | "template" | "survey" | "recipient" | "account" | "select" | "user" | "audience"; options?: string[]; hint?: string; optional?: boolean };
export type ActionDef = { type: string; label: string; group: string; summary: (p: Record<string, string>) => string; fields: ActionField[]; needs?: string };

export const ACTIONS: ActionDef[] = [
  { type: "send_email", label: "Send an email", group: "Communicate", summary: (p) => `email ${recipientLabel(p)}`,
    fields: [{ name: "to", label: "To", kind: "recipient" }, { name: "template", label: "Template", kind: "template" }, { name: "account", label: "Send from", kind: "account", optional: true }] },
  { type: "send_csat", label: "Send a satisfaction survey (CSAT)", group: "Communicate", summary: (p) => `ask ${recipientLabel(p)} to rate us`,
    fields: [{ name: "to", label: "To", kind: "recipient" }, { name: "survey", label: "Survey", kind: "survey" }, { name: "template", label: "Email template", kind: "template", optional: true }, { name: "account", label: "Send from", kind: "account", optional: true }] },
  { type: "send_invite", label: "Send a calendar invite", group: "Communicate", summary: (p) => `invite ${recipientLabel(p)} to "${p.title ?? "a meeting"}"`,
    fields: [{ name: "to", label: "Invite", kind: "recipient" }, { name: "title", label: "Meeting title", kind: "text" }, { name: "inDays", label: "Days from now", kind: "number" }, { name: "atHour", label: "Start hour (0-23)", kind: "number" }, { name: "minutes", label: "Length (minutes)", kind: "number" }, { name: "location", label: "Place or link", kind: "text", optional: true }, { name: "template", label: "Email template", kind: "template", optional: true }, { name: "account", label: "Send from", kind: "account", optional: true }] },
  { type: "notify_user", label: "Notify someone in Atlas", group: "Communicate", summary: (p) => `notify ${recipientLabel(p)}`,
    fields: [{ name: "to", label: "Who", kind: "recipient" }, { name: "message", label: "Message", kind: "textarea", hint: "Merge fields like {{order.reference}} work here" }] },
  { type: "create_invoice", label: "Create a draft invoice for the order", group: "Money", summary: () => "raise a draft invoice for the order", fields: [], needs: "an order" },
  { type: "create_task", label: "Create a CRM task", group: "Work", summary: (p) => `create a task "${p.subject ?? ""}"`,
    fields: [{ name: "subject", label: "Task", kind: "text" }, { name: "assignee", label: "Assign to", kind: "recipient" }, { name: "dueInDays", label: "Due in (days)", kind: "number", optional: true }] },
  { type: "create_case", label: "Open a service case", group: "Work", summary: (p) => `open a service case "${p.subject ?? ""}"`,
    fields: [{ name: "subject", label: "Subject", kind: "text" }, { name: "priority", label: "Priority", kind: "select", options: ["LOW", "NORMAL", "HIGH", "URGENT"] }], needs: "a customer" },
  { type: "add_tag", label: "Tag the record", group: "Work", summary: (p) => `tag it #${p.tag ?? ""}`, fields: [{ name: "tag", label: "Tag", kind: "text" }], needs: "an order or customer" },
  { type: "add_to_audience", label: "Add the contact to a marketing audience", group: "Marketing", summary: () => "add the contact to an audience", fields: [{ name: "audience", label: "Audience", kind: "audience" }] },
  { type: "webhook", label: "Call a web address (webhook)", group: "Connect", summary: (p) => `post to ${p.url ?? "a web address"}`, fields: [{ name: "url", label: "URL", kind: "text", hint: "https://" }] },
  { type: "wait", label: "Wait", group: "Timing", summary: (p) => `wait ${p.amount ?? "1"} ${p.unit ?? "days"}${p.untilHour ? ` until ${p.untilHour}:00` : ""}`,
    fields: [{ name: "amount", label: "How long", kind: "number" }, { name: "unit", label: "Unit", kind: "select", options: ["minutes", "hours", "days"] }, { name: "untilHour", label: "Then wait until this hour (optional, 0-23)", kind: "number", optional: true }] },
  { type: "stop_unless", label: "Only continue if…", group: "Timing", summary: () => "only continue if the check passes", fields: [{ name: "field", label: "Field", kind: "text" }, { name: "op", label: "Check", kind: "text" }, { name: "value", label: "Value", kind: "text", optional: true }] },
];

export function recipientLabel(p: Record<string, string>) {
  const r = p.to ?? p.assignee;
  if (r === "contact") return "the customer";
  if (r === "owner") return "the record owner";
  if (r === "rule_owner") return "me";
  if (r?.startsWith("custom:")) return r.slice(7);
  if (r?.startsWith("user:")) return "a colleague";
  return "someone";
}

export type Step = { id: string; type: string; params: Record<string, string> };

export function conditionSentence(c: Condition, fields: FieldDef[]) {
  const f = fields.find((x) => x.path === c.field);
  const op = OPERATORS.find((o) => o.key === c.op)?.label ?? c.op;
  return `${f?.label ?? c.field} ${op}${c.op === "empty" || c.op === "notEmpty" ? "" : ` ${c.value ?? ""}`}`.trim();
}

/** Plain-English summary shown above the builder and in lists. */
export function summarise(triggerEvent: string | null, triggerType: string, conditions: Condition[], steps: Step[], schedule?: { every?: string }) {
  const trig = TRIGGERS.find((t) => t.event === triggerEvent);
  const when = triggerType === "SCHEDULE" ? `Every ${schedule?.every ?? "day"}` : triggerType === "MANUAL" ? "When someone runs it" : `When ${trig?.sentence ?? triggerEvent ?? "…"}`;
  const fields = trig?.fields ?? [];
  const ifs = conditions.length ? `, and ${conditions.map((c) => conditionSentence(c, fields)).join(" and ")}` : "";
  const then = steps.map((s) => ACTIONS.find((a) => a.type === s.type)?.summary(s.params) ?? s.type).join(", then ");
  return `${when}${ifs}: ${then || "do nothing yet"}.`;
}
