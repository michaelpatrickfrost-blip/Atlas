import { describe, expect, it } from "vitest";
import { crmPushAllowed, financeNeedsManagerSignOff, rangesOverlap, readManagerPolicy, serviceNeedsManagerSignOff } from "@/core/permissions/manager-level";

const off = readManagerPolicy({});

describe("manager level", () => {
  it("stays off until a company turns an app on", () => {
    expect(off.crm).toBe(false);
    expect(off.financeLimitMinor).toBe(1_000_000);
    expect(crmPushAllowed(off, new Set(["sales.opportunity.manage"]))).toBe(true);
    expect(financeNeedsManagerSignOff(off, { gross: 9_000_000n, currency: "GBP", companyCurrency: "GBP" })).toBe(false);
    expect(serviceNeedsManagerSignOff(off, { complaint: true, linkedGross: 0, foreign: false })).toBe(false);
  });

  it("lets a sales manager push prospects and keeps a salesperson on their own book", () => {
    const policy = readManagerPolicy({ crm: true });
    expect(crmPushAllowed(policy, new Set(["sales.pipeline.manage"]))).toBe(true);
    expect(crmPushAllowed(policy, new Set(["sales.prospect.manage"]))).toBe(false);
  });

  it("asks a finance manager to sign off a high value and another currency", () => {
    const policy = readManagerPolicy({ finance: true, financeLimitMinor: 1_000_000 });
    expect(financeNeedsManagerSignOff(policy, { gross: 999_999n, currency: "GBP", companyCurrency: "GBP" })).toBe(false);
    expect(financeNeedsManagerSignOff(policy, { gross: 1_000_000n, currency: "GBP", companyCurrency: "GBP" })).toBe(true);
    expect(financeNeedsManagerSignOff(policy, { gross: 100n, currency: "EUR", companyCurrency: "GBP" })).toBe(true);
  });

  it("asks a service manager to sign off complaints and high-value queries", () => {
    const policy = readManagerPolicy({ service: true, serviceLimitMinor: 500_000 });
    expect(serviceNeedsManagerSignOff(policy, { complaint: true, linkedGross: 0, foreign: false })).toBe(true);
    expect(serviceNeedsManagerSignOff(policy, { complaint: false, linkedGross: 499_999, foreign: false })).toBe(false);
    expect(serviceNeedsManagerSignOff(policy, { complaint: false, linkedGross: 500_000, foreign: false })).toBe(true);
    expect(serviceNeedsManagerSignOff(policy, { complaint: false, linkedGross: 0, foreign: true })).toBe(true);
    expect(serviceNeedsManagerSignOff(policy, { complaint: false, linkedGross: 0, foreign: false })).toBe(false);
  });

  it("treats touching approval bands as an overlap", () => {
    expect(rangesOverlap(0n, 100n, 100n, null)).toBe(true);
    expect(rangesOverlap(0n, 99n, 100n, null)).toBe(false);
  });
});
