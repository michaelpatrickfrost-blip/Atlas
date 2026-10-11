// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SidePanel } from "@/components/shell/side-panel";
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it("keeps the native drawer open through the exit animation, then restores focus and clears transient content", async () => {
  const animations: Array<{ cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null }> = [];
  Object.defineProperty(Element.prototype, "animate", { configurable: true, value: vi.fn(() => { const animation = { cancel: vi.fn(), onfinish: null }; animations.push(animation); return animation; }) });
  const close = vi.fn(), after = vi.fn();
  const trigger = document.createElement("button"); document.body.append(trigger); trigger.focus();
  const view = render(<SidePanel open label="Tasks" onClose={close} onAfterClose={after}><button>Close</button></SidePanel>);
  const dialog = await screen.findByRole("dialog", { name: "Tasks" });
  expect(dialog.getAttribute("open")).not.toBeNull();
  view.rerender(<SidePanel open={false} label="Tasks" onClose={close} onAfterClose={after}><button>Close</button></SidePanel>);
  expect(dialog.getAttribute("open")).not.toBeNull(); expect(after).not.toHaveBeenCalled();
  act(() => { animations.at(-1)?.onfinish?.(); });
  expect(dialog.getAttribute("open")).toBeNull(); expect(after).toHaveBeenCalledOnce(); expect(document.activeElement).toBe(trigger); trigger.remove();
});
it("cancels a pending close when reopened so an old animation cannot close the drawer", async () => {
  const animations: Array<{ cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null }> = [];
  Object.defineProperty(Element.prototype, "animate", { configurable: true, value: vi.fn(() => { const animation = { cancel: vi.fn(), onfinish: null }; animations.push(animation); return animation; }) });
  const close = vi.fn(); const view = render(<SidePanel open label="Messages" onClose={close}>Draft</SidePanel>);
  const dialog = await screen.findByRole("dialog", { name: "Messages" });
  view.rerender(<SidePanel open={false} label="Messages" onClose={close}>Draft</SidePanel>); const closing = animations.at(-1)!;
  view.rerender(<SidePanel open label="Messages" onClose={close}>Draft</SidePanel>);
  expect(closing.cancel).toHaveBeenCalled();
  act(() => closing.onfinish?.());
  expect(dialog.getAttribute("open")).not.toBeNull();
});
it("respects reduced motion and routes backdrop/cancel requests through the caller's save guard", async () => {
  const animate = vi.fn<(frames: Keyframe[], options: KeyframeAnimationOptions) => { cancel: ReturnType<typeof vi.fn>; onfinish: null }>().mockReturnValue({ cancel: vi.fn(), onfinish: null });
  Object.defineProperty(Element.prototype, "animate", { configurable: true, value: animate });
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
  const close = vi.fn(); render(<SidePanel open label="Tasks" onClose={close}>Assigned work</SidePanel>);
  const dialog = await screen.findByRole("dialog", { name: "Tasks" });
  await waitFor(() => expect(animate).toHaveBeenCalled()); expect(animate.mock.calls[0][1].duration).toBe(0);
  fireEvent(dialog, new Event("cancel", { cancelable: true })); expect(close).toHaveBeenCalledOnce(); expect(dialog.getAttribute("open")).not.toBeNull();
});
