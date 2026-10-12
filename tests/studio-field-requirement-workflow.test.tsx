// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AdditionalFieldRequirementEvolutionEditor } from "@/core/studio/authoring/field-requirement-input";
import type { FieldMigrationControlsProps } from "@/components/studio/field-migration-controls";
const panel = vi.hoisted(() => ({ props: vi.fn() }));
vi.mock("@/components/studio/field-migration-controls", () => ({ FieldMigrationControls: (props: FieldMigrationControlsProps) => {
  panel.props(props); return <p>Original reviewed workflow</p>;
} }));
import { FieldRequirementWorkflow, type FieldRequirementWorkflowProps } from "@/components/studio/field-requirement-workflow";
afterEach(() => { cleanup(); panel.props.mockClear(); });
const initial: AdditionalFieldRequirementEvolutionEditor = { definitionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", revision: 3,
  definitionRevision: 2, sourceVersionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", initial: { always: false, when: null },
  editable: true, reason: null, choices: [{ id: "native:priority", label: "Priority", type: "enum", operators: ["present", "absent", "equals", "not_equals"], options: [{ value: "URGENT", label: "Urgent" }] }] };
const callbacks = {} as FieldMigrationControlsProps["callbacks"];
it("makes no migration request on mount, blocks dirty review and prepares only the saved actual revisions", async () => {
  const save = vi.fn<FieldRequirementWorkflowProps["save"]>(async () => ({ ...initial, revision: 4, initial: { always: true, when: null } }));
  render(<FieldRequirementWorkflow initial={initial} save={save} migration={{ callbacks }}/>);
  expect(save).not.toHaveBeenCalled(); expect(panel.props.mock.calls.at(-1)![0].callbacks).toBe(callbacks);
  fireEvent.click(screen.getByRole("checkbox", { name: "Always require this detail" }));
  expect(panel.props.mock.calls.at(-1)![0].disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Save rule draft" }));
  await screen.findByText(/Rules saved as a draft/);
  expect(save).toHaveBeenCalledWith({ definitionId: initial.definitionId, revision: 3, definitionRevision: 2,
    sourceVersionId: initial.sourceVersionId, requirement: { always: true, when: null } });
  const controls = panel.props.mock.calls.at(-1)![0] as FieldMigrationControlsProps;
  expect(controls.disabled).toBe(false); expect(controls.prepareInput()).toMatchObject({ definitionId: initial.definitionId,
    definitionRevision: 2, draftRevision: 4, sourceVersionId: initial.sourceVersionId, conversion: { kind: "same_type" } });
});
it("retains friendly choices after a conflict and keeps review disabled", async () => {
  const save = vi.fn<FieldRequirementWorkflowProps["save"]>(async () => { throw new Error("CONFLICT"); });
  render(<FieldRequirementWorkflow initial={initial} save={save} migration={{ callbacks }}/>);
  fireEvent.click(screen.getByRole("checkbox", { name: "Always require this detail" }));
  fireEvent.click(screen.getByRole("button", { name: "Save rule draft" }));
  await screen.findByRole("alert"); expect((screen.getByRole("checkbox", { name: "Always require this detail" }) as HTMLInputElement).checked).toBe(true);
  expect(panel.props.mock.calls.at(-1)![0].disabled).toBe(true);
});
it("keeps an open saved review resumable while its published rules are read-only", async () => {
  const save = vi.fn(), preparationId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  render(<FieldRequirementWorkflow initial={{ ...initial, editable: false, reason: "Finish the open review." }} save={save} migration={{ callbacks, initialPreparationId: preparationId }}/>);
  expect(screen.getByRole("button", { name: "Save rule draft" }).hasAttribute("disabled")).toBe(true);
  await waitFor(() => expect(panel.props.mock.calls.at(-1)![0]).toMatchObject({ initialPreparationId: preparationId, disabled: false }));
  expect(save).not.toHaveBeenCalled(); expect(screen.getByText("Finish the open review.")).toBeTruthy();
});
