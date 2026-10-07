import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { postLedger } from "@/modules/finance/services/ledger";
const { validate } = vi.hoisted(() => ({ validate: vi.fn() }));
vi.mock("@/modules/finance/services/posting-validation", () => ({ validatePostingLines: validate }));
const session = { organisationId: "org", userId: "poster", capabilities: new Set() } as Session;
const tx = {
  financeEntity: { findFirstOrThrow: vi.fn() }, financePeriod: { findMany: vi.fn() },
  financeAccount: { findMany: vi.fn() }, financeJournal: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  auditEntry: { create: vi.fn() }, domainOutbox: { create: vi.fn() },
};
const input = { entityId: "books", date: new Date("2026-10-07T00:00:00Z"), description: "Supplier invoice", sourceKey: "invoice:1", sourceType: "AP_INVOICE", sourceId: "invoice", currency: "EUR", rate: "0.86", lines: [{ accountId: "expense", description: "Cost", debit: 1000000n, credit: 0n }, { accountId: "ap", description: "Bill", debit: 0n, credit: 1000000n }] };
const call = (change = {}) => postLedger(tx as unknown as Prisma.TransactionClient, session, { ...input, ...change });
beforeEach(() => {
  vi.resetAllMocks(); validate.mockResolvedValue(undefined);
  tx.financeEntity.findFirstOrThrow.mockResolvedValue({ id: "books", currency: "GBP" });
  tx.financePeriod.findMany.mockResolvedValue([{ id: "period", state: "OPEN", allowedSources: [] }]);
  tx.financeJournal.findFirst.mockResolvedValue(null);
  tx.financeJournal.create.mockImplementation(async ({ data }) => ({ id: "journal", ...data }));
  tx.financeJournal.update.mockResolvedValue({ id: "journal", reference: "JE-1", status: "POSTED" });
  tx.financeAccount.findMany.mockResolvedValue([{ id: "rounding", control: "ROUNDING" }]);
});
describe("Controlled ledger posting", () => {
  it("retains rate, dates, source key and exact base/transaction values", async () => {
    const result = await call();
    expect(result.status).toBe("POSTED");
    expect(tx.financeJournal.create).toHaveBeenCalledWith({ data: expect.objectContaining({ organisationId: "org", exchangeRate: "0.86", accountingDate: input.date, documentDate: input.date, taxDate: input.date, sourceKey: "invoice:1", postingFingerprint: expect.any(String), lines: { create: [expect.objectContaining({ debit: 860000n, transactionDebit: 1000000n }), expect.objectContaining({ credit: 860000n, transactionCredit: 1000000n })] } }) });
    expect(tx.auditEntry.create).toHaveBeenCalledOnce(); expect(tx.domainOutbox.create).toHaveBeenCalledOnce();
  });
  it("rejects an unbalanced source before creating any journal", async () => {
    await expect(call({ lines: [{ accountId: "a", description: "Cost", debit: 10n, credit: 0n }, { accountId: "b", description: "Bill", debit: 0n, credit: 9n }] })).rejects.toThrow("balance");
    expect(tx.financeJournal.create).not.toHaveBeenCalled();
  });
  it.each([[], [{ id: "p1", state: "OPEN" }, { id: "p2", state: "OPEN" }], [{ id: "p1", state: "CLOSED", allowedSources: ["AP_INVOICE"] }]].map(periods => ({ periods })))("requires exactly one permitted period: %j", async ({ periods }) => {
    tx.financePeriod.findMany.mockResolvedValue(periods); await expect(call()).rejects.toThrow("permitted open period"); expect(tx.financeJournal.create).not.toHaveBeenCalled();
  });
  it("checks the current account structure before any posting", async () => {
    validate.mockRejectedValue(new Error("department is required")); await expect(call()).rejects.toThrow("department is required"); expect(tx.financeJournal.create).not.toHaveBeenCalled();
  });
  it("replays the identical source even after its period closes", async () => {
    await call(); const fingerprint = tx.financeJournal.create.mock.calls[0][0].data.postingFingerprint;
    tx.financeJournal.findFirst.mockResolvedValue({ id: "journal", status: "POSTED", entityId: "books", sourceType: "AP_INVOICE", sourceId: "invoice", currency: "EUR", postingFingerprint: fingerprint });
    tx.financePeriod.findMany.mockReset(); tx.financeJournal.create.mockClear();
    expect((await call()).id).toBe("journal"); expect(tx.financePeriod.findMany).not.toHaveBeenCalled(); expect(tx.financeJournal.create).not.toHaveBeenCalled();
  });
  it("rejects reuse of the idempotency key for altered amounts", async () => {
    await call(); const fingerprint = tx.financeJournal.create.mock.calls[0][0].data.postingFingerprint;
    tx.financeJournal.findFirst.mockResolvedValue({ status: "POSTED", entityId: "books", sourceType: "AP_INVOICE", sourceId: "invoice", currency: "EUR", postingFingerprint: fingerprint });
    tx.financeJournal.create.mockClear(); await expect(call({ rate: "0.87" })).rejects.toThrow("different transaction"); expect(tx.financeJournal.create).not.toHaveBeenCalled();
  });
  it("creates an explicit configured FX rounding line", async () => {
    await call({ rate: "0.5", lines: [{ accountId: "expense", description: "A", debit: 1n, credit: 0n }, { accountId: "expense", description: "B", debit: 1n, credit: 0n }, { accountId: "ap", description: "Bill", debit: 0n, credit: 2n }] });
    const lines = tx.financeJournal.create.mock.calls[0][0].data.lines.create;
    expect(lines[3]).toEqual({ accountId: "rounding", description: "Exchange translation rounding", debit: 0n, credit: 1n, transactionDebit: 0n, transactionCredit: 0n });
    expect(validate).toHaveBeenCalledTimes(2);
  });
  it("fails rather than hiding FX rounding when its profile is absent", async () => {
    tx.financeAccount.findMany.mockResolvedValue([]);
    await expect(call({ rate: "0.5", lines: [{ accountId: "expense", description: "A", debit: 1n, credit: 0n }, { accountId: "expense", description: "B", debit: 1n, credit: 0n }, { accountId: "ap", description: "Bill", debit: 0n, credit: 2n }] })).rejects.toThrow("ROUNDING");
    expect(tx.financeJournal.create).not.toHaveBeenCalled();
  });
});
