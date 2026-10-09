// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Link from "next/link";

const route = vi.hoisted(() => ({ pathname: "/sales" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
import { AppMenu } from "@/components/shell/app-menu";

afterEach(() => { cleanup(); route.pathname = "/sales"; });
function Menu() {
  return <AppMenu><nav aria-label="Apps"><h2>Customers</h2><Link href="/customers" onClick={(event) => event.preventDefault()}>Customers</Link></nav></AppMenu>;
}

it("keeps group clicks open, closes on Escape and restores the trigger focus", () => {
  render(<Menu />);
  const trigger = screen.getByRole("button", { name: "Apps" });
  fireEvent.click(trigger);
  const panel = screen.getByRole("region", { name: "Apps menu" });
  expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
  fireEvent.click(screen.getByRole("heading", { name: "Customers" }));
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  screen.getByRole("link", { name: "Customers" }).focus();
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("region", { name: "Apps menu" })).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

it("closes for a chosen app and an outside click", () => {
  render(<Menu />);
  const trigger = screen.getByRole("button", { name: "Apps" });
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("link", { name: "Customers" }));
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(trigger);
  fireEvent.click(document.body);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
});

it("does not carry an open menu across routes or reopen when returning", () => {
  const view = render(<Menu />);
  fireEvent.click(screen.getByRole("button", { name: "Apps" }));
  route.pathname = "/customers";
  view.rerender(<Menu />);
  expect(screen.queryByRole("region", { name: "Apps menu" })).toBeNull();
  route.pathname = "/sales";
  view.rerender(<Menu />);
  expect(screen.queryByRole("region", { name: "Apps menu" })).toBeNull();
  route.pathname = "/home";
  view.rerender(<Menu />);
  expect(screen.queryByRole("button", { name: "Apps" })).toBeNull();
});
