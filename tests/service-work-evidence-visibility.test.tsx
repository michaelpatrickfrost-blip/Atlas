import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Session } from "@/core/auth/session";
const mock = vi.hoisted(() => ({ session: vi.fn(), work: vi.fn(), items: vi.fn(), entries: vi.fn(), members: vi.fn(), enabled: vi.fn(), approval: vi.fn(), case: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ requireSession: mock.session }));
vi.mock("@/core/db/client", () => ({ db: { serviceWorkItem: { findFirst: mock.work, findMany: mock.items }, serviceWorkEntry: { findMany: mock.entries }, membership: { findMany: mock.members }, approvalInstance: { findFirst: mock.approval }, serviceCase: { findFirst: mock.case } } }));
vi.mock("@/core/modules/runtime", () => ({ isModuleEnabled: mock.enabled }));
vi.mock("@/core/service-work/queries", () => ({ deskQueues: async () => [] }));
vi.mock("@/core/service-work/actions", () => ({ commentWork: vi.fn(), mergeWork: vi.fn(), watchWork: vi.fn(), requestWorkApproval: vi.fn(), decideWorkApproval: vi.fn() }));
vi.mock("@/core/service-work/file-actions", () => ({ attachServiceFile: vi.fn() }));
vi.mock("@/core/service-work/field-forms", () => ({ ticketFieldFormManifest: vi.fn() }));
vi.mock("@/core/service-work/record-types", () => ({ ticketRecordTypeSelection: vi.fn() }));
vi.mock("@/core/studio/pages/record-default", () => ({ recordDefaultCustomerPageTarget: async () => null }));
vi.mock("@/components/ui/action-form", () => ({ ActionForm: ({ children, label }: { children: React.ReactNode; label: string }) => <form aria-label={label}>{children}</form> }));
vi.mock("@/components/service-work/request-form", () => ({ RequestForm: () => null }));
vi.mock("@/components/service-work/ticket-progress-form", () => ({ TicketProgressForm: () => null }));
import { WorkDetail } from "@/components/service-work/work-detail";
// Actual native component and shared markup, mocked authentication/database/form
// collaborators. SQL row visibility/download/access races remain central evidence.
const date = new Date("2026-10-12T01:00:00Z");
const session = { userId: "requester", organisationId: "company", capabilities: new Set(["tickets.ticket.read"]), membershipId: "member" } as Session;
const files = [ { id: "public", name: "Visible.pdf", visibility: "REQUESTER", size: 0, mime: "application/pdf", createdAt: date }, { id: "internal", name: "INTERNAL-secret.pdf", visibility: "INTERNAL", size: 20, mime: "application/pdf", createdAt: date } ];
const native = (agent: boolean) => ({ id: "ticket", number: "TK-1", kind: "TICKET", subject: "Request", type: "QUESTION", priority: "NORMAL", description: "Description", status: "NEW", version: 1,
  queue: { name: "Team", restricted: false, members: agent ? [{ userId: "requester" }] : [] }, files, context: {}, definition: {}, requesterUserId: "requester", parentId: null, parentCaseId: null,
  mergedIntoId: null, approvalId: "approval", firstResponseDueAt: null, firstResponseAt: null, resolutionDueAt: null, resolvedAt: null, pausedAt: null, ownerUserId: null, reopenCount: 0, watcherIds: [] });
beforeEach(() => { vi.resetAllMocks(); mock.session.mockResolvedValue(session); mock.enabled.mockResolvedValue(true); mock.entries.mockResolvedValue([]); mock.items.mockResolvedValue([]); mock.members.mockResolvedValue([]); });
it.each([false, true])("native evidence applies receiving-team visibility before names leave (member=%s), while original forms remain", async agent => {
  mock.work.mockImplementation(async args => {
    // Reflect the submitted original scoped relation predicate. An old include
    // with no visibility policy intentionally returns both and fails the test.
    const where = args.include?.files?.where;
    const scoped = where?.OR?.some((part: { visibility: string; work?: unknown }) => part.visibility === "INTERNAL" && part.work);
    return { ...native(agent), files: scoped && !agent ? files.filter(file => file.visibility === "REQUESTER") : files };
  });
  const html = renderToStaticMarkup(await WorkDetail({ id: "ticket" }));
  expect(html).toContain("Visible.pdf"); expect(html.includes("INTERNAL-secret.pdf")).toBe(agent);
  expect(mock.work.mock.calls[0][0].include.files.where).toEqual({ organisationId: "company", OR: [{ visibility: "REQUESTER" }, { visibility: "INTERNAL", work: { queue: { members: { some: { organisationId: "company", userId: "requester" } } } } }] });
  expect(html).toContain('aria-label="Attach evidence"'); expect(html).toContain('aria-label="Add reply"'); expect(mock.approval).not.toHaveBeenCalled();
});
it("does not project a linked case identity/name through Ticket Read alone", async () => {
  mock.work.mockResolvedValue({ ...native(false), files: [files[0]], parentCaseId: "private-case", context: { origin: { caseNumber: "PRIVATE-CASE" } } });
  const html = renderToStaticMarkup(await WorkDetail({ id: "ticket" }));
  expect(html).not.toContain("PRIVATE-CASE"); expect(html).not.toContain("private-case"); expect(mock.case).not.toHaveBeenCalled();
});
