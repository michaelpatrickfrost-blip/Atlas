// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { ChatDock } from "@/app/(app)/chat/chat-dock";
vi.mock("next/navigation", () => ({ usePathname: () => "/home" }));
const conversations = ["Blair", "Casey"].map((name) => ({
  id: name.toLowerCase(),
  title: name,
  kind: "DIRECT",
  peerId: name.toLowerCase(),
  peerIds: [name.toLowerCase()],
  peopleCount: 2,
  preview: "Hello",
  at: null,
  unread: 0,
  participants: [
    { id: "me", name: "Ada", type: "user", mine: true },
    { id: name.toLowerCase(), name, type: "user", mine: false },
  ],
}));
const snapshot = {
  me: "me",
  canWrite: true,
  projectsReady: true,
  unread: 0,
  people: [],
  contacts: [],
  notices: [],
  conversations,
  thread: [],
  history: { hasOlder: false, oldestId: null, query: "", before: "" },
};
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  Element.prototype.scrollTo = vi.fn();
  fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => ({ value: snapshot }),
  }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("Modern chat composer", () => {
  it("keeps separate drafts and restores them when switching conversations", async () => {
    render(<ChatDock variant="page" />);
    fireEvent.click(await screen.findByRole("button", { name: /Blair/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "For Blair" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Casey/ }));
    expect(
      (screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement)
        .value,
    ).toBe("");
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "For Casey" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Blair/ }));
    expect(
      (screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement)
        .value,
    ).toBe("For Blair");
  });
  it("prevents duplicate send while pending and preserves the draft after a failed send", async () => {
    let fail!: (response: unknown) => void;
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) =>
      JSON.parse(String(init.body)).op === "send"
        ? new Promise((resolve) => {
            fail = resolve;
          })
        : { ok: true, json: async () => ({ value: snapshot }) },
    );
    render(<ChatDock variant="page" />);
    fireEvent.click(await screen.findByRole("button", { name: /Blair/ }));
    const message = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(message, { target: { value: "Keep this draft" } });
    fireEvent.keyDown(message, { key: "Enter" });
    fireEvent.keyDown(message, { key: "Enter" });
    expect(
      fetchMock.mock.calls.filter(
        ([, init]) => JSON.parse(String(init.body)).op === "send",
      ),
    ).toHaveLength(1);
    await act(async () => {
      fail({
        ok: false,
        json: async () => ({ error: "Connection interrupted" }),
      });
    });
    expect((message as HTMLTextAreaElement).value).toBe("Keep this draft");
    expect(screen.getByRole("alert").textContent).toContain(
      "Connection interrupted",
    );
  });
  it("opens a dialog and preserves its current draft when closed and reopened", async () => {
    render(<ChatDock />);
    fireEvent.click(screen.getByRole("button", { name: "Open messages" }));
    expect(
      screen
        .getByRole("dialog", { name: "Messages" })
        .getAttribute("aria-modal"),
    ).toBe("true");
    fireEvent.click(await screen.findByRole("button", { name: /Blair/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "Still here" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Close messages" }));
    fireEvent.click(screen.getByRole("button", { name: "Open messages" }));
    expect(
      (screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement)
        .value,
    ).toBe("Still here");
  });
});
