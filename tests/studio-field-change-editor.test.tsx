// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FieldChangeEditor, type FieldChangeEditorProps } from "@/components/studio/field-change-editor";
import { fieldChangeConversion, fieldChangeChoices } from "@/components/studio/field-change-model";
import { additionalFieldTypeCatalogue } from "@/core/studio/authoring/field-setup-contract";
import type { AdditionalFieldMigrationSetup } from "@/core/studio/authoring/field-migration-contract";
afterEach(cleanup);
const initial: AdditionalFieldMigrationSetup = { definitionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", definitionRevision: 2,
  draftRevision: 3, sourceVersionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", sourceChoiceLabels: [], targetChoiceSourceIndexes: [],
  source: { kind: "editable", initial: { label: "Capacity", help: "Team capacity", type: "integer", settings: { min: 0, max: 10 } } },
  target: { kind: "editable", initial: { label: "Capacity", help: "Team capacity", type: "integer", settings: { min: 0, max: 10 } } } };
function mount(options: Partial<FieldChangeEditorProps> = {}) {
  const callbacks = { save: vi.fn<FieldChangeEditorProps["callbacks"]["save"]>(async () => ({ ...initial, draftRevision: 4 })), preview: vi.fn<FieldChangeEditorProps["callbacks"]["preview"]>(async () => ({ definitionId: initial.definitionId,
    definitionRevision: 2, draftRevision: 4, sourceVersionId: initial.sourceVersionId, fieldLabel: "Capacity", affectedCount: 34, countsScope: "this_page" as const,
    pageCounts: { valid: 1, invalid: 0, lossy: 0 }, examples: [{ label: "Record 1", before: { type: "integer" as const, value: 0 }, after: { type: "integer" as const, value: 0 },
      beforeDisplay: "0", afterDisplay: "0", result: "ready" as const, issue: null }], nextCursor: "next_page", impact: { index: [], uniquenessCheck: false, rollbackLimit: "reverse_review_after_target_writes" as const },
    notice: "Preview only. Collect and seal the complete review before publishing." as const })) };
  render(<FieldChangeEditor initial={initial} fieldTypes={additionalFieldTypeCatalogue} referenceTargets={[]} canPreview callbacks={callbacks} {...options}/>);
  return callbacks;
}
describe("friendly published field change editor", () => {
  it("preserves entered values on failed save and requires saved settings before preview", async () => {
    const callbacks = mount(); callbacks.save.mockRejectedValueOnce(new Error("CONFLICT"));
    fireEvent.change(screen.getByLabelText("Largest value"), { target: { value: "20" } });
    expect((screen.getByRole("button", { name: "Preview saved change" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Save new settings" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Your entries are still here"));
    expect((screen.getByLabelText("Largest value") as HTMLInputElement).value).toBe("20"); expect(callbacks.preview).not.toHaveBeenCalled();
    expect(callbacks.save.mock.calls[0][0]).toMatchObject({ revision: 3, definitionRevision: 2, sourceVersionId: initial.sourceVersionId,
      conversion: { kind: "same_type" }, setup: { type: "integer", settings: { min: 0, max: 20 } } });
  });
  it("shows bounded labelled before/after pages without claiming sealed totals and clears them after editing", async () => {
    const callbacks = mount(); fireEvent.change(screen.getByLabelText("Largest value"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "Save new settings" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Preview saved change" }).hasAttribute("disabled")).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Preview saved change" }));
    await waitFor(() => expect(screen.getByRole("region", { name: "Field change preview" })).toBeTruthy());
    expect(screen.getByText(/34 records are in scope/)).toBeTruthy(); expect(screen.getByText(/They are not the complete review/)).toBeTruthy();
    expect(screen.getAllByText("0")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Next examples" }));
    await waitFor(() => expect(callbacks.preview).toHaveBeenCalledTimes(2));
    expect(callbacks.preview.mock.calls[1][0]).toMatchObject({ cursor: "next_page", limit: 25, draftRevision: 4 });
    await waitFor(() => expect(screen.getByRole("region", { name: "Field change preview" })).toBeTruthy());
    fireEvent.change(screen.getByLabelText("Smallest value"), { target: { value: "1" } });
    expect(screen.queryByRole("region", { name: "Field change preview" })).toBeNull();
  });
  it("rejects a different returned saved identity and retains input, hiding preview when current access lacks publication", async () => {
    const callbacks = { save: vi.fn<FieldChangeEditorProps["callbacks"]["save"]>(async () => ({ ...initial, definitionId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", draftRevision: 4 })), preview: vi.fn() };
    mount({ callbacks, canPreview: false }); fireEvent.change(screen.getByLabelText("Largest value"), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Save new settings" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Reopen"));
    expect((screen.getByLabelText("Largest value") as HTMLInputElement).value).toBe("30"); expect(screen.queryByRole("button", { name: "Preview saved change" })).toBeNull();
  });
  it("limits types to implemented conversions and shows unsupported metadata without editable settings", () => {
    mount(); const values = [...(screen.getByLabelText("What kind of detail?") as HTMLSelectElement).options].map(option => option.value);
    expect(values).toEqual(["integer", "decimal"]); cleanup();
    mount({ initial: { ...initial, target: { kind: "read_only", reason: "Keep the existing conditional field workflow." } } });
    expect(screen.getByText("Keep the existing conditional field workflow.")).toBeTruthy(); expect(screen.queryByRole("button", { name: "Save new settings" })).toBeNull();
  });
  it("uses explicit previous-choice ordinals and validates UTC/loss/text mapping choices without accepting raw IDs or arbitrary conversion", () => {
    const form = new FormData(); form.append("previousChoice", "1"); form.append("previousChoice", "new");
    expect(fieldChangeChoices("enum", { label: "Choice", help: "", type: "enum", settings: { choices: ["Rename", "New"] } }, form)).toEqual([1, null]);
    expect(fieldChangeConversion("date", "datetime", form)).toEqual({ kind: "date_to_datetime", timezone: "UTC", time: "start_of_day" });
    expect(fieldChangeConversion("datetime", "date", form)).toMatchObject({ loss: "reject" }); form.set("conversion.allowTimeLoss", "on");
    expect(fieldChangeConversion("datetime", "date", form)).toMatchObject({ loss: "allow_time_loss" });
    form.append("conversion.from", "Existing exact text"); form.append("conversion.to", "0");
    expect(fieldChangeConversion("string", "enum", form)).toMatchObject({ mapping: [{ from: "Existing exact text", toChoice: 0 }], unmapped: "reject" });
    expect(() => fieldChangeConversion("money", "integer", form)).toThrow("approved conversion");
    form.set("previousChoice", "raw-option-id"); expect(() => fieldChangeChoices("enum", { label: "Choice", help: "", type: "enum", settings: { choices: ["Rename"] } }, form)).toThrow("previous choice");
  });
});
