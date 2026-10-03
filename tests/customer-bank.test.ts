import { describe, expect, it } from "vitest";
import { maskSortCode, maskAccountNumber, maskIban, maskBankAccount } from "@/core/customers/bank";

describe("bank detail masking", () => {
  it("masks a sort code to only the last two digits", () => {
    expect(maskSortCode("200000")).toBe("••-••-00");
  });

  it("masks an account number to only the last four digits", () => {
    expect(maskAccountNumber("41530424")).toBe("••••0424");
  });

  it("masks an IBAN to its first four and last four characters", () => {
    expect(maskIban("GB29NWBK60161331926819")).toBe("GB29 •••• 6819");
  });

  it("passes through null fields untouched", () => {
    expect(maskSortCode(null)).toBeNull();
    expect(maskAccountNumber(null)).toBeNull();
  });

  it("maskBankAccount masks every sensitive field at once and leaves the rest alone", () => {
    const masked = maskBankAccount({
      id: "acc_1",
      bankName: "Barclays",
      sortCode: "200000",
      accountNumber: "41530424",
      iban: null,
    });
    expect(masked).toEqual({
      id: "acc_1",
      bankName: "Barclays",
      sortCode: "••-••-00",
      accountNumber: "••••0424",
      iban: null,
    });
  });
});
