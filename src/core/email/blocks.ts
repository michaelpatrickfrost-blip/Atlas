/** Template maker model. Blocks are data; rendering always goes through the company brand. */
export type EmailBlock =
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "text"; text: string }
  | { id: string; type: "image"; url: string; alt?: string }
  | { id: string; type: "button"; label: string; url: string }
  | { id: string; type: "details"; rows: Array<[string, string]> }
  | { id: string; type: "columns"; left: string; right: string }
  | { id: string; type: "csat"; question: string }
  | { id: string; type: "divider" }
  | { id: string; type: "spacer" };

export const BLOCK_TYPES: Array<{ type: EmailBlock["type"]; label: string; hint: string }> = [
  { type: "heading", label: "Heading", hint: "A short title" },
  { type: "text", label: "Text", hint: "Paragraphs with merge fields" },
  { type: "button", label: "Button", hint: "A link people can tap" },
  { type: "details", label: "Details", hint: "Label and value rows, e.g. order facts" },
  { type: "csat", label: "Rating row", hint: "1 to 5 satisfaction buttons" },
  { type: "image", label: "Image", hint: "A picture from a link" },
  { type: "columns", label: "Two columns", hint: "Side by side text" },
  { type: "divider", label: "Divider", hint: "A thin line" },
  { type: "spacer", label: "Space", hint: "Breathing room" },
];

/** Merge fields offered in the editor. Values come from the record that triggered the email. */
export const MERGE_FIELDS = [
  "customer.name", "contact.firstName", "contact.name", "contact.email", "company.name", "sender.name",
  "order.reference", "order.total", "order.status", "order.deliveryDate",
  "quote.reference", "quote.total", "quote.link",
  "invoice.reference", "invoice.total", "invoice.dueDate",
  "shipment.reference", "shipment.tracking", "shipment.carrier",
  "case.number", "case.subject", "contract.title", "contract.link", "csat.url",
  "campaign.name", "event.name", "event.date", "event.venue",
];

export function newBlock(type: EmailBlock["type"]): EmailBlock {
  const id = Math.random().toString(36).slice(2, 10);
  switch (type) {
    case "heading": return { id, type, text: "Heading" };
    case "text": return { id, type, text: "Hello {{contact.firstName}}," };
    case "image": return { id, type, url: "", alt: "" };
    case "button": return { id, type, label: "Open", url: "https://" };
    case "details": return { id, type, rows: [["Reference", "{{order.reference}}"]] };
    case "columns": return { id, type, left: "", right: "" };
    case "csat": return { id, type, question: "How did we do?" };
    case "divider": return { id, type };
    case "spacer": return { id, type };
  }
}

export function sanitiseBlocks(value: unknown): EmailBlock[] {
  if (!Array.isArray(value)) return [];
  const out: EmailBlock[] = [];
  for (const raw of value.slice(0, 60)) {
    if (!raw || typeof raw !== "object") continue;
    const b = raw as Record<string, unknown>;
    const type = String(b.type) as EmailBlock["type"];
    if (!BLOCK_TYPES.some((t) => t.type === type)) continue;
    const base = newBlock(type) as Record<string, unknown>;
    const id = typeof b.id === "string" && b.id ? b.id.slice(0, 20) : String(base.id);
    const str = (k: string, max = 4000) => (typeof b[k] === "string" ? String(b[k]).slice(0, max) : String(base[k] ?? ""));
    switch (type) {
      case "heading": out.push({ id, type, text: str("text", 300) }); break;
      case "text": out.push({ id, type, text: str("text") }); break;
      case "image": out.push({ id, type, url: str("url", 1000), alt: str("alt", 200) }); break;
      case "button": out.push({ id, type, label: str("label", 100), url: str("url", 1000) }); break;
      case "columns": out.push({ id, type, left: str("left"), right: str("right") }); break;
      case "csat": out.push({ id, type, question: str("question", 300) }); break;
      case "details": {
        const rows = Array.isArray(b.rows) ? b.rows.slice(0, 20).filter((r): r is [string, string] => Array.isArray(r) && r.length >= 2).map((r) => [String(r[0]).slice(0, 100), String(r[1]).slice(0, 300)] as [string, string]) : [];
        out.push({ id, type, rows });
        break;
      }
      default: out.push({ id, type } as EmailBlock);
    }
  }
  return out;
}
