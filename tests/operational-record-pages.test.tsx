import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { meetingScope } from "@/core/permissions/work-access";
import type { Session } from "@/core/auth/session";

const mocks = vi.hoisted(() => ({
  session: { organisationId: "org", userId: "reader", capabilities: new Set<string>() },
  enabled: vi.fn(), enabledIds: vi.fn(), members: vi.fn(),
  db: Object.fromEntries(["meeting", "meetingEntry", "project", "maintenanceEquipment", "maintenanceWorkOrder", "fleetVehicle", "engineeringRevision", "fieldServiceJob"].map(name => [name, { findFirst: vi.fn(), findMany: vi.fn() }])),
}));
vi.mock("@/core/db/client", () => ({ db: mocks.db }));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => mocks.session }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: mocks.enabled }));
vi.mock("@/core/modules/runtime", () => ({ getEnabledModuleIds: mocks.enabledIds }));
vi.mock("@/core/shared/operational-forms", () => ({ members: mocks.members }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import MeetingPage from "@/app/(app)/meetings/[id]/page";
import EquipmentPage from "@/app/(app)/maintenance/equipment/[id]/page";
import WorkPage from "@/app/(app)/maintenance/work/[id]/page";
import VehiclePage from "@/app/(app)/fleet/[id]/page";
import RevisionPage from "@/app/(app)/engineering/[id]/page";
import JobPage from "@/app/(app)/fieldservice/[id]/page";
import { meetingAccess, meetingWorkspace } from "@/modules/meetings/services/queries";

const pages = [
  { page: MeetingPage, model: "meeting", title: "Meeting unavailable", href: "/meetings", cap: "meetings.meeting.read" },
  { page: EquipmentPage, model: "maintenanceEquipment", title: "Equipment unavailable", href: "/maintenance?view=equipment", cap: "maintenance.work.read" },
  { page: WorkPage, model: "maintenanceWorkOrder", title: "Work order unavailable", href: "/maintenance", cap: "maintenance.work.read" },
  { page: VehiclePage, model: "fleetVehicle", title: "Vehicle unavailable", href: "/fleet", cap: "fleet.vehicle.read" },
  { page: RevisionPage, model: "engineeringRevision", title: "Revision unavailable", href: "/engineering", cap: "engineering.revision.read" },
  { page: JobPage, model: "fieldServiceJob", title: "Job unavailable", href: "/fieldservice", cap: "fieldservice.job.read" },
];
const params = () => ({ params: Promise.resolve({ id: "absent-or-inaccessible" }) });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.capabilities = new Set([...pages.map(p => p.cap), "core.products.read", "customers.read"]);
  mocks.enabled.mockResolvedValue(undefined);
  mocks.enabledIds.mockResolvedValue(new Set(["fleet", "products"]));
  mocks.members.mockResolvedValue([]);
  for (const delegate of Object.values(mocks.db)) { delegate.findMany.mockResolvedValue([]); delegate.findFirst.mockResolvedValue(null); }
});
describe("unavailable operational records", () => {
  it.each(pages)("$title has a truthful neutral state and module return link", async ({ page, title, href, model }) => {
    const html = renderToStaticMarkup(await page(params()));
    expect(html).toContain(title);
    expect(html).toContain('data-guardian-state="record-unavailable"');
    expect(html).toContain(`href="${href.replaceAll("&", "&amp;")}"`);
    expect(html).toContain("no longer available, or you do not have access");
    expect(html).not.toContain("absent-or-inaccessible");
    expect(html).not.toContain("<form");
    const where = mocks.db[model].findFirst.mock.calls[0][0].where;
    expect(where).toEqual(model === "meeting" ? { AND: [meetingScope(mocks.session as Session), { id: "absent-or-inaccessible" }] } : expect.objectContaining({ id: "absent-or-inaccessible", organisationId: "org" }));
  });
  it.each(pages)("$title preserves genuine database failures", async ({ page, model }) => {
    const error = Error("Database unavailable");
    mocks.db[model].findFirst.mockRejectedValue(error);
    await expect(page(params())).rejects.toBe(error);
  });
  it.each(pages)("$title enforces read permission before loading a record", async ({ page, model, cap }) => {
    mocks.session.capabilities.delete(cap);
    await expect(page(params())).rejects.toThrow("FORBIDDEN");
    expect(mocks.db[model].findFirst).not.toHaveBeenCalled();
  });
  it.each(pages)("$title preserves disabled-module failures", async ({ page, model }) => {
    const error = Error("Module disabled"); mocks.enabled.mockRejectedValue(error);
    await expect(page(params())).rejects.toBe(error);
    expect(mocks.db[model].findFirst).not.toHaveBeenCalled();
  });
  it("never reads entries for an unavailable private/project-scoped meeting, while mutation access still rejects", async () => {
    const workspace = await meetingWorkspace("private-or-foreign");
    expect(workspace.record).toBeNull(); expect(workspace.entries).toEqual([]);
    expect(mocks.db.meetingEntry.findMany).not.toHaveBeenCalled();
    expect(mocks.db.meeting.findFirst).toHaveBeenCalledWith({ where: { AND: [meetingScope(mocks.session as Session), { id: "private-or-foreign" }] } });
    await expect(meetingAccess(mocks.session as Session, "private-or-foreign")).rejects.toThrow("Meeting unavailable");
  });
  it("keeps vehicle work hidden without Fleet source access", async () => {
    mocks.session.capabilities.delete("fleet.vehicle.read");
    await WorkPage(params());
    expect(mocks.db.maintenanceWorkOrder.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "absent-or-inaccessible", organisationId: "org", vehicleId: null }, include: expect.objectContaining({ vehicle: false }) }));
  });
  it("keeps erased customer jobs out of direct record reads", async () => {
    await JobPage(params());
    expect(mocks.db.fieldServiceJob.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "absent-or-inaccessible", organisationId: "org", party: { identityScrubbed: false } } }));
  });
});
