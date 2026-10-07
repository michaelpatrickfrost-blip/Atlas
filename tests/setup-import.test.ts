import { describe, expect, it } from "vitest";
import { catalogueCoversRequiredColumns } from "@/core/setup/validate";
import { customerImportIssue, parentLoopIssue } from "@/core/setup/validate";
import { readCompanyProfile } from "@/core/setup/company-profile";
import { SETUP_CATALOGUE } from "@/core/setup/catalogue";

describe("company setup catalogue", () => {
  it("gives every template a matching example and its required columns", () => {
    expect(catalogueCoversRequiredColumns()).toBe(true);
    expect(SETUP_CATALOGUE.map((template) => template.id)).toEqual(["customers", "contacts", "customer-commercial", "products", "price-lists", "prices", "warehouses", "locations", "employees", "sales-orders", "sales-quotes"]);
  });

  it("rejects a customer loop and a missing parent, and accepts a parent already in the company", () => {
    const loop = [{ customerCode: "A", name: "A", parentCustomerCode: "B" }, { customerCode: "B", name: "B", parentCustomerCode: "A" }];
    expect(customerImportIssue(loop, new Set())).toMatch(/circular/);
    expect(customerImportIssue([{ customerCode: "C-1", name: "North", parentCustomerCode: "MISSING" }], new Set())).toMatch(/missing/);
    expect(customerImportIssue([{ customerCode: "C-2", name: "Branch", parentCustomerCode: "C-1", hierarchyRole: "BRANCH", currency: "GBP" }], new Set(["C-1"]))).toBeNull();
  });

  it("rejects a location loop inside one warehouse", () => {
    const index = new Map([["A-01", 0], ["A-02", 1]]);
    expect(parentLoopIssue([{ code: "A-01", parent: "A-02" }, { code: "A-02", parent: "A-01" }], new Set(), index)).toMatch(/circular/);
  });

  it("reads an empty company profile as the trading defaults", () => {
    expect(readCompanyProfile({})).toMatchObject({ country: "GB", defaultCurrency: "GBP", fiscalYearStartMonth: 4, timezone: "Europe/London" });
    expect(readCompanyProfile({ legalName: "Northbridge Limited", country: "GB" }).legalName).toBe("Northbridge Limited");
    expect(readCompanyProfile(null).locale).toBe("en-GB");
  });
});
