import { describe, expect, it } from "vitest";
import { normalizeTaxNumber, isPlausibleUkVatFormat } from "@/core/customers/tax";

describe("normalizeTaxNumber", () => {
  it("strips whitespace and uppercases so formatting differences still match", () => {
    expect(normalizeTaxNumber("gb 123 4567 89")).toBe("GB123456789");
    expect(normalizeTaxNumber("GB123456789")).toBe("GB123456789");
  });
});

describe("isPlausibleUkVatFormat", () => {
  it("accepts a 9-digit number with or without the GB prefix", () => {
    expect(isPlausibleUkVatFormat("123456789")).toBe(true);
    expect(isPlausibleUkVatFormat("GB123456789")).toBe(true);
    expect(isPlausibleUkVatFormat("GB 123 4567 89")).toBe(true);
  });

  it("rejects an implausible shape — format validation only, never verification", () => {
    expect(isPlausibleUkVatFormat("not-a-vat-number")).toBe(false);
    expect(isPlausibleUkVatFormat("12345")).toBe(false);
  });
});
