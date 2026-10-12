// @vitest-environment jsdom
import { fireEvent, render, screen, cleanup, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
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

const setupForm = <form><input type="hidden" name="kind" value="customField"/><input type="hidden" name="definitionId" value="60000000-0000-4000-8000-000000000001"/>
  <input type="hidden" name="revision" value="3"/><label>Display name<input name="label" defaultValue="Delivery detail"/></label><textarea name="help" defaultValue=""/></form>;
const savedComparison = { revision: 4, definitionRevision: 7, warnings: [], savedSummary: [{ label: "Display name", value: "Saved delivery detail" }],
  localSummary: [{ label: "Display name", value: "Our unsaved detail" }], changes: ["Display name is different in your changes."] };
it("checks current unsaved values continuously without calling save or saved review", async () => {
  const inspect = vi.fn(async (data: FormData) => ({ revision: Number(data.get("revision")), definitionRevision: Number(data.get("definitionRevision")), warnings: [] }));
  render(<SetupDraftGuard editor={setupForm} controls={controls} definitionRevision={7} inspect={inspect}/>);
  fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Our unsaved detail" } });
  await waitFor(() => expect(screen.getByRole("region", { name: "Setup draft check" }).textContent).toContain("Draft checks passed"));
  expect(inspect.mock.calls[0][0].get("label")).toBe("Our unsaved detail");
  expect(screen.getByRole("button", { name: "Go live" }).closest("fieldset")?.disabled).toBe(true);
});
it("keeps input and original baseline on Back; explicit Keep adopts only the observed saved revision", async () => {
  const compare = vi.fn(async () => savedComparison);
  const rendered = render(<SetupDraftGuard editor={setupForm} controls={controls} definitionRevision={7} compare={compare}/>);
  fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Our unsaved detail" } });
  fireEvent.click(screen.getByRole("button", { name: "Compare saved draft" }));
  await screen.findByRole("dialog", { name: "Compare business setup" });
  expect(screen.getByRole("region", { name: "Saved draft" }).textContent).toContain("Saved delivery detail");
  expect(screen.getByRole("region", { name: "Your changes" }).textContent).toContain("Our unsaved detail");
  fireEvent.click(screen.getByRole("button", { name: "Back to editing" }));
  expect(rendered.container.querySelector<HTMLInputElement>('input[name="revision"]')?.value).toBe("3");
  expect(screen.getByLabelText("Display name")).toHaveProperty("value", "Our unsaved detail");
  fireEvent.click(screen.getByRole("button", { name: "Compare saved draft" })); await screen.findByRole("dialog");
  fireEvent.click(screen.getByRole("button", { name: "Keep my changes" }));
  expect(rendered.container.querySelector<HTMLInputElement>('input[name="revision"]')?.value).toBe("4");
  expect(screen.getByLabelText("Display name")).toHaveProperty("value", "Our unsaved detail");
  expect(screen.getByRole("button", { name: "Go live" }).closest("fieldset")?.disabled).toBe(true);
});
it("ignores a comparison response after another local edit", async () => {
  let complete!: (value: typeof savedComparison) => void;
  const compare = vi.fn(() => new Promise<typeof savedComparison>(resolve => { complete = resolve; }));
  render(<SetupDraftGuard editor={setupForm} controls={controls} definitionRevision={7} compare={compare}/>);
  fireEvent.click(screen.getByRole("button", { name: "Compare saved draft" }));
  fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "A newer local edit" } });
  complete(savedComparison); await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.getByLabelText("Display name")).toHaveProperty("value", "A newer local edit");
});

it("renders intentional server validation feedback returned in production without clearing unsaved details", async () => {
  render(<SetupDraftGuard editor={setupForm} controls={controls} definitionRevision={7}
    inspect={async () => ({ error: "The value exceeds the maximum." })} compare={async () => ({ error: "CONFLICT: compare the saved draft before trying again." })}/>);
  fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Our unsaved detail" } });
  await waitFor(() => expect(screen.getByRole("region", { name: "Setup draft check" }).textContent).toContain("The value exceeds the maximum."));
  fireEvent.click(screen.getByRole("button", { name: "Compare saved draft" }));
  await waitFor(() => expect(screen.getByRole("region", { name: "Setup draft check" }).textContent).toContain("Someone else saved this setup."));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByLabelText("Display name")).toHaveProperty("value", "Our unsaved detail");
  expect(screen.getByRole("button", { name: "Go live" }).closest("fieldset")?.disabled).toBe(true);
});
