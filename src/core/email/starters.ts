import { newBlock, type EmailBlock } from "./blocks";

type Starter = { key: string; name: string; hint: string; category: string; subject: string; blocks: () => EmailBlock[] };
const b = (type: EmailBlock["type"], patch: Record<string, unknown> = {}) => ({ ...newBlock(type), ...patch }) as EmailBlock;

export const STARTER_TEMPLATES: Starter[] = [
  { key: "quote", name: "Quotation", hint: "Sends a quote with an accept link", category: "SALES", subject: "Quotation {{quote.reference}} from {{company.name}}",
    blocks: () => [b("heading", { text: "Your quotation" }), b("text", { text: "Hello {{contact.firstName}},\n\nThank you for your enquiry. Your quotation is attached. You can review and accept it online." }), b("details", { rows: [["Quotation", "{{quote.reference}}"], ["Total", "{{quote.total}}"]] }), b("button", { label: "Review and accept", url: "{{quote.link}}" }), b("text", { text: "Any questions, just reply to this email.\n\n{{sender.name}}" })] },
  { key: "order-shipped", name: "Order dispatched", hint: "Tracking details for a shipment", category: "SALES", subject: "Your order {{order.reference}} is on its way",
    blocks: () => [b("heading", { text: "On its way" }), b("text", { text: "Hello {{contact.firstName}},\n\nYour order has left our warehouse." }), b("details", { rows: [["Order", "{{order.reference}}"], ["Carrier", "{{shipment.carrier}}"], ["Tracking", "{{shipment.tracking}}"]] })] },
  { key: "invoice", name: "Invoice", hint: "Tell the customer an invoice is ready", category: "FINANCE", subject: "Invoice {{invoice.reference}} from {{company.name}}",
    blocks: () => [b("heading", { text: "Invoice" }), b("text", { text: "Hello {{contact.firstName}},\n\nPlease find your invoice attached." }), b("details", { rows: [["Invoice", "{{invoice.reference}}"], ["Amount", "{{invoice.total}}"], ["Due", "{{invoice.dueDate}}"]] })] },
  { key: "contract", name: "Contract to sign", hint: "Sign link for a contract", category: "CONTRACT", subject: "{{contract.title}} for your signature",
    blocks: () => [b("heading", { text: "Please review and sign" }), b("text", { text: "Hello {{contact.firstName}},\n\n{{company.name}} has sent you {{contract.title}} to sign. It takes less than a minute." }), b("button", { label: "Review and sign", url: "{{contract.link}}" })] },
  { key: "csat", name: "Satisfaction survey (CSAT)", hint: "One-tap 1 to 5 rating", category: "SURVEY", subject: "How did we do?",
    blocks: () => [b("heading", { text: "We would value your feedback" }), b("text", { text: "Hello {{contact.firstName}},\n\nThank you for working with {{company.name}}. One tap tells us how we are doing." }), b("csat", { question: "How satisfied were you?" })] },
  { key: "meeting", name: "Meeting invite", hint: "Goes with a calendar invite", category: "INVITE", subject: "Invitation: {{event.name}}",
    blocks: () => [b("heading", { text: "{{event.name}}" }), b("details", { rows: [["When", "{{event.date}}"], ["Where", "{{event.venue}}"]] }), b("text", { text: "A calendar invitation is attached. Accept it to add this to your diary." })] },
  { key: "newsletter", name: "Campaign announcement", hint: "Marketing message with unsubscribe", category: "MARKETING", subject: "{{campaign.name}}",
    blocks: () => [b("heading", { text: "Something new from {{company.name}}" }), b("text", { text: "Hello {{contact.firstName}},\n\nWrite your message here." }), b("button", { label: "Find out more", url: "https://" })] },
];
