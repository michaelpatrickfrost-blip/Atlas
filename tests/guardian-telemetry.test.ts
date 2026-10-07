import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ session: { userId: "qa" } as { userId: string } | null, record: vi.fn(), limit: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ getSession: async () => state.session }));
vi.mock("@/core/guardian/store", () => ({ recordFinding: state.record }));
vi.mock("@/core/db/client", () => ({ db: { $queryRawUnsafe: state.limit } }));
import { POST } from "@/app/api/guardian/telemetry/route";
function request(origin = "https://atlas.test", body: unknown = { kind: "PAGE_ERROR", code: "RenderError", path: "/sales/orders/cmabcdefghijklmnopqrstuv?secret=ignored" }) {
  return new Request("http://localhost:3000/api/guardian/telemetry", { method: "POST", headers: { origin, host: "atlas.test", "content-type": "application/json" }, body: JSON.stringify(body) });
}
beforeEach(() => { vi.clearAllMocks(); state.session = { userId: "qa" }; state.limit.mockResolvedValue([{ count: 1 }]); });
describe("Guardian browser telemetry", () => {
  it("accepts the public HTTPS host behind a loopback reverse proxy and strips identifiers", async () => {
    expect((await POST(request())).status).toBe(204);
    expect(state.record.mock.calls[0][0].route).toBe("/sales/orders/[record]");
    expect(JSON.stringify(state.record.mock.calls[0])).not.toContain("secret");
  });
  it("rejects a cross-origin request before session or diagnostic writes", async () => {
    expect((await POST(request("https://outside.test"))).status).toBe(403); expect(state.limit).not.toHaveBeenCalled(); expect(state.record).not.toHaveBeenCalled();
  });
  it("rejects unauthenticated and malformed events", async () => {
    state.session = null; expect((await POST(request())).status).toBe(401);
    state.session = { userId: "qa" }; expect((await POST(request(undefined, { kind: "PAGE_ERROR", code: "Customer private message", path: "/sales" }))).status).toBe(400);
    expect(state.record).not.toHaveBeenCalled();
  });
  it("rate-limits writes without returning report data", async () => {
    state.limit.mockResolvedValue([{ count: 11 }]); const response = await POST(request());
    expect(response.status).toBe(429); expect(await response.text()).toBe(""); expect(state.record).not.toHaveBeenCalled();
  });
});
