import { describe, expect, it } from "vitest";
import type { Session } from "@/core/auth/session";
import { CONSOLE_DESTINATIONS, consoleDestinations, consoleRole } from "@/modules/manufacturing/domain/console";
import { SUPPLY_GUIDES } from "@/modules/manufacturing/domain/guides";
const session = (capabilities: string[]) => ({ capabilities: new Set(capabilities) }) as Session;
describe("Manufacturing & Supply workspace", () => {
  it("does not expose financial or demand workspaces merely from a manufacturing grant", () => {
    const links = consoleDestinations(session(["manufacturing.order.read"]), new Set(["manufacturing", "finance", "planning"]));
    expect(links.map((item) => item.id)).toContain("orders");
    expect(links.map((item) => item.id)).not.toContain("spend");
    expect(links.map((item) => item.id)).not.toContain("demand");
  });
  it("requires all source permissions and an enabled owning app", () => {
    const caps = ["planning.demand.read", "stock.read", "sales.order.read", "finance.overview.read", "finance.report.read"];
    expect(consoleDestinations(session(caps), new Set(["planning", "stock", "sales"])).map((item) => item.id)).toContain("demand");
    expect(consoleDestinations(session(caps.slice(0, 2)), new Set(["planning", "stock", "sales"])).map((item) => item.id)).not.toContain("demand");
    expect(consoleDestinations(session(caps), new Set(["planning"])).map((item) => item.id)).not.toContain("demand");
    expect(consoleDestinations(session(caps), new Set(["finance"])).map((item) => item.id)).toContain("spend");
    expect(consoleDestinations(session(caps), new Set()).length).toBe(0);
  });
  it("keeps the full directory and illustrated instructions addressable", () => {
    expect(new Set(CONSOLE_DESTINATIONS.map((item) => item.id)).size).toBe(CONSOLE_DESTINATIONS.length);
    expect(new Set(SUPPLY_GUIDES.map((item) => item.id)).size).toBe(SUPPLY_GUIDES.length);
    for (const guide of SUPPLY_GUIDES) for (const id of guide.destinations) expect(CONSOLE_DESTINATIONS.some((item) => item.id === id)).toBe(true);
    expect(consoleRole("invented")).toBe("all");
    expect(consoleRole("buyer")).toBe("buyer");
  });
});
