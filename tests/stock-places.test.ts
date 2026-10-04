import { describe, expect, it } from "vitest";
import { moveTiming, placeCode, placeKind, placeLabel, starterLocations } from "@/modules/stock/domain/places";

describe("sites, yards and locations", () => {
  it("treats a yard and a warehouse as places, and rejects anything else", () => {
    expect(placeKind("yard")).toBe("YARD");
    expect(placeKind("WAREHOUSE")).toBe("WAREHOUSE");
    expect(() => placeKind("store")).toThrow("warehouse or a yard");
  });
  it("gives a yard one yard location and a warehouse the working locations", () => {
    expect(starterLocations("YARD").map((row) => row.code)).toEqual(["YARD"]);
    expect(starterLocations("WAREHOUSE").map((row) => row.code)).toContain("STOCK");
    expect(starterLocations("WAREHOUSE").map((row) => row.code)).not.toContain("YARD");
  });
  it("moves inside a site now, and between sites in transit", () => {
    expect(moveTiming("north", "north")).toBe("now");
    expect(moveTiming(null, "south")).toBe("now");
    expect(moveTiming("north", "south")).toBe("transit");
  });
  it("labels a place with its site and kind", () => {
    expect(placeLabel({ code: "YD", name: "North yard", kind: "YARD", siteName: "North" })).toBe("North · Yard YD · North yard");
    expect(placeCode(" bay 4 ")).toBe("BAY-4");
  });
});
