import { describe, expect, it } from "vitest";
import { companyProfileSchema, readCompanyProfile } from "@/core/setup/company-profile";
import { assertPrintableAccent, documentBrandFrom, printableLogo } from "@/core/documents/company-brand";

describe("company brand", () => {
  it("keeps invoice terms when the registered profile is saved again", () => {
    const current = readCompanyProfile({ legalName: "Northbridge Group Ltd", terms: "Title passes on payment.", accentColour: "#112233", paymentDetails: "Account 12345678" });
    const saved = companyProfileSchema.parse({ ...current, legalName: "Northbridge Limited", timezone: "Europe/London", country: "GB", defaultCurrency: "GBP", fiscalYearStartMonth: 4, locale: "en-GB" });
    expect(saved.legalName).toBe("Northbridge Limited");
    expect(saved.terms).toBe("Title passes on payment.");
    expect(saved.accentColour).toBe("#112233");
    expect(saved.paymentDetails).toBe("Account 12345678");
  });

  it("uses the trading name and refuses a colour that disappears on white paper", () => {
    const brand = documentBrandFrom({ name: "Workspace name", companyProfile: { tradingName: "Mill Co", legalName: "Mill Co Ltd", documentFooter: "Mill Co Ltd · Leeds" } });
    expect(brand.displayName).toBe("Mill Co");
    expect(brand.footer).toBe("Mill Co Ltd · Leeds");
    expect(brand.accent).toEqual([29 / 255, 29 / 255, 31 / 255]);
    expect(() => assertPrintableAccent("#ffffff")).toThrow(/darker brand colour/);
    expect(assertPrintableAccent("#0B3D2E")).toBe("#0b3d2e");
  });

  it("prints PNG and JPG logos and leaves other formats in the workspace", () => {
    const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    expect(printableLogo(png)?.type).toBe("png");
    expect(printableLogo("data:image/webp;base64,UklGRgAAAABXRUJQVlA4")).toBeNull();
    expect(printableLogo("not-a-logo")).toBeNull();
  });
});
