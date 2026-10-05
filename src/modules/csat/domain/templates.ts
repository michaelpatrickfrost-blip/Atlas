/** Ready-made satisfaction surveys. Each says what to ask, what the customer can tick, how the email
 * reads, and when an automation should send it. */
export type CsatTemplate = {
  key: string; name: string; when: string;
  question: string; lowLabel: string; highLabel: string; reasons: string[];
  followUpQuestion: string; lowFollowUpQuestion: string; thanksText: string;
  emailSubject: string; emailIntro: string;
  /** How to attach it in Automations. */
  attach: { triggerEvent: string; conditions: { field: string; op: string; value: string }[]; waitDays: number; sentence: string };
};

const hello = "Hello {{contact.firstName}},";
export const CSAT_TEMPLATES: CsatTemplate[] = [
  { key: "DELIVERY", name: "After a delivery", when: "The day after an order is delivered",
    question: "How was your delivery?", lowLabel: "Poor", highLabel: "Excellent",
    reasons: ["Arrived when promised", "Everything was on the delivery", "Condition of the goods", "Driver and unloading", "Kept informed", "Paperwork"],
    followUpQuestion: "What did we do well?", lowFollowUpQuestion: "Sorry it fell short. What went wrong, so we can put it right?", thanksText: "Thank you. Your feedback goes straight to our delivery team.",
    emailSubject: "How was your delivery from {{company.name}}?", emailIntro: `${hello}\n\nYour order {{order.reference}} has been delivered. It takes one tap to tell us how it went.`,
    attach: { triggerEvent: "logistics.shipment.delivered", conditions: [], waitDays: 1, sentence: "one day after a shipment is delivered" } },
  { key: "ORDER", name: "After placing an order", when: "When an order is confirmed",
    question: "How easy was it to place your order with us?", lowLabel: "Very difficult", highLabel: "Very easy",
    reasons: ["Speed of the quotation", "Price", "Product availability", "Knowledge of our team", "Clear confirmation", "Lead time offered"],
    followUpQuestion: "Anything that would make ordering even easier?", lowFollowUpQuestion: "What made it difficult?", thanksText: "Thank you. We read every reply.",
    emailSubject: "How was ordering from {{company.name}}?", emailIntro: `${hello}\n\nThank you for order {{order.reference}}. One quick question about how it went.`,
    attach: { triggerEvent: "sales.order.confirmed", conditions: [], waitDays: 1, sentence: "one day after an order is confirmed" } },
  { key: "QUOTE", name: "After a quotation", when: "Three days after a quotation is sent",
    question: "How did you find our quotation?", lowLabel: "Not useful", highLabel: "Spot on",
    reasons: ["How quickly it arrived", "Clear and easy to read", "Price", "Lead time", "Right products", "Follow-up from our team"],
    followUpQuestion: "Is there anything else you need from us to decide?", lowFollowUpQuestion: "What was missing or wrong?", thanksText: "Thank you. Your account manager will see this.",
    emailSubject: "Your quotation from {{company.name}}", emailIntro: `${hello}\n\nWe sent you quotation {{quote.reference}} a few days ago. How did we do?`,
    attach: { triggerEvent: "sales.quote.sent", conditions: [], waitDays: 3, sentence: "three days after a quotation is sent" } },
  { key: "CASE", name: "After a support case", when: "The day after a service case is resolved",
    question: "How well did we deal with your issue?", lowLabel: "Not resolved", highLabel: "Fully resolved",
    reasons: ["Speed of first response", "Problem fully fixed", "Kept informed", "Helpful and polite", "Did not have to chase"],
    followUpQuestion: "Anything we could have done better?", lowFollowUpQuestion: "What is still outstanding? We will pick it up.", thanksText: "Thank you. If something is still outstanding we will be in touch.",
    emailSubject: "Did we sort it? {{case.subject}}", emailIntro: `${hello}\n\nWe have closed case {{case.number}}. Please tell us whether it was dealt with properly.`,
    attach: { triggerEvent: "service.case.changed", conditions: [{ field: "case.status", op: "eq", value: "RESOLVED" }], waitDays: 1, sentence: "one day after a service case is resolved" } },
  { key: "INVOICE", name: "After an invoice", when: "Two days after an invoice is posted",
    question: "How clear and accurate was your invoice?", lowLabel: "Wrong or unclear", highLabel: "Clear and correct",
    reasons: ["Matches what was ordered", "Matches what was delivered", "Price as agreed", "Easy to understand", "Sent to the right person"],
    followUpQuestion: "Anything that would make our invoices easier to process?", lowFollowUpQuestion: "What was wrong? Our accounts team will correct it.", thanksText: "Thank you. Our accounts team has your reply.",
    emailSubject: "Was invoice {{invoice.reference}} right?", emailIntro: `${hello}\n\nWe recently sent invoice {{invoice.reference}}. One tap to tell us it was right.`,
    attach: { triggerEvent: "finance.invoice.posted", conditions: [], waitDays: 2, sentence: "two days after an invoice is posted" } },
  { key: "ONBOARDING", name: "New customer, first month", when: "Thirty days after a customer is created",
    question: "How has your first month with us been?", lowLabel: "Disappointing", highLabel: "Excellent",
    reasons: ["Account set up smoothly", "Our team knows your business", "Ordering", "Deliveries", "Pricing", "Getting answers quickly"],
    followUpQuestion: "What should we keep doing?", lowFollowUpQuestion: "What has let you down? We would like to fix it early.", thanksText: "Thank you. Your account manager will follow up.",
    emailSubject: "A month with {{company.name}}: how are we doing?", emailIntro: `${hello}\n\nYou have been a customer for about a month. We would value an honest score.`,
    attach: { triggerEvent: "customer.created", conditions: [], waitDays: 30, sentence: "thirty days after a customer is created" } },
  { key: "WON", name: "After winning a job", when: "A week after an opportunity is won",
    question: "How was the experience of buying from us?", lowLabel: "Hard work", highLabel: "Effortless",
    reasons: ["Understood what you needed", "Technical advice", "Quotation", "Price", "Responsiveness", "Lead time"],
    followUpQuestion: "Why did you choose us?", lowFollowUpQuestion: "What nearly put you off?", thanksText: "Thank you. This helps us win and keep the right work.",
    emailSubject: "Thank you for choosing {{company.name}}", emailIntro: `${hello}\n\nThank you for placing your business with us. A quick question on how we did.`,
    attach: { triggerEvent: "sales.opportunity.won", conditions: [], waitDays: 7, sentence: "a week after an opportunity is won" } },
];
export const csatTemplate = (key: string) => CSAT_TEMPLATES.find((template) => template.key === key);
