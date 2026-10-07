import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  session: { userId: "user", organisationId: "org-a", capabilities: new Set(["core.pricing.read", "core.pricing.manage"]) },
  enabled: vi.fn(), resolve: vi.fn(),
  db: { priceList: { findFirstOrThrow: vi.fn(), create: vi.fn(), update: vi.fn() }, priceListEntry: { createMany: vi.fn(), findFirstOrThrow: vi.fn(), findFirst: vi.fn(), update: vi.fn(), upsert: vi.fn() }, productCategory: { findFirstOrThrow: vi.fn() }, product: { findMany: vi.fn(), findFirstOrThrow: vi.fn() }, party: { findFirstOrThrow: vi.fn(), count: vi.fn() }, customerCommercialSettings: { upsert: vi.fn() }, auditEntry: { create: vi.fn() }, $transaction: vi.fn() },
}));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => mock.session }));
vi.mock("@/core/db/client", () => ({ db: mock.db }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: mock.enabled }));
vi.mock("@/core/pricing/resolve-price", () => ({ resolvePrice: mock.resolve }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
import { assignPriceListCustomers, checkSalesPrice, createPriceList, savePriceEntry, updatePriceBasis } from "@/app/(app)/pricing/actions";
const form = (values: Record<string, string>) => { const f = new FormData(); for (const [key, value] of Object.entries(values)) f.set(key, value); return f; };
beforeEach(() => {
  vi.resetAllMocks(); mock.session.capabilities = new Set(["core.pricing.read", "core.pricing.manage"]);
  mock.db.$transaction.mockImplementation(async fn => fn(mock.db));
  mock.db.priceList.create.mockResolvedValue({ id: "created" });
  mock.db.priceList.findFirstOrThrow.mockResolvedValue({ id: "source", currency: "GBP", baseCurrency: "GBP", exchangeRate: 1, entries: [], _count: { entries: 0, customerDefaults: 0, agreements: 0 } });
});
describe("sales pricing workspace", () => {
  it("loads catalogue prices with the chosen discount and company/currency/category scope", async () => {
    mock.db.product.findMany.mockResolvedValue([{ id: "p1", basePriceAmount: 1234 }]);
    await expect(createPriceList(form({ name: "Trade", currency: "GBP", startMode: "catalogue", catalogueDiscount: "12.5", categoryCode: "TOOLS" }))).rejects.toThrow("REDIRECT:/sales/price-lists/created");
    expect(mock.db.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organisationId: "org-a", active: true, baseCurrency: "GBP", categoryCode: "TOOLS" } }));
    expect(mock.db.priceListEntry.createMany).toHaveBeenCalledWith({ data: [expect.objectContaining({ priceListId: "created", productId: "p1", unitPriceAmount: 1234, percentage: 12.5 })] });
    expect(mock.db.auditEntry.create).toHaveBeenCalled();
  });
  it("refuses to copy across currencies before creating a list", async () => {
    await expect(createPriceList(form({ name: "Export", currency: "EUR", startMode: "copy", sourceListId: "foreign" }))).rejects.toThrow("same currency");
    expect(mock.db.priceList.findFirstOrThrow).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "foreign", organisationId: "org-a" } }));
    expect(mock.db.priceList.create).not.toHaveBeenCalled();
  });
  it("copies quantity, validity, active state and advanced rules without assignments", async () => {
    const entry = { id: "old", priceListId: "source", productId: null, categoryCode: "TOOLS", scope: "CATEGORY", method: "PERCENT", minimumQuantity: 10, unitPriceAmount: 0, percentage: 8, adjustmentAmount: 0, priority: 5, validFrom: new Date("2026-01-01"), validTo: null, active: false };
    mock.db.priceList.findFirstOrThrow.mockResolvedValue({ currency: "GBP", baseCurrency: "EUR", exchangeRate: 0.85, entries: [entry] });
    await expect(createPriceList(form({ name: "Copy", currency: "GBP", startMode: "copy", sourceListId: "source" }))).rejects.toThrow("REDIRECT");
    expect(mock.db.priceListEntry.createMany).toHaveBeenCalledWith({ data: [expect.objectContaining({ priceListId: "created", minimumQuantity: 10, percentage: 8, priority: 5, active: false, validFrom: entry.validFrom })] });
    expect(mock.db.customerCommercialSettings.upsert).not.toHaveBeenCalled();
  });
  it("rejects a mixed-company customer selection before assignments", async () => {
    mock.db.party.count.mockResolvedValue(1);
    const f = new FormData(); f.append("partyIds", "ours"); f.append("partyIds", "foreign");
    await expect(assignPriceListCustomers("list", f)).rejects.toThrow("unavailable");
    expect(mock.db.party.count).toHaveBeenCalledWith({ where: { id: { in: ["ours", "foreign"] }, organisationId: "org-a", archived: false, identityScrubbed: false } });
    expect(mock.db.customerCommercialSettings.upsert).not.toHaveBeenCalled();
  });
  it("assigns deduplicated customers and audit within one transaction", async () => {
    mock.db.party.count.mockResolvedValue(1); const f = new FormData(); f.append("partyIds", "ours"); f.append("partyIds", "ours");
    await assignPriceListCustomers("list", f);
    expect(mock.db.customerCommercialSettings.upsert).toHaveBeenCalledTimes(1);
    expect(mock.db.auditEntry.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organisationId: "org-a", action: "pricelist.customers.assigned" }) }));
  });
  it("blocks currency reinterpretation on populated lists", async () => {
    mock.db.priceList.findFirstOrThrow.mockResolvedValue({ currency: "GBP", _count: { entries: 1 } });
    await expect(updatePriceBasis("list", form({ currency: "EUR", baseCurrency: "GBP", exchangeRate: "1.2" }))).rejects.toThrow("Create a new list");
    expect(mock.db.priceList.update).not.toHaveBeenCalled();
  });
  it("updates the original row when editing a quantity break", async () => {
    mock.db.priceListEntry.update.mockResolvedValue({ id: "entry" }); mock.db.priceListEntry.findFirst.mockResolvedValue(null);
    await savePriceEntry("list", form({ entryId: "entry", productId: "p1", quantity: "20", price: "12.34", discount: "5" }));
    expect(mock.db.priceListEntry.findFirstOrThrow).toHaveBeenCalledWith({ where: { id: "entry", priceListId: "list", scope: "PRODUCT", method: "FIXED" } });
    expect(mock.db.priceListEntry.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "entry" }, data: expect.objectContaining({ minimumQuantity: 20, unitPriceAmount: 1234, percentage: 5 }) }));
    expect(mock.db.priceListEntry.upsert).not.toHaveBeenCalled();
  });
  it("does not overwrite another break when an edit collides", async () => {
    mock.db.priceListEntry.findFirst.mockResolvedValue({ id: "other" });
    await expect(savePriceEntry("list", form({ entryId: "entry", productId: "p1", quantity: "20", price: "12" }))).rejects.toThrow("already has a price");
    expect(mock.db.priceListEntry.update).not.toHaveBeenCalled();
  });
  it("checks the actual Sales resolver without writing records", async () => {
    mock.resolve.mockResolvedValue({ unitPriceAmount: 1234, discountPercent: 10, currency: "GBP", source: "Contract", validUntil: null });
    expect(await checkSalesPrice("list", form({ partyId: "ours", productId: "p1", quantity: "20", asOf: "2026-10-07", mode: "auto" }))).toMatchObject({ netUnitAmount: 1111, source: "Contract" });
    expect(mock.resolve).toHaveBeenCalledWith({ organisationId: "org-a", partyId: "ours", productId: "p1", quantity: 20, asOf: new Date("2026-10-07") });
    expect(mock.db.$transaction).not.toHaveBeenCalled();
  });
  it("requires manage capability before creating or assigning", async () => {
    mock.session.capabilities = new Set(["core.pricing.read"]);
    await expect(createPriceList(form({ name: "Trade", currency: "GBP" }))).rejects.toThrow("FORBIDDEN");
    await expect(assignPriceListCustomers("list", form({ partyIds: "ours" }))).rejects.toThrow("FORBIDDEN");
    expect(mock.db.$transaction).not.toHaveBeenCalled();
  });
});
