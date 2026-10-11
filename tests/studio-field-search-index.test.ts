import { expect, it } from "vitest";
import { assertFieldSearchIndex } from "../scripts/studio/field-search-index";
const name = "studio_field_fingerprint_idx";
const index = { name, method: "btree", valid: true, ready: true, live: true, immediate: true, plain: true,
  complete: true, defaultKeys: true, keyCount: 4, attributeCount: 4, columns: ["organisationId", "definitionId", "generationId", "fingerprint"] };
it("accepts exact typed-index catalogue independently of a competing physical plan", () => expect(assertFieldSearchIndex([index], name)).toEqual(index));
it.each(["valid", "ready", "live", "immediate", "plain", "complete", "defaultKeys"])("rejects unusable or alternate semantics: %s", flag => {
  expect(() => assertFieldSearchIndex([{ ...index, [flag]: false }], name)).toThrow();
});
it("rejects missing, duplicated, differently named, differently ordered or different scalar indexes", () => {
  for (const rows of [[], [index, index], [{ ...index, name: "other" }], [{ ...index, columns: ["definitionId", "organisationId", "generationId", "fingerprint"] }],
    [{ ...index, columns: ["organisationId", "definitionId", "generationId", "instantValue"] }], [{ ...index, keyCount: 3 }]])
    expect(() => assertFieldSearchIndex(rows, name)).toThrow();
});
