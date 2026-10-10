import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const state = vi.hoisted(() => ({ session: { organisationId: "tenant", organisationName: "Test", membershipId: "member", userId: "reader", userName: "Reader", userEmail: "reader@example.test", capabilities: new Set<string>() }, enabled: vi.fn(), rows: vi.fn(), queues: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => state.session }));
vi.mock("@/core/db/client", () => ({ db: { moduleState: { findMany: state.enabled } } }));
vi.mock("@/core/service-work/queries", () => ({ workList: state.rows, deskQueues: state.queues, ticketSearch: vi.fn(), ticketAttention: vi.fn() }));
vi.mock("@/core/service-work/actions", () => ({ createWork: vi.fn(), changeDeskMember: vi.fn(), updateWork: vi.fn(), commentWork: vi.fn(), mergeWork: vi.fn(), watchWork: vi.fn(), requestWorkApproval: vi.fn(), decideWorkApproval: vi.fn() }));
vi.mock("@/core/service-work/file-actions", () => ({ attachServiceFile: vi.fn() }));
vi.mock("@/modules/service/services/recovery", () => ({ saveServiceApprovalRoute: vi.fn() }));
vi.mock("@/components/shell/module-space", () => ({ ModuleSpace: () => <div>Authorised shell</div> }));
import { WorkList } from "@/components/service-work/work-list";
import { WorkDetail } from "@/components/service-work/work-detail";
import { Knowledge } from "@/components/service-work/knowledge";
import { ServiceReports } from "@/components/service-work/reports";
import { serviceWorkRestriction } from "@/components/service-work/access-state";
import CreateTicket from "@/app/(app)/tickets/create/page";
import Queues from "@/app/(app)/tickets/queues/page";
import TicketsLayout from "@/app/(app)/tickets/layout";
beforeEach(() => { vi.clearAllMocks(); state.session.capabilities = new Set(); state.enabled.mockResolvedValue(["service", "tickets"].map(moduleId => ({ moduleId, enabled: true, entitled: true }))); state.rows.mockResolvedValue([]); state.queues.mockResolvedValue([]); });
it("renders a permission explanation before reading any Tickets records", async () => {
  const html = renderToStaticMarkup(await WorkList({ filters: {} }));
  expect(html).toContain("have permission to view this.");
  expect(html).toContain('href="/home"');
  expect(state.enabled).not.toHaveBeenCalled();
  expect(state.rows).not.toHaveBeenCalled(); expect(state.queues).not.toHaveBeenCalled();
});
it("renders disabled/unentitled work without reading queues or work rows", async () => {
  state.session.capabilities.add("tickets.ticket.read"); state.enabled.mockResolvedValue([]);
  const html = renderToStaticMarkup(await WorkList({ filters: {} }));
  expect(html).toContain("This app is not enabled for your company.");
  expect(state.enabled).toHaveBeenCalledWith({ where: { organisationId: "tenant" } });
  expect(state.rows).not.toHaveBeenCalled(); expect(state.queues).not.toHaveBeenCalled();
});
it("preserves authorised list data and filters", async () => {
  state.session.capabilities.add("tickets.ticket.read");
  const html = renderToStaticMarkup(await WorkList({ filters: { q: "request", mine: "1" } }));
  expect(html).toContain("My tickets"); expect(html).not.toContain("access-restricted");
  expect(state.rows).toHaveBeenCalledWith(state.session, { q: "request", mine: true, breach: false, kind: "TICKET" });
  expect(state.queues).toHaveBeenCalledWith(state.session);
});
it("propagates database and authorised workspace failures", async () => {
  state.session.capabilities.add("tickets.ticket.read"); state.enabled.mockRejectedValueOnce(new Error("Database unavailable"));
  await expect(WorkList({ filters: {} })).rejects.toThrow("Database unavailable");
  state.rows.mockRejectedValueOnce(new Error("Broken workspace query"));
  await expect(WorkList({ filters: {} })).rejects.toThrow("Broken workspace query");
});
it("keeps queue read and ticket read independently required", async () => {
  state.session.capabilities.add("tickets.ticket.read");
  expect(renderToStaticMarkup(await Queues())).toContain("have permission");
  expect(state.queues).not.toHaveBeenCalled();
});
it("keeps the create leaf's existing capability separate from record read", async () => {
  state.session.capabilities.add("tickets.ticket.create");
  expect(renderToStaticMarkup(await CreateTicket({ searchParams: Promise.resolve({}) }))).toContain("How can we help?");
  expect(state.queues).toHaveBeenCalled();
});
it("does not read detail, knowledge or report records on denied/disabled access", async () => {
  // The DB mock deliberately provides no business models: any attempted read fails.
  for (const render of [() => WorkDetail({ id: "hidden-record" }), () => Knowledge({ moduleId: "tickets" }), () => ServiceReports({ moduleId: "tickets" })]) {
    expect(renderToStaticMarkup(await render())).toContain("have permission");
  }
  state.session.capabilities.add("tickets.ticket.read"); state.enabled.mockResolvedValue([]);
  expect(renderToStaticMarkup(await WorkDetail({ id: "hidden-record" }))).toContain("not enabled");
});
it("handles the Tickets layout restriction on the server, without the forbidden child", async () => {
  const html = renderToStaticMarkup(await TicketsLayout({ children: <div>PRIVATE CHILD</div> }));
  expect(html).toContain("have permission"); expect(html).not.toContain("PRIVATE CHILD");
  expect(html).toContain('href="/home"');
});
it("preserves Query/Service capability and module scope", async () => {
  state.session.capabilities.add("service.ticket.read");
  expect(await serviceWorkRestriction(state.session, "QUERY")).toBeNull();
  expect(state.enabled).toHaveBeenCalledWith({ where: { organisationId: "tenant" } });
  expect(renderToStaticMarkup((await serviceWorkRestriction(state.session, "QUERY", ["service.case.read"]))!)).toContain("have permission");
});

it("keeps Tickets and Service enablement separate for the same authorised reader", async () => {
  state.session.capabilities = new Set(["tickets.ticket.read", "service.ticket.read"]);
  state.enabled.mockResolvedValue([{ moduleId: "tickets", enabled: true, entitled: true }]);
  expect(await serviceWorkRestriction(state.session, "TICKET")).toBeNull();
  expect(renderToStaticMarkup((await serviceWorkRestriction(state.session, "QUERY"))!)).toContain("not enabled");
  state.enabled.mockResolvedValue([{ moduleId: "service", enabled: true, entitled: false }]);
  expect(renderToStaticMarkup((await serviceWorkRestriction(state.session, "QUERY"))!)).toContain("not enabled");
});
