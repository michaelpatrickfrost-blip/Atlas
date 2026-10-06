// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";

// Record the real server-action calls the menu makes.
const archiveCustomerFormAction = vi.fn().mockResolvedValue(undefined);
const unarchiveCustomerFormAction = vi.fn().mockResolvedValue(undefined);
const deleteCustomerFormAction = vi.fn().mockResolvedValue(undefined);

vi.mock("@/app/(app)/customers/[partyId]/actions", () => ({
  archiveCustomerFormAction: (...args: unknown[]) => archiveCustomerFormAction(...args),
  unarchiveCustomerFormAction: (...args: unknown[]) => unarchiveCustomerFormAction(...args),
  deleteCustomerFormAction: (...args: unknown[]) => deleteCustomerFormAction(...args),
}));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

import { CustomerRecordActions } from "@/app/(app)/customers/[partyId]/record-actions";

const PARTY_ID = "party_123";

async function mount(archived = false) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <CustomerRecordActions partyId={PARTY_ID} customerName="Northbridge Construction Ltd" archived={archived} />,
    );
  });
  return { container, root };
}

async function openMenuAndChoose(container: HTMLElement, label: string) {
  const manage = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("Manage Record"))!;
  expect(manage, "Manage Record button").toBeTruthy();
  await act(async () => {
    manage.click();
  });

  const item = [...document.querySelectorAll('[role="menuitem"]')].find((n) => n.textContent?.trim() === label) as HTMLElement;
  expect(item, `menu item "${label}"`).toBeTruthy();
  await act(async () => {
    item.click();
  });
}

async function confirmDialog(container: HTMLElement, label: string) {
  // The dialog is portalled to document.body (outside `container`).
  const dialog = [...document.querySelectorAll("dialog")].find((d) => d.hasAttribute("open"))!;
  expect(dialog, "an open dialog").toBeTruthy();
  const confirm = [...dialog.querySelectorAll("button")].find((b) => b.textContent?.trim() === label)!;
  expect(confirm, `confirm button "${label}"`).toBeTruthy();
  await act(async () => {
    confirm.click();
  });
  return dialog;
}

describe("CustomerRecordActions — archive / unarchive / delete", () => {
  let mounted: { container: HTMLDivElement; root: Root };

  beforeEach(() => {
    archiveCustomerFormAction.mockClear();
    unarchiveCustomerFormAction.mockClear();
    deleteCustomerFormAction.mockClear();
    refresh.mockClear();
    // jsdom has no real HTMLDialogElement modal support.
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  });

  afterEach(() => {
    act(() => mounted?.root.unmount());
    mounted?.container.remove();
    vi.restoreAllMocks();
  });

  it("archives the record when Archive Customer is confirmed", async () => {
    mounted = await mount(false);
    await openMenuAndChoose(mounted.container, "Archive Customer");
    await confirmDialog(mounted.container, "Archive");

    expect(archiveCustomerFormAction).toHaveBeenCalledTimes(1);
    expect(archiveCustomerFormAction).toHaveBeenCalledWith(PARTY_ID);
  });

  it("unarchives the record when Unarchive Customer is confirmed", async () => {
    mounted = await mount(true);
    await openMenuAndChoose(mounted.container, "Unarchive Customer");
    await confirmDialog(mounted.container, "Restore");

    expect(unarchiveCustomerFormAction).toHaveBeenCalledTimes(1);
    expect(unarchiveCustomerFormAction).toHaveBeenCalledWith(PARTY_ID);
  });

  it("deletes the record when Delete Customer is confirmed", async () => {
    mounted = await mount(false);
    await openMenuAndChoose(mounted.container, "Delete Customer");
    await confirmDialog(mounted.container, "Delete");

    expect(deleteCustomerFormAction).toHaveBeenCalledTimes(1);
    expect(deleteCustomerFormAction).toHaveBeenCalledWith(PARTY_ID);
  });

  it("reports a failure instead of silently doing nothing", async () => {
    deleteCustomerFormAction.mockRejectedValueOnce(new Error("Account has been marked as CLOSED instead."));
    mounted = await mount(false);
    await openMenuAndChoose(mounted.container, "Delete Customer");

    const dialog = await confirmDialog(mounted.container, "Delete");

    // The dialog must stay open and show the reason.
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(dialog.textContent).toContain("marked as CLOSED");
  });
});
