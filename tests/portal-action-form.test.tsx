// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
import { PortalActionForm } from "@/app/(admin)/atlas/portal-action-form";
afterEach(cleanup);

const fields = <><label>Company name<input name="name" defaultValue="Original company" /></label><label>Plan name<input name="planName" defaultValue="Original plan" /></label></>;
it("keeps all Atlas account drafts after a rejected save", async () => {
  const save = vi.fn().mockRejectedValue(new Error("Enter valid account details."));
  render(<PortalActionForm action={save} label="Save account">{fields}</PortalActionForm>);
  fireEvent.change(screen.getByLabelText("Company name"), { target: { value: "  " } });
  fireEvent.change(screen.getByLabelText("Plan name"), { target: { value: "Unsaved plan" } });
  fireEvent.click(screen.getByRole("button", { name: "Save account" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Enter valid account details."));
  expect((screen.getByLabelText("Company name") as HTMLInputElement).value).toBe("  ");
  expect((screen.getByLabelText("Plan name") as HTMLInputElement).value).toBe("Unsaved plan");
  expect(save).toHaveBeenCalledTimes(1);
});

it("disables the entire Atlas form until a successful save, then resets", async () => {
  let complete!: () => void;
  const save = vi.fn(() => new Promise<void>(resolve => { complete = resolve; }));
  render(<PortalActionForm action={save} label="Save account">{fields}</PortalActionForm>);
  fireEvent.change(screen.getByLabelText("Plan name"), { target: { value: "Unsaved plan" } });
  fireEvent.click(screen.getByRole("button", { name: "Save account" }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("button", { name: "Saving…" }).closest("fieldset")?.disabled).toBe(true);
  expect((screen.getByLabelText("Plan name") as HTMLInputElement).value).toBe("Unsaved plan");
  await act(async () => complete());
  await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Saved."));
  expect((screen.getByLabelText("Plan name") as HTMLInputElement).value).toBe("Original plan");
});

it("preserves an older Atlas tab draft and explains manual recovery without replay", async () => {
  const save = vi.fn().mockRejectedValue(Object.assign(new Error('Server Action "private-id" was not found on the server.'), { name: "UnrecognizedActionError" }));
  render(<PortalActionForm action={save} label="Save account">{fields}</PortalActionForm>);
  fireEvent.change(screen.getByLabelText("Plan name"), { target: { value: "Unsaved plan" } });
  fireEvent.click(screen.getByRole("button", { name: "Save account" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Copy your unsaved changes"));
  expect(screen.getByRole("alert").textContent).not.toContain("private-id");
  expect((screen.getByLabelText("Plan name") as HTMLInputElement).value).toBe("Unsaved plan");
  expect(save).toHaveBeenCalledTimes(1);
});

it("navigates after a successful deletion without a server redirect", async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(<PortalActionForm action={save} label="Delete permanently" successPath="/atlas">{fields}</PortalActionForm>);
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/atlas"));
  expect(save).toHaveBeenCalledTimes(1);
});
