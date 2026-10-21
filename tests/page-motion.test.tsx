// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useState } from "react";
import { PageMotion } from "@/components/shell/page-motion";
import { Tabs } from "@/components/ui/tabs";
const route = vi.hoisted(() => ({ pathname: "/customers" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function Draft() { const [value, setValue] = useState(""); return <input aria-label="Draft" value={value} onChange={event => setValue(event.target.value)} />; }
it("animates navigation without resetting a mounted draft, and cancels interrupted motion", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  const cancel = vi.fn(), animate = vi.fn(() => ({ cancel }));
  Object.defineProperty(Element.prototype, "animate", { configurable: true, value: animate });
  const view = render(<PageMotion><Draft /></PageMotion>);
  fireEvent.change(screen.getByLabelText("Draft"), { target: { value: "Keep my unsaved work" } });
  route.pathname = "/customers/account";
  view.rerender(<PageMotion><Draft /></PageMotion>);
  expect((screen.getByLabelText("Draft") as HTMLInputElement).value).toBe("Keep my unsaved work");
  expect(animate).toHaveBeenCalledTimes(2);
  expect(cancel).toHaveBeenCalledOnce();
  expect(animate.mock.calls[1]).not.toHaveProperty("1.fill", "forwards");
});
it("does not start route motion when reduced motion is requested", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  const animate = vi.fn();
  Object.defineProperty(Element.prototype, "animate", { configurable: true, value: animate });
  render(<PageMotion><Draft /></PageMotion>);
  expect(animate).not.toHaveBeenCalled();
});
it("preserves unsaved record fields when moving between animated tabs", () => {
  window.history.replaceState(null, "", "/customers/account");
  render(<Tabs tabs={[{ id: "overview", label: "Overview", content: <Draft /> }, { id: "activity", label: "Activity", content: <p>Recent activity</p> }]} />);
  fireEvent.change(screen.getByLabelText("Draft"), { target: { value: "Still here" } });
  fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
  expect(screen.getByRole("tabpanel").textContent).toBe("Recent activity");
  fireEvent.click(screen.getByRole("tab", { name: "Overview" }));
  expect((screen.getByLabelText("Draft") as HTMLInputElement).value).toBe("Still here");
  expect(window.location.hash).toBe("#overview");
});
