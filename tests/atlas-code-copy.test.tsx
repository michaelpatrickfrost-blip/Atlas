// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("@/app/(app)/atlas/actions", () => ({ createCompanyAccount: vi.fn() }));
vi.mock("@/app/(app)/atlas/setup-actions", () => ({ createCompanyUser: vi.fn() }));
import { CodeReady } from "@/app/(app)/atlas/account-forms";

const code = "disposable-unit-test-code";
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const writeText = vi.fn();
beforeEach(() => {
  writeText.mockReset();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
});
afterEach(() => {
  cleanup();
  if (originalClipboard) Object.defineProperty(navigator, "clipboard", originalClipboard);
  else delete (navigator as unknown as { clipboard?: Clipboard }).clipboard;
});
const show = () => render(<CodeReady title="One-time code ready" code={code} expiresAt="2026-10-08T12:00:00Z" />);

it("copies the exact code and announces successful completion", async () => {
  writeText.mockResolvedValue(undefined);
  show();
  fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Code copied."));
  expect(writeText).toHaveBeenCalledWith(code);
  expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
  expect(screen.getByText(code).textContent).toBe(code);
});

it("handles denied clipboard permission with usable feedback and keeps the code visible", async () => {
  writeText.mockRejectedValue(new DOMException("Sensitive provider detail", "NotAllowedError"));
  show();
  fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Select the code above and copy it manually."));
  expect(screen.queryByRole("button", { name: "Copied" })).toBeNull();
  expect(screen.queryByText(/Sensitive provider detail/)).toBeNull();
  expect(screen.getByText(code).textContent).toBe(code);
  expect((screen.getByRole("button", { name: "Copy code" }) as HTMLButtonElement).disabled).toBe(false);
});

it("provides the same recovery when the browser has no Clipboard API", async () => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  show();
  fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("copy it manually"));
  expect(screen.getByText(code)).toBeTruthy();
  expect(writeText).not.toHaveBeenCalled();
});

it("allows retry after denial and replaces stale failure feedback only after success", async () => {
  writeText.mockRejectedValueOnce(new Error("Denied")).mockResolvedValueOnce(undefined);
  show();
  fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("copy it manually"));
  fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Code copied."));
  expect(writeText).toHaveBeenCalledTimes(2);
  expect(writeText.mock.calls.every(([value]) => value === code)).toBe(true);
});

it("prevents overlapping clicks while a clipboard write is pending", async () => {
  let complete!: () => void;
  writeText.mockReturnValue(new Promise<void>(resolve => { complete = resolve; }));
  show();
  fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
  const pending = screen.getByRole("button", { name: "Copying…" }) as HTMLButtonElement;
  expect(pending.disabled).toBe(true);
  fireEvent.click(pending);
  expect(writeText).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("button", { name: "Copied" })).toBeNull();
  await act(async () => complete());
  expect(screen.getByRole("status").textContent).toBe("Code copied.");
});
