// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ check: vi.fn() }));
vi.mock("@/app/(app)/pricing/actions", () => ({ checkSalesPrice: mock.check }));
import { PriceChecker } from "@/app/(app)/pricing/price-checker";
afterEach(cleanup);
it("keeps quantity, date and explicit list selection tied to the returned result", async () => {
  mock.check.mockResolvedValue({ unitPriceAmount: 3000, discountPercent: 4, netUnitAmount: 2880, currency: "GBP", source: "Trade list", validUntil: null, quantity: 25 });
  render(<PriceChecker listId="list" customers={[{ id: "customer", name: "Test", customerCode: "C1" }]} products={[{ id: "product", code: "P1", name: "Product" }]} today="2026-10-07" />);
  fireEvent.change(screen.getByPlaceholderText("Search customer name or account code"), { target: { value: "C1 · Test" } });
  fireEvent.focus(screen.getByRole("combobox", { name: "Search products" }));
  fireEvent.click(screen.getByRole("option", { name: /P1/ }));
  fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "25" } });
  fireEvent.change(screen.getByLabelText("Pricing date"), { target: { value: "2026-11-01" } });
  fireEvent.change(screen.getByLabelText("Price-list selection"), { target: { value: "list" } });
  fireEvent.submit(screen.getByRole("button", { name: "Check price" }).closest("form")!);
  await waitFor(() => expect(screen.getByText("Trade list")).toBeTruthy());
  const submitted = mock.check.mock.calls[0][1] as FormData;
  expect(submitted.get("quantity")).toBe("25");
  expect(submitted.get("mode")).toBe("list");
  expect(submitted.get("asOf")).toBe("2026-11-01");
  expect((screen.getByLabelText("Quantity") as HTMLInputElement).value).toBe("25");
  expect((screen.getByLabelText("Pricing date") as HTMLInputElement).value).toBe("2026-11-01");
  expect((screen.getByLabelText("Price-list selection") as HTMLSelectElement).value).toBe("list");
  fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "26" } });
  expect(screen.queryByText("Trade list")).toBeNull();
});
