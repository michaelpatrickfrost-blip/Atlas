import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TicketRecordSurface } from "@/components/service-work/ticket-record-panels";
import { ticketPanelSurface } from "@/core/service-work/page-panel-contract";
const render = (kind: Parameters<typeof ticketPanelSurface>[0], rows: unknown[]) => renderToStaticMarkup(<TicketRecordSurface surface={ticketPanelSurface(kind)} outputs={[{ rows, nextCursor: null }]}/>);
describe("shared read-only native Ticket panels", () => {
  it("shows safe document download links/zero bytes and no upload action or arbitrary URL execution", () => {
    const html = render("documents", [{ id: "file_1", values: { name: "Evidence.pdf", size: 0, mime: "application/pdf", created_at: "2026-10-12T01:00:00Z" } }]);
    expect(html).toContain('/api/service-files/file_1'); expect(html).toContain("0 KB"); expect(html).toContain("up to 50"); expect(html).not.toContain("<form");
    expect(() => render("documents", [{ id: "../secrets", values: { name: "x", size: 0, mime: "x", created_at: "2026-10-12T01:00:00Z" } }])).toThrow();
  });
  it("escapes conversation content and labels genuine internal visibility without reply controls", () => {
    const html = render("activity", [{ id: "entry", values: { kind: "REPLY", created_at: "2026-10-12T01:00:00Z", actor: "Colleague", visibility: "INTERNAL", body: "<script>alert(1)</script>" } }]);
    expect(html).toContain("Internal · receiving team only"); expect(html).toContain("&lt;script&gt;"); expect(html).not.toContain("<script>"); expect(html).not.toContain("<form");
  });
  it("builds links only for fixed native destinations and accurately calls open child records linked work", () => {
    const html = render("outstanding_work", [{ id: "child", values: { number: "TK-1", subject: "Child", status: "NEW", destination: "ticket", relationship: "Child work" } }]);
    expect(html).toContain('/tickets/child'); expect(html).toContain("Open linked work"); expect(html).not.toContain("Process");
    expect(() => render("relationships", [{ id: "child", values: { number: "1", subject: "x", status: "NEW", destination: "https://evil.invalid", relationship: "Child" } }])).toThrow();
  });
  it("displays existing approval summary/steps/status, zero native reopen count and no transition actions", () => {
    const approval = render("approval", [{ id: "approval", values: { approval_status: "PENDING", stage: null, approver: null, status: "PENDING", reason: null, due_at: null } },
      { id: "step", values: { approval_status: "PENDING", stage: 0, approver: "Alice", status: "PENDING", reason: "Please review", due_at: "2026-10-12T01:00:00Z" } }]);
    expect(approval).toContain("Stage 1"); expect(approval).toContain("Alice"); expect(approval).not.toContain("<form");
    const status = render("status", [{ id: "ticket", values: { status: "NEW", owner: "Unassigned", reopen_count: 0, first_response_state: "UNSET", first_response_due: null, resolution_state: "PAUSED", resolution_due: null } }]);
    expect(status).toContain("Reopened 0 times"); expect(status).toContain("paused");
  });
  it("refuses malformed/wider/missing/unknown output contracts; no fetch or command seam", () => {
    expect(renderToStaticMarkup(<TicketRecordSurface surface={{ id: "other.surface", version: 1 }} outputs={[]}/>)).toBe("");
    expect(() => renderToStaticMarkup(<TicketRecordSurface surface={ticketPanelSurface("documents")} outputs={[]}/>)).toThrow();
    expect(() => render("activity", [{ id: "row", values: { body: "only", command: "delete" } }])).toThrow();
  });
});
