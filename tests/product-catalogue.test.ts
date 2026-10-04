import { describe, expect, it } from "vitest";
import { categoryParentOk, cleanCategoryCode, categoryClass, productClassChoice } from "@/core/products/categories";
import { assertProductLinks, packContainsLoops } from "@/core/products/links";
import { releasedAssignment } from "@/modules/manufacturing/domain/plant";

describe("product categories", () => {
  it("rejects a category placed inside itself", () => {
    const rows = [{ id: "finished", parentId: null }, { id: "ware", parentId: "finished" }];
    expect(categoryParentOk(rows, "finished", "ware")).toBe(false);
    expect(categoryParentOk(rows, "ware", "finished")).toBe(true);
    expect(categoryParentOk(rows, null, "finished")).toBe(true);
    expect(categoryParentOk(rows, "ware", "missing")).toBe(false);
  });

  it("keeps a category code that price rules can match", () => {
    expect(cleanCategoryCode(" Bodies ")).toBe("Bodies");
    expect(categoryClass("WIP")).toBe("WIP");
    expect(() => cleanCategoryCode("")).toThrow(/code/);
    expect(() => categoryClass("CLAY")).toThrow(/class/);
  });

  it("lets a product keep its own class, or take the category's", () => {
    expect(productClassChoice("WIP", "FINISHED")).toBe("WIP");
    expect(productClassChoice("", "RAW")).toBe("RAW");
    expect(productClassChoice("  ", null)).toBe("OTHER");
    expect(() => productClassChoice("CLAY", "FINISHED")).toThrow(/class/);
  });
});

describe("packs and products a product needs", () => {
  it("keeps a box of one product separate from a product it needs", () => {
    expect(() => assertProductLinks("box", [
      { relatedProductId: "tile", kind: "CONTAINS", quantity: 12 },
      { relatedProductId: "tile", kind: "REQUIRES", quantity: 1 },
    ])).not.toThrow();
    expect(() => assertProductLinks("box", [{ relatedProductId: "box", kind: "CONTAINS", quantity: 12 }])).toThrow(/itself/);
    expect(() => assertProductLinks("box", [
      { relatedProductId: "tile", kind: "CONTAINS", quantity: 12 },
      { relatedProductId: "tile", kind: "CONTAINS", quantity: 6 },
    ])).toThrow(/once/);
  });

  it("rejects a pack that contains itself through another pack", () => {
    const existing = [{ productId: "inner", relatedProductId: "outer" }];
    expect(packContainsLoops("outer", ["inner"], existing)).toBe(true);
    expect(packContainsLoops("outer", ["tile"], existing)).toBe(false);
  });
});

describe("a product step releases onto the plant", () => {
  const centres = new Map([["forming", "centre-1"]]);

  it("uses the machine on the recipe rather than a typed name", () => {
    expect(releasedAssignment({ workCentreId: "centre-9", resourceId: "press-2", workCentre: "Forming" }, centres)).toEqual({ workCentreId: "centre-9", resourceId: "press-2" });
  });

  it("still matches an older step that only typed the work centre name", () => {
    expect(releasedAssignment({ workCentreId: null, resourceId: null, workCentre: "Forming" }, centres)).toEqual({ workCentreId: "centre-1", resourceId: null });
  });
});
