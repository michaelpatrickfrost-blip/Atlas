// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ActionForm } from "@/components/ui/action-form";
afterEach(cleanup);

const fields = <><label>Queue name<input name="name" defaultValue="Original queue" /></label><label>Investigation<textarea name="note" /></label></>;
it("preserves the entered draft when saving is rejected", async () => {
  const save = vi.fn().mockRejectedValue(new Error("Queue changed. Refresh before saving."));
  render(<ActionForm action={save} label="Save queue">{fields}</ActionForm>);
  expect(screen.getByRole("button", { name: "Save queue" }).closest("form")?.method).toBe("post");
  fireEvent.change(screen.getByLabelText("Queue name"), { target: { value: "Draft queue" } });
  fireEvent.change(screen.getByLabelText("Investigation"), { target: { value: "Unsaved investigation" } });
  fireEvent.submit(screen.getByRole("button", { name: "Save queue" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Queue changed"));
  expect((screen.getByLabelText("Queue name") as HTMLInputElement).value).toBe("Draft queue");
  expect((screen.getByLabelText("Investigation") as HTMLTextAreaElement).value).toBe("Unsaved investigation");
  const data = save.mock.calls[0][0] as FormData;
  expect(data.get("name")).toBe("Draft queue");
  expect(data.get("note")).toBe("Unsaved investigation");
});

it("keeps the draft pending and resets to defaults only after a successful save", async () => {
  let complete!: () => void;
  const save = vi.fn(() => new Promise<void>(resolve => { complete = resolve; }));
  render(<ActionForm action={save} label="Save queue">{fields}</ActionForm>);
  fireEvent.change(screen.getByLabelText("Queue name"), { target: { value: "Draft queue" } });
  fireEvent.change(screen.getByLabelText("Investigation"), { target: { value: "Unsaved investigation" } });
  fireEvent.submit(screen.getByRole("button", { name: "Save queue" }).closest("form")!);
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect((screen.getByLabelText("Queue name") as HTMLInputElement).value).toBe("Draft queue");
  expect(screen.getByRole("button", { name: "Saving…" }).closest("fieldset")?.disabled).toBe(true);
  await act(async () => complete());
  await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Saved."));
  expect((screen.getByLabelText("Queue name") as HTMLInputElement).value).toBe("Original queue");
  expect((screen.getByLabelText("Investigation") as HTMLTextAreaElement).value).toBe("");
});

it("submits the activated button's name and value", async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(<ActionForm action={save}><input name="name" defaultValue="Queue" /><button type="submit" name="intent" value="preview">Preview</button></ActionForm>);
  fireEvent.click(screen.getByRole("button", { name: "Preview" }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect((save.mock.calls[0][0] as FormData).get("intent")).toBe("preview");
});
