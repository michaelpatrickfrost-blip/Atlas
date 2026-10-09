// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
vi.mock("@/app/(app)/customers/[partyId]/actions", () => ({
  createNoteFormAction: vi.fn(),
}));
import { AccountNotes } from "@/components/customers/account-notes";
afterEach(cleanup);
const notes = [
  {
    id: "public",
    body: "Public account context",
    pinned: false,
    restricted: false,
    createdAt: new Date("2026-10-09"),
  },
  {
    id: "private",
    body: "Private account context",
    pinned: true,
    restricted: true,
    createdAt: new Date("2026-10-09"),
  },
];
it("keeps restricted note text out of the rendered account when read permission is absent", () => {
  render(
    <AccountNotes
      partyId="account"
      notes={notes}
      session={
        {
          capabilities: new Set(["customers.restricted_notes.manage"]),
        } as Session
      }
    />,
  );
  expect(screen.getByText("Public account context")).toBeTruthy();
  expect(screen.queryByText("Private account context")).toBeNull();
  expect(
    (screen.getByLabelText("Restricted") as HTMLInputElement).checked,
  ).toBe(true);
});
it("allows separate restricted-note read without exposing a write form", () => {
  render(
    <AccountNotes
      partyId="account"
      notes={notes}
      session={
        {
          capabilities: new Set(["customers.restricted_notes.read"]),
        } as Session
      }
    />,
  );
  expect(screen.getByText("Private account context")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Save note" })).toBeNull();
});
