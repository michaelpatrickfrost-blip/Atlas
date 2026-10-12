// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { FieldMigrationControls, type FieldMigrationControlsProps } from "@/components/studio/field-migration-controls";
import type { AdditionalFieldMigrationStatus } from "@/core/studio/authoring/field-migration-control-contract";
// Actual client component/contracts with explicit server collaborators. These
// DOM cases do not prove authentication, SQL/CAS atomicity, browser layout or live.
afterEach(cleanup);
const uuid = (n: number) => `82000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const scope = { definitionId: uuid(4), preparationId: uuid(3) }, hash = "a".repeat(64), cutoverHash = "b".repeat(64), settledHash = "c".repeat(64);
function status(stage: "preparing" | "reviewed" | "published" | "running" | "failed" | "ready" | "activated" | "cancelled" | "finalized" = "preparing"): AdditionalFieldMigrationStatus {
  const publication = ["published", "running", "failed", "ready", "activated", "cancelled", "finalized"].includes(stage), executed = ["running", "failed", "ready", "activated", "finalized"].includes(stage), activated = stage === "activated" || stage === "finalized";
  return { ...scope, preparationState: stage === "preparing" ? "PREPARING" : "REVIEWED", preparationRevision: stage === "preparing" ? 0 : 2,
    fieldLabel: stage === "cancelled" ? null : "Order amount", review: stage === "preparing" || stage === "cancelled" ? null : { checksum: hash, affectedCount: 3, valid: 3, invalid: 0, lossy: 0 },
    publication: publication ? { state: stage === "cancelled" ? "CANCELLED" : stage === "activated" ? "CUTOVER" : stage === "finalized" ? "COMPLETED" : "PUBLISHED", revision: stage === "cancelled" || stage === "activated" ? 1 : stage === "finalized" ? 2 : 0 } : null,
    execution: executed ? { state: stage === "failed" ? "FAILED" : stage === "running" ? "RUNNING" : "READY", revision: stage === "running" ? 0 : 4,
      processedCount: stage === "running" ? 0 : stage === "failed" ? 1 : 3, affectedCount: 3, failureCode: stage === "failed" ? "ACCESS_CHANGED" : null } : null,
    cutover: activated ? { state: stage === "finalized" ? "FINALIZED" : "ACTIVATED", revision: stage === "finalized" ? 1 : 0, checksum: cutoverHash,
      confirmation: { cutoverRevision: 0, definitionRevision: 8, publicationRevision: 1 }, settlementChecksum: stage === "finalized" ? settledHash : null } : null,
    currentHead: stage === "cancelled" ? null : { definitionRevision: activated ? 8 : 7, versionLabel: activated ? "Version 2" : "Version 1" } };
}
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (reason: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function fixture(stage?: Parameters<typeof status>[0]) {
  let current = status(stage), exhausted = false;
  const callbacks = {
    prepare: vi.fn<FieldMigrationControlsProps["callbacks"]["prepare"]>(async input => { current = { ...status(), preparationId: input.operationId }; return { preparationId: input.operationId, revision: 0, state: "PREPARING" }; }),
    collect: vi.fn<FieldMigrationControlsProps["callbacks"]["collect"]>(async input => { current.preparationRevision = input.revision + 1; const complete = exhausted; exhausted = true; return { preparationId: input.preparationId, revision: current.preparationRevision, state: "PREPARING", replayed: false, appended: complete ? 0 : 3, cursorExhausted: complete }; }),
    seal: vi.fn<FieldMigrationControlsProps["callbacks"]["seal"]>(async input => { current = { ...status("reviewed"), preparationRevision: input.revision + 1 }; return { preparationId: input.preparationId, revision: current.preparationRevision, state: "REVIEWED", reviewChecksum: hash, affectedCount: 3, valid: 3, invalid: 0, lossy: 0, indexImpact: ["Existing values keep their previous storage history."], rollbackLimit: "reverse_review_after_target_writes", replayed: false }; }),
    status: vi.fn<FieldMigrationControlsProps["callbacks"]["status"]>(async () => structuredClone(current)),
    recoveryStatus: vi.fn<NonNullable<FieldMigrationControlsProps["callbacks"]["recoveryStatus"]>>(async () => ({
      definitionId: current.definitionId, preparationId: current.preparationId, preparationState: current.preparationState,
      publicationState: current.publication?.state ?? null, publicationRevision: current.publication?.revision ?? null })),
    publish: vi.fn<FieldMigrationControlsProps["callbacks"]["publish"]>(async input => { current = { ...status("published"), preparationRevision: input.revision }; return { preparationId: input.preparationId, state: "PUBLISHED", preparationRevision: input.revision, publicationRevision: 0, reviewChecksum: input.reviewChecksum, replayed: false }; }),
    start: vi.fn<FieldMigrationControlsProps["callbacks"]["start"]>(async input => { current = status("running"); return { preparationId: input.preparationId, state: "RUNNING", revision: 0, processedCount: 0, failureCode: null, replayed: false, appended: 0 }; }),
    execute: vi.fn<FieldMigrationControlsProps["callbacks"]["execute"]>(async input => { current = { ...status("ready"), execution: { ...status("ready").execution!, revision: input.revision + 1 } }; return { preparationId: input.preparationId, state: "READY", revision: input.revision + 1, processedCount: 3, failureCode: null, replayed: false, appended: 3 }; }),
    cutover: vi.fn<FieldMigrationControlsProps["callbacks"]["cutover"]>(async input => { current = { ...status("activated"), execution: { ...status("activated").execution!, revision: input.executionRevision } }; return { preparationId: input.preparationId, state: "ACTIVATED", definitionRevision: input.definitionRevision + 1, publicationRevision: input.publicationRevision + 1, executionRevision: input.executionRevision, reviewChecksum: input.reviewChecksum, replayed: false }; }),
    cancel: vi.fn<FieldMigrationControlsProps["callbacks"]["cancel"]>(async input => { current = status("cancelled"); return { preparationId: input.preparationId, revision: 1, state: "CANCELLED", replayed: false }; }),
    rollback: vi.fn<FieldMigrationControlsProps["callbacks"]["rollback"]>(async input => { current = { ...status("activated"), publication: { state: "ROLLED_BACK", revision: 2 }, cutover: { ...status("activated").cutover!, state: "ROLLED_BACK", revision: 1, settlementChecksum: settledHash }, currentHead: { definitionRevision: 9, versionLabel: "Version 1" } }; return { preparationId: input.preparationId, state: "ROLLED_BACK", settlementChecksum: settledHash, replayed: false }; }),
    finalize: vi.fn<FieldMigrationControlsProps["callbacks"]["finalize"]>(async input => { current = status("finalized"); return { preparationId: input.preparationId, state: "FINALIZED", settlementChecksum: settledHash, replayed: false }; }),
  };
  const input = { operationId: uuid(3), definitionId: scope.definitionId, definitionRevision: 7, draftRevision: 9, sourceVersionId: uuid(6), conversion: { kind: "integer_to_decimal" } };
  const props: FieldMigrationControlsProps = { definitionId: scope.definitionId, initialPreparationId: stage ? scope.preparationId : undefined, disabled: false,
    prepareInput: () => input, onPreparationChange: vi.fn(), callbacks };
  return { props, callbacks, input, setCurrent: (value: AdditionalFieldMigrationStatus) => { current = value; }, ...render(<FieldMigrationControls {...props} />) };
}
const button = (name: string) => screen.getByRole("button", { name }) as HTMLButtonElement;
const click = async (name: string) => { fireEvent.click(button(name)); await waitFor(() => expect(screen.queryByText(/Preparing review…|Refreshing review…|Reviewing next batch…|Checking complete review…|Starting conversion…|Converting next batch…|Applying your confirmation…|Checking recovery options…/)).toBeNull()); };
const refresh = () => click("Refresh review");
it("does not open support or fetch status on mount, and keeps a selected review opaque until explicit refresh", async () => {
  const f = fixture("preparing"); expect(f.callbacks.status).not.toHaveBeenCalled(); expect(f.callbacks.recoveryStatus).not.toHaveBeenCalled(); expect(screen.queryByLabelText("Complete review totals")).toBeNull(); expect(screen.queryByRole("button", { name: "Review next batch" })).toBeNull();
  await refresh(); expect(f.callbacks.status).toHaveBeenCalledTimes(1); expect(f.callbacks.status).toHaveBeenCalledWith(scope); expect(button("Check complete review").disabled).toBe(true);
});
it("preserves the exact operation UUID on an unconfirmed preparation retry, but never shows technical IDs", async () => {
  const f = fixture(); let candidate = 3; f.props.prepareInput = () => ({ ...f.input, operationId: uuid(candidate++) }); f.rerender(<FieldMigrationControls {...f.props}/>);
  f.callbacks.prepare.mockRejectedValueOnce(new Error("network")); await click("Prepare saved change"); expect(screen.getByRole("alert").textContent).toContain("entries are kept");
  await click("Prepare saved change"); expect(f.callbacks.prepare).toHaveBeenCalledTimes(2); expect(f.callbacks.prepare.mock.calls[0][0].operationId).toBe(uuid(3)); expect(f.callbacks.prepare.mock.calls[1][0].operationId).toBe(uuid(3));
  expect(f.props.onPreparationChange).toHaveBeenCalledWith(uuid(3)); expect(document.body.textContent).not.toContain(uuid(3)); expect(document.body.textContent).not.toContain(hash);
});
it("new saved revisions start a fresh preparation identity rather than reusing a failed immutable request", async () => {
  const f = fixture(); f.callbacks.prepare.mockRejectedValueOnce(new Error("network")); await click("Prepare saved change");
  f.props.prepareInput = () => ({ ...f.input, operationId: uuid(7), draftRevision: 10 }); f.rerender(<FieldMigrationControls {...f.props}/>);
  await click("Prepare saved change"); expect(f.callbacks.prepare.mock.calls[1][0]).toMatchObject({ operationId: uuid(7), draftRevision: 10 });
});
it("reviews one bounded batch perclick and requires explicit exhaustion before sealing complete totals", async () => {
  const f = fixture(); await click("Prepare saved change"); expect(button("Check complete review").disabled).toBe(true);
  await click("Review next batch"); expect(f.callbacks.collect).toHaveBeenCalledTimes(1); expect(f.callbacks.collect.mock.calls[0][0]).toMatchObject({ revision: 0, expectedState: "PREPARING", limit: 25 }); expect(button("Check complete review").disabled).toBe(true); expect(f.callbacks.seal).not.toHaveBeenCalled();
  await click("Review next batch"); expect(f.callbacks.collect).toHaveBeenCalledTimes(2); expect(button("Check complete review").disabled).toBe(false);
  await click("Check complete review"); expect(f.callbacks.seal).toHaveBeenCalledWith({ ...scope, revision: 2, expectedState: "PREPARING" }); expect(screen.getByLabelText("Complete review totals").textContent).toContain("Affected records3"); expect(f.callbacks.publish).not.toHaveBeenCalled();
});
it("resumed preparation requires its own bounded collection response before complete-review action", async () => {
  const f = fixture("preparing"); await refresh(); expect(button("Check complete review").disabled).toBe(true); await click("Review next batch"); expect(f.callbacks.collect).toHaveBeenCalledTimes(1); expect(f.callbacks.seal).not.toHaveBeenCalled();
});
it("blocks invalid totals and requires publication notes/loss acknowledgement plus explicit confirmation", async () => {
  const f = fixture("reviewed"); const invalid = status("reviewed"); invalid.review = { ...invalid.review!, invalid: 1, valid: 2 }; f.setCurrent(invalid); await refresh(); expect(screen.getByText(/Correct the invalid values/)).toBeTruthy(); expect(screen.queryByRole("button", { name: "Publish reviewed target" })).toBeNull();
  const loss = status("reviewed"); loss.review = { ...loss.review!, lossy: 1 }; f.setCurrent(loss); await refresh(); expect(button("Publish reviewed target").disabled).toBe(true);
  fireEvent.click(screen.getByLabelText("I have reviewed the saved settings and publication notes.")); expect(button("Publish reviewed target").disabled).toBe(true);
  fireEvent.click(screen.getByLabelText("I accept the information loss shown in this complete review.")); fireEvent.click(button("Publish reviewed target"));
  const dialog = await screen.findByRole("dialog", { name: "Publish this reviewed change?" }); expect(f.callbacks.publish).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole("button", { name: "Publish reviewed change" })); await waitFor(() => expect(f.callbacks.publish).toHaveBeenCalledWith({ ...scope, revision: 2, reviewChecksum: hash, acknowledgeWarnings: true, acknowledgeLoss: true }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull()); expect(f.callbacks.status).toHaveBeenCalledTimes(3); expect(f.callbacks.start).not.toHaveBeenCalled();
});
it("converts only one batch, then makes Go live a separate confirmed fresh-status operation", async () => {
  const f = fixture("published"); await refresh(); await click("Start conversion"); expect(f.callbacks.start).toHaveBeenCalledWith({ ...scope, publicationRevision: 0, reviewChecksum: hash }); expect(f.callbacks.execute).not.toHaveBeenCalled();
  await click("Convert next batch"); expect(f.callbacks.execute).toHaveBeenCalledTimes(1); expect(f.callbacks.execute).toHaveBeenCalledWith({ ...scope, revision: 0, expectedState: "RUNNING", limit: 25 }); expect(f.callbacks.cutover).not.toHaveBeenCalled();
  fireEvent.click(button("Review go live")); const dialog = await screen.findByRole("dialog", { name: "Make this field change live?" }); expect(f.callbacks.cutover).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole("button", { name: "Go live" })); await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(f.callbacks.cutover).toHaveBeenCalledWith({ ...scope, reviewChecksum: hash, definitionRevision: 7, publicationRevision: 0, executionRevision: 1 }); expect(f.callbacks.status).toHaveBeenCalledTimes(4);
  expect(screen.getByText("This reviewed change was made live.")).toBeTruthy(); expect(screen.getByText("Version 2")).toBeTruthy();
});
it("failed execution requires explicit Resume and forwards only its actual revision, never an automatic loop", async () => {
  const f = fixture("failed"); await refresh(); expect(f.callbacks.execute).not.toHaveBeenCalled(); await click("Resume next batch"); expect(f.callbacks.execute).toHaveBeenCalledWith({ ...scope, revision: 4, expectedState: "FAILED", limit: 25 }); expect(f.callbacks.execute).toHaveBeenCalledTimes(1);
});
it("a sparse stopped-publication status removes all protected totals and cannot offer cutover or settlement", async () => {
  const f = fixture("published"); await refresh(); fireEvent.click(button("Stop published change")); const dialog = await screen.findByRole("dialog", { name: "Stop this published change?" }); expect(f.callbacks.cancel).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole("button", { name: "Stop this change" })); await waitFor(() => expect(screen.getByText(/pending change was stopped/)).toBeTruthy());
  expect(f.callbacks.cancel).toHaveBeenCalledWith({ ...scope, revision: 0 }); expect(screen.queryByLabelText("Complete review totals")).toBeNull(); expect(screen.queryByText(/Live field now/)).toBeNull(); expect(screen.queryByRole("button", { name: "Review go live" })).toBeNull();
});
it("Leave this review is local only and preserves inactive history without inventing cancellation", async () => {
  const f = fixture("reviewed"); await refresh(); await click("Leave this review"); expect(f.props.onPreparationChange).toHaveBeenCalledWith(undefined); expect(f.callbacks.cancel).not.toHaveBeenCalled(); expect(screen.getByText(/left this inactive review/)).toBeTruthy(); expect(button("Prepare saved change")).toBeTruthy();
});
it.each(["rollback", "finalize"] as const)("%s uses retained confirmation rather than today's different live pointer, after a distinct modal", async operation => {
  const f = fixture("activated"), historical = status("activated"); historical.currentHead = { definitionRevision: 25, versionLabel: "Version 8" }; f.setCurrent(historical); await refresh();
  expect(screen.getByText("Version 8")).toBeTruthy(); expect(screen.getByText(/separate reverse review/)).toBeTruthy();
  fireEvent.click(button(operation === "rollback" ? "Review restoration" : "Review finish")); const dialog = await screen.findByRole("dialog"); expect(f.callbacks[operation]).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole("button", { name: operation === "rollback" ? "Restore previous field" : "Finish this change" })); await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(f.callbacks[operation]).toHaveBeenCalledWith({ ...scope, cutoverChecksum: cutoverHash, cutoverRevision: 0, definitionRevision: 8, publicationRevision: 1 }); expect(f.callbacks[operation === "rollback" ? "finalize" : "rollback"]).not.toHaveBeenCalled();
});
it("dirty editor clears protected details/confirmation and disables every operation until an explicit clean refresh", async () => {
  const f = fixture("ready"); await refresh(); fireEvent.click(button("Review go live")); expect(screen.getByRole("dialog")).toBeTruthy();
  f.props.disabled = true; f.rerender(<FieldMigrationControls {...f.props}/>); expect(screen.queryByRole("dialog")).toBeNull(); expect(screen.queryByLabelText("Complete review totals")).toBeNull(); expect(button("Refresh review").disabled).toBe(true); expect(f.callbacks.cutover).not.toHaveBeenCalled();
  f.props.disabled = false; f.rerender(<FieldMigrationControls {...f.props}/>); expect(screen.queryByRole("button", { name: "Review go live" })).toBeNull(); expect(f.callbacks.status).toHaveBeenCalledTimes(1); await refresh(); expect(button("Review go live")).toBeTruthy();
});
it.each(["definition", "preparation", "progress", "totals"])("refuses %s response mismatch and clears protected controls", async kind => {
  const f = fixture("ready"), value = status("ready");
  if (kind === "definition") value.definitionId = uuid(99); if (kind === "preparation") value.preparationId = uuid(98); if (kind === "progress") value.execution!.processedCount = 1; if (kind === "totals") value.review!.valid = 2;
  f.callbacks.status.mockResolvedValue(value); await refresh(); expect(screen.getByRole("alert").textContent).toContain("could not be verified"); expect(screen.queryByLabelText("Complete review totals")).toBeNull(); expect(screen.queryByRole("button", { name: "Review go live" })).toBeNull(); expect(document.body.textContent).not.toContain(uuid(99));
});
it("wrong preparation acknowledgement cannot change selected review or start follow-up status", async () => {
  const f = fixture(); f.callbacks.prepare.mockResolvedValue({ preparationId: uuid(99), revision: 0, state: "PREPARING" }); await click("Prepare saved change"); expect(f.props.onPreparationChange).not.toHaveBeenCalled(); expect(f.callbacks.status).not.toHaveBeenCalled(); expect(button("Prepare saved change")).toBeTruthy();
});
it("mutation success followed by stale or denied status clears details rather than displaying a false next stage", async () => {
  const f = fixture("running"); await refresh(); f.callbacks.status.mockRejectedValueOnce(new Error("FORBIDDEN: protected_queue_99")); await click("Convert next batch");
  expect(f.callbacks.execute).toHaveBeenCalledTimes(1); expect(screen.getByRole("alert").textContent).toContain("Protected details have been cleared"); expect(document.body.textContent).not.toContain("protected_queue_99"); expect(screen.queryByLabelText("Complete review totals")).toBeNull(); expect(screen.queryByRole("button", { name: "Review go live" })).toBeNull();
});
it("stale post-mutation status cannot enable go-live even when the conversion acknowledgement succeeded", async () => {
  const f = fixture("running"); await refresh(); f.callbacks.status.mockResolvedValueOnce(status("running")); await click("Convert next batch");
  expect(f.callbacks.execute).toHaveBeenCalledTimes(1); expect(screen.getByRole("alert")).toBeTruthy(); expect(screen.queryByRole("button", { name: "Review go live" })).toBeNull(); expect(f.callbacks.cutover).not.toHaveBeenCalled();
});
it("stale execution acknowledgement does not make an earlier status READY or trigger follow-up actions", async () => {
  const f = fixture("failed"); await refresh(); f.callbacks.execute.mockResolvedValue({ preparationId: scope.preparationId, state: "READY", revision: 3, processedCount: 3, failureCode: null, appended: 0, replayed: true }); await click("Resume next batch");
  expect(screen.getByRole("alert")).toBeTruthy(); expect(f.callbacks.status).toHaveBeenCalledTimes(1); expect(f.callbacks.cutover).not.toHaveBeenCalled();
});
it("ignores async responses after editor changes, and prevents duplicate clicks during an in-flight action", async () => {
  const f = fixture("running"); await refresh(); const response = deferred<Awaited<ReturnType<FieldMigrationControlsProps["callbacks"]["execute"]>>>(); f.callbacks.execute.mockReturnValueOnce(response.promise);
  fireEvent.click(button("Convert next batch")); fireEvent.click(button("Convert next batch")); expect(f.callbacks.execute).toHaveBeenCalledTimes(1);
  f.props.disabled = true; f.rerender(<FieldMigrationControls {...f.props}/>); response.resolve({ preparationId: scope.preparationId, state: "READY", revision: 1, processedCount: 3, failureCode: null, appended: 3, replayed: false });
  await waitFor(() => expect(screen.queryByText("Converting next batch…")).toBeNull()); expect(f.callbacks.status).toHaveBeenCalledTimes(1); expect(screen.queryByLabelText("Complete review totals")).toBeNull(); expect(f.callbacks.cutover).not.toHaveBeenCalled();
});
it("confirmation traps focus, supports Escape, and never invokes recovery when dismissed", async () => {
  const f = fixture("activated"); await refresh(); fireEvent.click(button("Review finish")); const dialog = await screen.findByRole("dialog"), first = within(dialog).getByRole("button", { name: "Keep current state" }), last = within(dialog).getByRole("button", { name: "Finish this change" });
  first.focus(); fireEvent.keyDown(first, { key: "Tab", shiftKey: true }); expect(document.activeElement).toBe(last); fireEvent.keyDown(last, { key: "Tab" }); expect(document.activeElement).toBe(first);
  fireEvent.keyDown(first, { key: "Escape" }); expect(screen.queryByRole("dialog")).toBeNull(); expect(f.callbacks.finalize).not.toHaveBeenCalled(); expect(f.callbacks.rollback).not.toHaveBeenCalled();
});

it("after protected status loss retains only exact last published cancellation identity, no totals/execution/restoration", async () => {
  const f = fixture("running"); await refresh(); f.callbacks.status.mockRejectedValue(new Error("FORBIDDEN: private queue")); await refresh();
  expect(screen.queryByLabelText("Complete review totals")).toBeNull(); expect(screen.queryByText(/Live field now/)).toBeNull();
  expect(screen.queryByRole("button", { name: "Convert next batch" })).toBeNull(); expect(screen.queryByRole("button", { name: "Review restoration" })).toBeNull();
  fireEvent.click(button("Stop published change")); const dialog = await screen.findByRole("dialog"); expect(f.callbacks.cancel).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole("button", { name: "Stop this change" })); await waitFor(() => expect(f.callbacks.cancel).toHaveBeenCalledWith({ ...scope, revision: 0 }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull()); expect(screen.queryByRole("button", { name: "Stop published change" })).toBeNull();
  expect(screen.getByText(/pending change was stopped/)).toBeTruthy(); expect(screen.queryByLabelText("Complete review totals")).toBeNull();
});
it("resumed unknown review requires explicit metadata recovery and never infers publication from a full status error", async () => {
  const f = fixture("published"); f.callbacks.status.mockRejectedValue(new Error("FORBIDDEN")); await refresh();
  expect(f.callbacks.recoveryStatus).not.toHaveBeenCalled(); expect(screen.queryByRole("button", { name: "Stop published change" })).toBeNull();
  await click("Check recovery options"); expect(f.callbacks.recoveryStatus).toHaveBeenCalledTimes(1); expect(f.callbacks.recoveryStatus).toHaveBeenCalledWith(scope);
  expect(button("Stop published change")).toBeTruthy(); expect(screen.queryByLabelText("Complete review totals")).toBeNull(); expect(screen.queryByRole("button", { name: "Start conversion" })).toBeNull();
  expect(document.body.textContent).not.toContain(scope.preparationId); expect(document.body.textContent).not.toContain(hash);
});
it.each(["definition", "preparation", "null_revision", "unreviewed"])("recovery %s mismatch never enables cancellation", async kind => {
  const f = fixture("published"); const value = await f.callbacks.recoveryStatus(scope);
  if (kind === "definition") value.definitionId = uuid(99); if (kind === "preparation") value.preparationId = uuid(99);
  if (kind === "null_revision") value.publicationRevision = null; if (kind === "unreviewed") value.preparationState = "PREPARING";
  f.callbacks.recoveryStatus.mockResolvedValue(value); await click("Check recovery options");
  expect(screen.getByRole("alert")).toBeTruthy(); expect(screen.queryByRole("button", { name: "Stop published change" })).toBeNull(); expect(f.callbacks.cancel).not.toHaveBeenCalled();
});
it("explicit recovery failure clears previous sparse identity while full status failure cannot grant recovery", async () => {
  const f = fixture("published"); await click("Check recovery options"); expect(button("Stop published change")).toBeTruthy();
  f.callbacks.recoveryStatus.mockRejectedValue(new Error("FORBIDDEN: revoked Publish")); await click("Check recovery options");
  expect(screen.queryByRole("button", { name: "Stop published change" })).toBeNull(); expect(f.callbacks.cancel).not.toHaveBeenCalled();
});
it("inactive recovery offers local Leave only and activated history cannot offer cancellation or restoration without full data authority", async () => {
  const f = fixture("reviewed"); await click("Check recovery options"); expect(button("Leave this review")).toBeTruthy(); expect(screen.queryByRole("button", { name: "Stop published change" })).toBeNull();
  await click("Leave this review"); expect(f.callbacks.cancel).not.toHaveBeenCalled(); expect(f.props.onPreparationChange).toHaveBeenCalledWith(undefined);
  cleanup(); const g = fixture("activated"); await click("Check recovery options"); expect(screen.queryByRole("button", { name: "Stop published change" })).toBeNull(); expect(screen.queryByRole("button", { name: "Review restoration" })).toBeNull(); expect(screen.queryByText("Version 2")).toBeNull(); expect(g.callbacks.rollback).not.toHaveBeenCalled();
});
it("verified publish acknowledgement retains sparse cancel option even if immediate detailed status is denied", async () => {
  const f = fixture("reviewed"); await refresh(); fireEvent.click(screen.getByLabelText("I have reviewed the saved settings and publication notes."));
  f.callbacks.status.mockRejectedValueOnce(new Error("FORBIDDEN")); fireEvent.click(button("Publish reviewed target")); const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Publish reviewed change" })); await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(button("Stop published change")).toBeTruthy(); expect(screen.queryByRole("button", { name: "Start conversion" })).toBeNull(); expect(screen.queryByLabelText("Complete review totals")).toBeNull();
});
it("verified Go-live acknowledgement removes old publication cancellation even when detailed status is denied", async () => {
  const f = fixture("ready"); await refresh(); f.callbacks.status.mockRejectedValueOnce(new Error("FORBIDDEN")); fireEvent.click(button("Review go live")); const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Go live" })); await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.queryByRole("button", { name: "Stop published change" })).toBeNull(); expect(screen.queryByRole("button", { name: "Review restoration" })).toBeNull(); expect(f.callbacks.cancel).not.toHaveBeenCalled();
});
it("dirty and changed operation scopes disable or clear sparse recovery without invoking old cancellation", async () => {
  const f = fixture("published"); await click("Check recovery options"); f.props.disabled = true; f.rerender(<FieldMigrationControls {...f.props}/>);
  expect(screen.queryByRole("button", { name: "Stop published change" })).toBeNull(); expect(button("Refresh review").disabled).toBe(true);
  f.props.disabled = false; f.props.initialPreparationId = uuid(99); f.rerender(<FieldMigrationControls {...f.props}/>);
  expect(screen.queryByRole("button", { name: "Stop published change" })).toBeNull(); expect(f.callbacks.cancel).not.toHaveBeenCalled(); expect(f.callbacks.recoveryStatus).toHaveBeenCalledTimes(1);
});
