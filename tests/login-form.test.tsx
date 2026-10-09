// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const login = vi.hoisted(() => vi.fn());
vi.mock("@/core/auth/actions", () => ({ loginAction: login }));
import { LoginForm } from "@/app/(auth)/login/login-form";
afterEach(cleanup);

it("retains sign-in entries after rejection and submits a corrected retry", async () => {
  login.mockResolvedValue({ error: "Incorrect email or password." });
  render(<LoginForm portal="atlas" recoveryHref="/test-recovery" />);
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "staff@example.test" } });
  fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "first-password" } });
  fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Incorrect email or password."));
  expect((screen.getByLabelText("Email address") as HTMLInputElement).value).toBe("staff@example.test");
  expect((screen.getByLabelText("Password", { exact: true }) as HTMLInputElement).value).toBe("first-password");
  fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "corrected-password" } });
  fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form")!);
  await waitFor(() => expect(login).toHaveBeenCalledTimes(2));
  expect((login.mock.calls[1][0] as FormData).get("email")).toBe("staff@example.test");
  expect((login.mock.calls[1][0] as FormData).get("password")).toBe("corrected-password");
  expect((login.mock.calls[1][0] as FormData).get("portal")).toBe("atlas");
});
