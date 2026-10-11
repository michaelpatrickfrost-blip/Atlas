// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { AccessEditor } from "@/components/admin/access-editor";
afterEach(cleanup);
const groups = [
  {
    id: "sales",
    name: "Sales",
    capabilities: [
      "sales.order.read",
      "sales.order.create",
      "sales.order.confirm",
      "sales.quote.read",
      "sales.quote.create",
      "sales.quote.approve",
    ],
  },
];
describe("custom section editor", () => {
  it("reviews inherited and personal access without losing hidden selections during filtering", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(
      <AccessEditor
        groups={groups}
        capabilities={["sales.order.read", "sales.quote.approve"]}
        membershipId="member"
        roles={[
          {
            id: "r",
            name: "Reader",
            capabilities: ["sales.order.read", "sales.order.create"],
          },
        ]}
        roleIds={["r"]}
        action={action}
        blockedCapabilities={["sales.quote.approve"]}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Personal exceptions" }),
    );
    expect(screen.getByText("Removed for this user")).toBeTruthy();
    expect(screen.getByText("Extra access")).toBeTruthy();
    expect(screen.getByText("Blocked by company")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Review access" }),
    );
    expect(
      screen.getByRole("region", { name: "Access review" }).textContent,
    ).toContain("Approve (blocked by company)");
    fireEvent.click(
      screen.getByRole("button", { name: "Save user access" }),
    );
    await waitFor(() => expect(action).toHaveBeenCalled());
    expect((action.mock.calls[0][0] as FormData).getAll("capability")).toEqual([
      "sales.order.read",
      "sales.quote.approve",
    ]);
  });
  it("builds a mixed section profile and posts the complete selection with its snapshot", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(
      <AccessEditor
        groups={groups}
        capabilities={[]}
        roleId="r"
        profileName="Team"
        accessRevision="snapshot"
        action={action}
      />,
    );
    fireEvent.click(
      within(
        screen.getByRole("group", { name: "Order access level" }),
      ).getByRole("button", { name: "Write" }),
    );
    fireEvent.click(
      within(
        screen.getByRole("group", { name: "Quote access level" }),
      ).getByRole("button", { name: "Read" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(action).toHaveBeenCalled());
    const f = action.mock.calls[0][0] as FormData;
    expect(f.getAll("capability")).toEqual([
      "sales.order.read",
      "sales.order.create",
      "sales.quote.read",
    ]);
    expect(f.get("accessRevision")).toBe("snapshot");
    expect(f.get("profileName")).toBe("Team");
  });
  it("preserves a failed draft and can reset it to saved permissions", async () => {
    const action = vi.fn().mockRejectedValue(new Error("Profile changed"));
    render(
      <AccessEditor
        groups={groups}
        capabilities={["sales.order.read"]}
        roleId="r"
        action={action}
      />,
    );
    fireEvent.click(
      within(
        screen.getByRole("group", { name: "Order access level" }),
      ).getByRole("button", { name: "Admin" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("alert").textContent).toContain("Profile changed");
    expect(
      within(screen.getByRole("group", { name: "Order access level" }))
        .getByRole("button", { name: "Admin" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(
      within(screen.getByRole("group", { name: "Order access level" }))
        .getByRole("button", { name: "Read" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
});
