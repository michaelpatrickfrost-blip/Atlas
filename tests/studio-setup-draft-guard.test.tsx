// @vitest-environment jsdom
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { SetupDraftGuard } from "@/app/(studio)/design-studio/setup/draft-guard";

afterEach(cleanup);
const editor = <label>Display name<input defaultValue="Delivery detail"/></label>;
const controls = <><button>Review saved draft</button><button>Go live</button><button>Restore live version</button></>;
it("keeps publication/restore tied to the saved draft while visible edits are unsaved", () => {
  const rendered = render(<SetupDraftGuard key="revision-1" editor={editor} controls={controls}/>);
  expect(screen.getByRole("button", { name: "Go live" }).closest("fieldset")?.disabled).toBe(false);
  fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Our new detail" } });
  expect(screen.getByLabelText("Display name")).toHaveProperty("value", "Our new detail");
  for (const name of ["Review saved draft", "Go live", "Restore live version"])
    expect(screen.getByRole("button", { name }).closest("fieldset")?.disabled).toBe(true);
  expect(screen.getByRole("status").textContent).toContain("Save your changes");
  // A server render at the same saved revision (including failed CAS/review)
  // cannot clear dirty state. A successfully saved new revision can.
  rendered.rerender(<SetupDraftGuard key="revision-1" editor={editor} controls={controls}/>);
  expect(screen.getByRole("button", { name: "Go live" }).closest("fieldset")?.disabled).toBe(true);
  rendered.rerender(<SetupDraftGuard key="revision-2" editor={editor} controls={controls}/>);
  expect(screen.getByRole("button", { name: "Go live" }).closest("fieldset")?.disabled).toBe(false);
});
