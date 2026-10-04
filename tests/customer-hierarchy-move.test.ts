import { describe, expect, it } from "vitest";
import { nextHierarchyParent, orderedSiblings, reportsInCircle, reportingDescendantIds } from "@/core/customers/hierarchy";

const accounts = [
  { id: "group", name: "Northbridge", parentPartyId: null, hierarchyRole: "GROUP" },
  { id: "dalton", name: "Dalton Logistics", parentPartyId: "group", hierarchyRole: "CUSTOMER" },
  { id: "bristol", name: "Dalton Bristol", parentPartyId: "dalton", hierarchyRole: "BRANCH" },
  { id: "manchester", name: "Dalton Manchester", parentPartyId: "dalton", hierarchyRole: "BRANCH" },
];

describe("customer map moves", () => {
  it("draws branches under a business in name order", () => {
    expect(orderedSiblings(accounts, "dalton").map((account) => account.id)).toEqual(["bristol", "manchester"]);
  });

  it("moves a branch up to the group", () => {
    expect(nextHierarchyParent(accounts, "bristol", "up")).toBe("group");
  });

  it("moves the business up to independent", () => {
    expect(nextHierarchyParent(accounts, "dalton", "up")).toBeNull();
  });

  it("does not move a group further up", () => {
    expect(nextHierarchyParent(accounts, "group", "up")).toBeUndefined();
  });

  it("nests the lower branch under the one above it", () => {
    expect(nextHierarchyParent(accounts, "manchester", "down")).toBe("bristol");
  });

  it("does not move the first branch down", () => {
    expect(nextHierarchyParent(accounts, "bristol", "down")).toBeUndefined();
  });

  it("refuses a reporting circle", () => {
    const people = [
      { id: "alex", reportsToContactId: null },
      { id: "sam", reportsToContactId: "alex" },
      { id: "jo", reportsToContactId: "sam" },
    ];
    expect(reportsInCircle(people, "alex", "jo")).toBe(true);
    expect(reportsInCircle(people, "jo", "alex")).toBe(false);
    expect(reportingDescendantIds(people, "alex")).toEqual(expect.arrayContaining(["alex", "sam", "jo"]));
  });
});
