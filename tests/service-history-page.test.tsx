import React from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const state = vi.hoisted(() => ({ list: vi.fn(), session: { organisationId: "tenant", userId: "reader", capabilities: new Set(["service.ticket.read"]) } }));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => state.session }));
vi.mock("@/modules/service/services/queries", () => ({ ticketList: state.list }));
vi.mock("next/navigation", () => ({ redirect: () => { throw new Error("Unrelated Tickets redirect"); } }));
import History from "@/app/(app)/service/tickets/page";
beforeEach(() => { vi.clearAllMocks(); state.list.mockResolvedValue([{ id: "legacy", number: "FIN-000123", subject: "Original departmental investigation", status: "IN_PROGRESS", dueAt: new Date("2026-10-08"), ownerUserId: null, queue: { name: "Finance" }, case: { number: "CS-100" } }]); });
it("opens original department work without redirecting to the new Tickets app", async () => {
  const page = History as unknown as (props: { searchParams: Promise<Record<string, string>> }) => Promise<React.ReactNode>;
  const html = renderToStaticMarkup(await page({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("Historical department work"); expect(html).toContain("FIN-000123"); expect(html).toContain('/service/tickets/legacy');
  expect(state.list).toHaveBeenCalledWith(state.session, expect.any(Object));
});
it("keeps search, status, case and ownership filters attached to the historical records", async () => {
  const page = History as unknown as (props: { searchParams: Promise<Record<string, string>> }) => Promise<React.ReactNode>;
  await page({ searchParams: Promise.resolve({ q: "FIN", status: "COMPLETE", mine: "1", caseId: "case" }) });
  expect(state.list).toHaveBeenCalledWith(state.session, { q: "FIN", status: "COMPLETE", mine: true, caseId: "case" });
});
