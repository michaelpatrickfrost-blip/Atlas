import { z } from "zod";
import { pageProjectionSchema, type PageSourcePolicy } from "@/core/studio/pages/owner-contract";

/** Closed, browser-safe display contracts only; parsing never grants access. */
const string = (id: string, label: string, nullable = false) => ({ id, label, valueType: "string" as const, nullable, classification: "confidential" as const });
const number = (id: string, label: string, nullable = false) => ({ id, label, valueType: "number" as const, nullable, classification: "confidential" as const });
export const ticketPanelKinds = ["status", "activity", "documents", "relationships", "outstanding_work", "approval"] as const;
export type TicketPanelKind = typeof ticketPanelKinds[number];
export const ticketPanelColumns = {
  status: [string("status", "Status"), string("owner", "Owner"), number("reopen_count", "Reopened"), string("first_response_state", "First response"), string("first_response_due", "Response target", true), string("resolution_state", "Resolution"), string("resolution_due", "Resolution target", true)],
  activity: [string("kind", "Entry"), string("created_at", "Date"), string("actor", "By"), string("visibility", "Visibility"), string("body", "Details")],
  documents: [string("name", "File"), number("size", "Size"), string("mime", "Type"), string("created_at", "Added")],
  relationships: [string("number", "Reference"), string("subject", "Subject"), string("status", "Status"), string("destination", "App"), string("relationship", "Relationship")],
  outstanding_work: [string("number", "Reference"), string("subject", "Subject"), string("status", "Status"), string("destination", "App"), string("relationship", "Relationship")],
  approval: [string("approval_status", "Approval"), number("stage", "Stage", true), string("approver", "Approver", true), string("status", "Status"), string("reason", "Reason", true), string("due_at", "Due", true)],
} satisfies Record<TicketPanelKind, PageSourcePolicy["queries"][number]["columns"]>;
export const ticketPanelLabels: Record<TicketPanelKind, string> = { status: "Ticket status & service targets", activity: "Conversation & history", documents: "Evidence", relationships: "Linked work", outstanding_work: "Outstanding linked work", approval: "Approval status" };
export const ticketPanelQuery = (kind: TicketPanelKind) => ({ id: `tickets.ticket.page.${kind}`, version: 1 });
export const ticketPanelSurface = (kind: TicketPanelKind) => ({ id: `tickets.ticket.${kind}_panel`, version: 1 });
export const ticketPanelOutput = (kind: TicketPanelKind) => pageProjectionSchema(ticketPanelColumns[kind], kind === "status" ? 1 : 50);
const text = z.string().max(10000), date = z.iso.datetime(), id = z.string().regex(/^[a-zA-Z0-9_-]{1,200}$/);
export const ticketPanelValues = {
  status: z.strictObject({ status: text, owner: text, reopen_count: z.number().int().nonnegative(), first_response_state: text, first_response_due: date.nullable(), resolution_state: text, resolution_due: date.nullable() }),
  activity: z.strictObject({ kind: text, created_at: date, actor: text, visibility: z.enum(["REQUESTER", "INTERNAL"]), body: text }),
  documents: z.strictObject({ name: text, size: z.number().int().nonnegative().safe(), mime: text, created_at: date }),
  relationships: z.strictObject({ number: text, subject: text, status: text, destination: z.enum(["ticket", "query", "case"]), relationship: text }),
  outstanding_work: z.strictObject({ number: text, subject: text, status: text, destination: z.enum(["ticket", "query"]), relationship: text }),
  approval: z.strictObject({ approval_status: text, stage: z.number().int().nonnegative().nullable(), approver: text.nullable(), status: text, reason: text.nullable(), due_at: date.nullable() }),
};
export function parseTicketPanel<K extends TicketPanelKind>(kind: K, input: unknown): { id: string; values: z.infer<typeof ticketPanelValues[K]> }[] {
  const output = ticketPanelOutput(kind).parse(input);
  if (new Set(output.rows.map(row => row.id)).size !== output.rows.length) throw new Error("Duplicate Ticket panel row.");
  if (output.nextCursor !== null) throw new Error("Ticket panels use a bounded first page, not an unverified continuation.");
  return output.rows.map(row => ({ id: id.parse(row.id), values: ticketPanelValues[kind].parse(row.values) as z.infer<typeof ticketPanelValues[K]> }));
}
