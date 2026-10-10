// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ usePathname: () => "/finance", useSearchParams: () => new URLSearchParams() }));
import { FloatingModuleNav } from "@/components/shell/floating-module-nav";
afterEach(() => { cleanup(); document.getElementById("atlas-module-nav-slot")?.remove(); });
it("opens grouped navigation with arrows, moves through links and restores focus on Escape", async () => {
  const slot = document.createElement("div"); slot.id = "atlas-module-nav-slot"; document.body.append(slot);
  render(<FloatingModuleNav title="Finance" items={[{ label: "Invoices", href: "/finance/receivables", group: "Trading" }, { label: "Purchases", href: "/finance/purchases", group: "Trading" }]} />);
  const trigger = await screen.findByRole("button", { name: "Trading" }); trigger.focus();
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Invoices" })));
  fireEvent.keyDown(document.activeElement!, { key: "End" });
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Purchases" })));
  fireEvent.keyDown(document.activeElement!, { key: "Escape" });
  expect(trigger.getAttribute("aria-expanded")).toBe("false"); expect(document.activeElement).toBe(trigger);
});
