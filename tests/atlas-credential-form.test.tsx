// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/app/(app)/atlas/account-forms", () => ({ CodeReady: ({ code }: { code: string }) => <p role="status">Setup code: {code}</p> }));
import { CredentialForm } from "@/app/(app)/atlas/credential-form";
afterEach(cleanup);
const fields = <><label>Full name<input name="name" /></label><label>Administrator password<input name="currentPassword" type="password" /></label></>;
it("preserves employee details after validation failure and allows a corrected retry", async () => {
  const save = vi.fn().mockResolvedValueOnce({ error: "Your administrator password was not recognised." }).mockResolvedValueOnce({ code: "one-time-code", expiresAt: "2026-10-08T18:00:00Z" });
  render(<CredentialForm action={save} label="Create staff access">{fields}</CredentialForm>);
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "New Employee" } });
  fireEvent.change(screen.getByLabelText("Administrator password"), { target: { value: "wrong" } });
  fireEvent.submit(screen.getByRole("button", { name: "Create staff access" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("password was not recognised"));
  expect((screen.getByLabelText("Full name") as HTMLInputElement).value).toBe("New Employee");
  await screen.findByRole("button", { name: "Create staff access" });
  fireEvent.change(screen.getByLabelText("Administrator password"), { target: { value: "correct" } });
  fireEvent.submit(screen.getByRole("button", { name: "Create staff access" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("one-time-code"));
  expect((save.mock.calls[1][0] as FormData).get("name")).toBe("New Employee");
  expect((save.mock.calls[1][0] as FormData).get("currentPassword")).toBe("correct");
});
it("keeps unexpected server details private while retaining the entered draft", async () => {
  const save = vi.fn().mockRejectedValue(new Error("private database details"));
  render(<CredentialForm action={save} label="Create staff access">{fields}</CredentialForm>);
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "New Employee" } });
  fireEvent.submit(screen.getByRole("button", { name: "Create staff access" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Try again"));
  expect(screen.getByRole("alert").textContent).not.toContain("private database");
  expect((screen.getByLabelText("Full name") as HTMLInputElement).value).toBe("New Employee");
});
