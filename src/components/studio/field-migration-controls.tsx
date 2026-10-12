"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { z } from "zod";
import { Check, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as preparation from "@/core/studio/authoring/field-migration-lifecycle-contract";
import * as control from "@/core/studio/authoring/field-migration-control-contract";

type Request<S extends z.ZodType> = z.infer<S>;
export type FieldMigrationControlsProps = {
  definitionId: string; initialPreparationId?: string; disabled: boolean; prepareInput(): unknown;
  reviewNotes?: readonly string[]; onPreparationChange?(id: string | undefined): void;
  callbacks: {
    prepare(input: Request<typeof preparation.prepareAdditionalFieldMigrationSchema>): Promise<preparation.AdditionalFieldMigrationPrepared>;
    collect(input: Request<typeof preparation.collectAdditionalFieldMigrationSchema>): Promise<preparation.AdditionalFieldMigrationCollected>;
    seal(input: Request<typeof preparation.sealAdditionalFieldMigrationSchema>): Promise<preparation.AdditionalFieldMigrationSealed>;
    status(input: Request<typeof control.readAdditionalFieldMigrationStatusSchema>): Promise<control.AdditionalFieldMigrationStatus>;
    recoveryStatus?(input: Request<typeof control.readAdditionalFieldMigrationRecoveryStatusSchema>): Promise<control.AdditionalFieldMigrationRecoveryStatus>;
    publish(input: Request<typeof control.publishAdditionalFieldMigrationSchema>): Promise<control.AdditionalFieldMigrationPublished>;
    start(input: Request<typeof control.startAdditionalFieldMigrationExecutionSchema>): Promise<control.AdditionalFieldMigrationExecuted>;
    execute(input: Request<typeof control.executeAdditionalFieldMigrationBatchSchema>): Promise<control.AdditionalFieldMigrationExecuted>;
    cutover(input: Request<typeof control.cutoverAdditionalFieldMigrationSchema>): Promise<control.AdditionalFieldMigrationCutover>;
    cancel(input: Request<typeof control.cancelAdditionalFieldMigrationSchema>): Promise<control.AdditionalFieldMigrationCancelled>;
    rollback(input: Request<typeof control.settleAdditionalFieldMigrationSchema>): Promise<control.AdditionalFieldMigrationSettled>;
    finalize(input: Request<typeof control.settleAdditionalFieldMigrationSchema>): Promise<control.AdditionalFieldMigrationSettled>;
  };
};
type Confirmation = "publish" | "cutover" | "cancel" | "rollback" | "finalize";
const confirmations = {
  publish: { title: "Publish this reviewed change?", button: "Publish reviewed change", text: "This saves the reviewed new field version. Your live field stays in place while records are converted." },
  cutover: { title: "Make this field change live?", button: "Go live", text: "The completed conversion will become the live field for this business. The server checks the full reviewed records and your current access again." },
  cancel: { title: "Stop this published change?", button: "Stop this change", text: "This closes the pending change before it goes live. The live field and saved review history are kept." },
  rollback: { title: "Restore the previous field?", button: "Restore previous field", text: "Restoration is available only while the reviewed records remain unchanged. New target values require a separate reverse review; this does not convert new values backwards." },
  finalize: { title: "Finish this field change?", button: "Finish this change", text: "This closes the previous-version restoration window. The saved review and conversion history are kept." },
};
function identityFromStatus(input: { definitionId: string; preparationId: string }) { return { definitionId: input.definitionId, preparationId: input.preparationId }; }
function failed(error: unknown) {
  if (error instanceof Error && /REVIEW_CHANGED|CONFLICT|ZodError/.test(`${error.name} ${error.message}`)) return "The saved change moved on or the response could not be verified. Refresh the review before continuing. Your editor entries are kept.";
  if (error instanceof Error && /FORBIDDEN|UNAUTHORI|CAPABILITY|ACCESS_CHANGED|ACCESS_DENIED|RESTRICTED/.test(error.message)) return "Your current access could not verify this review. Protected details have been cleared. Your editor entries are kept.";
  if (error instanceof Error && /NOT_READY|Conditional field changes/.test(error.message)) return "This kind of change is not available in this visual workflow yet. Its existing reviewed workflow is still required.";
  return "The action could not be confirmed. Refresh the review before continuing, or retry an unconfirmed preparation. Your editor entries are kept.";
}
function changed(): never { throw new Error("REVIEW_CHANGED"); }
const scopeKey = (input: Request<typeof preparation.prepareAdditionalFieldMigrationSchema>) => JSON.stringify({ ...input, operationId: undefined });

/** Controlled client adapter only. No support opening on mount, business query,
 * auto batching or inferred recovery; root supplies trusted client callbacks. */
export function FieldMigrationControls(props: FieldMigrationControlsProps) {
  const [preparationId, setPreparationId] = useState(props.initialPreparationId?.toLowerCase());
  const [view, setView] = useState<control.AdditionalFieldMigrationStatus | null>(null);
  // Independently retained server-verified metadata only; never retain protected
  // display/grants after a full status failure. Original Cancel refreshes/CASes.
  const [recovery, setRecovery] = useState<control.AdditionalFieldMigrationRecoveryStatus | null>(null);
  const [collected, setCollected] = useState<{ revision: number; exhausted: boolean } | null>(null);
  const [notes, setNotes] = useState<readonly string[]>([]), [warningAck, setWarningAck] = useState(false), [lossAck, setLossAck] = useState(false);
  const [busy, setBusy] = useState(""), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const latest = useRef(props), id = useRef(preparationId);
  useLayoutEffect(() => { latest.current = props; id.current = preparationId; }, [props, preparationId]);
  const pending = useRef(false), epoch = useRef(0), previousDefinition = useRef(props.definitionId);
  const retry = useRef<Request<typeof preparation.prepareAdditionalFieldMigrationSchema> | null>(null);
  function clearProtected() { setView(null); setCollected(null); setNotes([]); setWarningAck(false); setLossAck(false); setConfirmation(null); }
  useEffect(() => {
    if (previousDefinition.current !== props.definitionId) {
      previousDefinition.current = props.definitionId; epoch.current++; retry.current = null; clearProtected(); setRecovery(null);
      id.current = props.initialPreparationId?.toLowerCase(); setPreparationId(id.current); setError(""); setNotice("");
    } else if (props.initialPreparationId && props.initialPreparationId.toLowerCase() !== id.current) {
      epoch.current++; clearProtected(); setRecovery(null); id.current = props.initialPreparationId.toLowerCase(); setPreparationId(id.current);
    }
    if (props.disabled) { epoch.current++; clearProtected(); }
  }, [props.definitionId, props.initialPreparationId, props.disabled]);
  const selectedMatches = !props.initialPreparationId || props.initialPreparationId.toLowerCase() === preparationId;
  const active = props.disabled || !selectedMatches || view?.definitionId !== props.definitionId.toLowerCase() || view.preparationId !== preparationId ? null : view;
  const safeRecovery = props.disabled || !selectedMatches || recovery?.definitionId !== props.definitionId.toLowerCase() || recovery.preparationId !== preparationId ? null : recovery;
  const cancellable = active?.publication?.state === "PUBLISHED" ? { ...identityFromStatus(active), revision: active.publication.revision }
    : safeRecovery?.publicationState === "PUBLISHED" && safeRecovery.publicationRevision !== null
      ? { definitionId: safeRecovery.definitionId, preparationId: safeRecovery.preparationId, revision: safeRecovery.publicationRevision } : null;
  const blocked = props.disabled || !!busy;
  const identity = (selected = id.current) => control.readAdditionalFieldMigrationStatusSchema.parse({ definitionId: props.definitionId, preparationId: selected });
  function matches(returnedId: string, selected: string) { if (returnedId !== selected.toLowerCase()) changed(); }
  async function run(label: string, action: (valid: () => boolean) => Promise<void>) {
    if (latest.current.disabled || pending.current) return;
    pending.current = true; const token = ++epoch.current, definitionId = props.definitionId;
    const valid = () => epoch.current === token && latest.current.definitionId === definitionId && !latest.current.disabled;
    setBusy(label); setError(""); setNotice("");
    try { await action(valid); }
    catch (caught) { if (valid()) { clearProtected(); setError(failed(caught)); } }
    finally { pending.current = false; setBusy(""); }
  }
  async function refresh(valid: () => boolean, selected: string, check?: (status: control.AdditionalFieldMigrationStatus) => boolean) {
    const request = control.readAdditionalFieldMigrationStatusSchema.parse({ definitionId: props.definitionId, preparationId: selected });
    const status = control.additionalFieldMigrationStatusSchema.parse(await props.callbacks.status(request));
    if (!valid()) return;
    if (status.definitionId !== request.definitionId || status.preparationId !== request.preparationId || (check && !check(status))) changed();
    const review = status.review, execution = status.execution, cutover = status.cutover;
    if (review && (review.valid + review.invalid !== review.affectedCount || review.lossy > review.valid)) changed();
    if (status.publication && status.preparationState !== "REVIEWED") changed();
    if (execution && (!status.publication || execution.processedCount > execution.affectedCount
      || (execution.state === "READY" && execution.processedCount !== execution.affectedCount)
      || (execution.state === "FAILED") !== (execution.failureCode !== null)
      || (review && execution.affectedCount !== review.affectedCount))) changed();
    if (cutover && (!execution || execution.state !== "READY" || status.publication?.state !== ({ ACTIVATED: "CUTOVER", ROLLED_BACK: "ROLLED_BACK", FINALIZED: "COMPLETED" } as const)[cutover.state])) changed();
    setRecovery({ definitionId: status.definitionId, preparationId: status.preparationId, preparationState: status.preparationState,
      publicationState: status.publication?.state ?? null, publicationRevision: status.publication?.revision ?? null });
    setView(status); setWarningAck(false); setLossAck(false); setConfirmation(null);
  }
  const checkRecovery = () => run("Checking recovery options…", async valid => {
    if (!props.callbacks.recoveryStatus) return;
    // An explicitly failed recovery read discards prior metadata; never infer
    // PUBLISHED from an error or use a result from another selected operation.
    setRecovery(null);
    const request = control.readAdditionalFieldMigrationRecoveryStatusSchema.parse(identity());
    const result = control.additionalFieldMigrationRecoveryStatusSchema.parse(await props.callbacks.recoveryStatus(request));
    if (!valid()) return;
    if (result.definitionId !== request.definitionId || result.preparationId !== request.preparationId) changed();
    clearProtected(); setRecovery(result);
  });
  const prepare = () => run("Preparing review…", async valid => {
    const candidate = preparation.prepareAdditionalFieldMigrationSchema.parse(props.prepareInput());
    if (candidate.definitionId !== props.definitionId.toLowerCase()) changed();
    if (!retry.current || scopeKey(candidate) !== scopeKey(retry.current)) retry.current = candidate;
    const request = retry.current, result = preparation.additionalFieldMigrationPreparedSchema.parse(await props.callbacks.prepare(request));
    if (!valid()) return; matches(result.preparationId, request.operationId);
    id.current = result.preparationId; setPreparationId(result.preparationId); retry.current = null; props.onPreparationChange?.(result.preparationId);
    await refresh(valid, result.preparationId, status => status.preparationRevision >= result.revision);
  });
  const collect = () => run("Reviewing next batch…", async valid => {
    if (!active || active.preparationState !== "PREPARING" || active.publication) return;
    const request = preparation.collectAdditionalFieldMigrationSchema.parse({ ...identity(), revision: active.preparationRevision, expectedState: "PREPARING", limit: 25 });
    const result = preparation.additionalFieldMigrationCollectedSchema.parse(await props.callbacks.collect(request));
    if (!valid()) return; matches(result.preparationId, request.preparationId); if (result.revision < request.revision) changed();
    await refresh(valid, request.preparationId, status => status.preparationRevision >= result.revision);
    if (valid()) { setCollected({ revision: result.revision, exhausted: result.cursorExhausted === true }); setNotice(result.cursorExhausted ? "All records in this review have been collected. Check the complete totals next." : "One batch reviewed. Continue with the next batch when you are ready."); }
  });
  const seal = () => run("Checking complete review…", async valid => {
    if (!active || active.publication || !collected?.exhausted || collected.revision !== active.preparationRevision) return;
    const request = preparation.sealAdditionalFieldMigrationSchema.parse({ ...identity(), revision: active.preparationRevision, expectedState: "PREPARING" });
    const result = preparation.additionalFieldMigrationSealedSchema.parse(await props.callbacks.seal(request));
    if (!valid()) return; matches(result.preparationId, request.preparationId); if (result.revision < request.revision) changed();
    await refresh(valid, request.preparationId, status => status.preparationState === "REVIEWED" && status.preparationRevision >= result.revision && status.review?.checksum === result.reviewChecksum);
    if (valid()) setNotes(result.indexImpact);
  });
  const start = () => run("Starting conversion…", async valid => {
    if (!active?.publication || active.publication.state !== "PUBLISHED" || !active.review || active.execution) return;
    const request = control.startAdditionalFieldMigrationExecutionSchema.parse({ ...identity(), publicationRevision: active.publication.revision, reviewChecksum: active.review.checksum });
    const result = control.additionalFieldMigrationExecutedSchema.parse(await props.callbacks.start(request));
    if (!valid()) return; matches(result.preparationId, request.preparationId);
    await refresh(valid, request.preparationId, status => status.publication?.state === "CANCELLED" || !!status.execution && status.execution.revision >= result.revision);
  });
  const execute = () => run("Converting next batch…", async valid => {
    const execution = active?.execution;
    if (!execution || !["RUNNING", "FAILED"].includes(execution.state) || active?.publication?.state !== "PUBLISHED") return;
    const request = control.executeAdditionalFieldMigrationBatchSchema.parse({ ...identity(), revision: execution.revision, expectedState: execution.state, limit: 25 });
    const result = control.additionalFieldMigrationExecutedSchema.parse(await props.callbacks.execute(request));
    if (!valid()) return; matches(result.preparationId, request.preparationId); if (result.revision < request.revision) changed();
    await refresh(valid, request.preparationId, status => status.publication?.state === "CANCELLED" || !!status.execution && status.execution.revision >= result.revision && status.execution.processedCount >= result.processedCount);
  });
  const confirm = () => run("Applying your confirmation…", async valid => {
    if (!confirmation || (!active && confirmation !== "cancel")) return;
    const selected = confirmation, scope = identity();
    if (selected === "publish") {
      if (!active?.review || active.review.invalid || !warningAck || (active.review.lossy > 0 && !lossAck) || active.publication) return;
      const request = control.publishAdditionalFieldMigrationSchema.parse({ ...scope, revision: active.preparationRevision, reviewChecksum: active.review.checksum, acknowledgeWarnings: warningAck, acknowledgeLoss: lossAck });
      const result = control.additionalFieldMigrationPublishedSchema.parse(await props.callbacks.publish(request));
      if (!valid()) return; matches(result.preparationId, scope.preparationId); if (result.reviewChecksum !== request.reviewChecksum || result.preparationRevision < request.revision) changed();
      setRecovery({ ...scope, preparationState: "REVIEWED", publicationState: "PUBLISHED", publicationRevision: result.publicationRevision });
      await refresh(valid, scope.preparationId, status => !!status.publication && status.publication.revision >= result.publicationRevision);
    } else if (selected === "cutover") {
      if (!active?.review || !active.currentHead || active.publication?.state !== "PUBLISHED" || active.execution?.state !== "READY") return;
      const request = control.cutoverAdditionalFieldMigrationSchema.parse({ ...scope, reviewChecksum: active.review.checksum, definitionRevision: active.currentHead.definitionRevision, publicationRevision: active.publication.revision, executionRevision: active.execution.revision });
      const result = control.additionalFieldMigrationCutoverSchema.parse(await props.callbacks.cutover(request));
      if (!valid()) return; matches(result.preparationId, scope.preparationId); if (result.reviewChecksum !== request.reviewChecksum || result.definitionRevision !== request.definitionRevision + 1 || result.publicationRevision !== request.publicationRevision + 1 || result.executionRevision !== request.executionRevision) changed();
      setRecovery({ ...scope, preparationState: "REVIEWED", publicationState: "CUTOVER", publicationRevision: result.publicationRevision });
      await refresh(valid, scope.preparationId, status => !!status.cutover && !!status.publication && status.publication.revision >= result.publicationRevision);
    } else if (selected === "cancel") {
      if (!cancellable) return;
      const request = control.cancelAdditionalFieldMigrationSchema.parse(cancellable);
      const result = control.additionalFieldMigrationCancelledSchema.parse(await props.callbacks.cancel(request));
      if (!valid()) return; matches(result.preparationId, request.preparationId); if (result.revision < request.revision) changed();
      setRecovery({ ...identityFromStatus(request), preparationState: "REVIEWED", publicationState: "CANCELLED", publicationRevision: result.revision });
      await refresh(valid, request.preparationId, status => status.publication?.state === "CANCELLED" && status.publication.revision >= result.revision);
    } else {
      if (active?.cutover?.state !== "ACTIVATED") return;
      const request = control.settleAdditionalFieldMigrationSchema.parse({ ...scope, ...active.cutover.confirmation, cutoverChecksum: active.cutover.checksum });
      const result = control.additionalFieldMigrationSettledSchema.parse(await props.callbacks[selected](request));
      if (!valid()) return; matches(result.preparationId, scope.preparationId); if (result.state !== (selected === "rollback" ? "ROLLED_BACK" : "FINALIZED")) changed();
      await refresh(valid, scope.preparationId, status => status.cutover?.state === result.state && status.cutover.settlementChecksum === result.settlementChecksum);
    }
  });
  const leave = () => { epoch.current++; clearProtected(); setRecovery(null); retry.current = null; id.current = undefined; setPreparationId(undefined); props.onPreparationChange?.(undefined); setNotice("You left this inactive review. Its saved history is kept; the live field is unchanged."); };
  const review = active?.review, publication = active?.publication, execution = active?.execution, cutover = active?.cutover;
  const steps = ["Prepare", "Review records", "Publish", "Convert", "Go live"];
  const step = !active ? 0 : cutover ? 5 : execution ? 4 : publication ? 3 : review ? 2 : preparationId ? 1 : 0;
  return <section aria-label="Controlled field change" className="mt-8 rounded-3xl border border-[var(--color-border)] bg-white p-5 sm:p-7">
    <div inert={confirmation !== null}>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-atlas-blue)]">Review & go live</p><h2 className="mt-1 text-xl font-semibold">A safe change, step by step</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink-muted)]">Review the records, convert in manageable batches, then choose when the new field goes live.</p></div>{preparationId && <Button type="button" disabled={blocked} onClick={() => run("Refreshing review…", valid => refresh(valid, preparationId))}><RefreshCw size={15}/>Refresh review</Button>}</div>
      <ol className="my-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold" aria-label="Change steps">{steps.map((label, index) => <li key={label} className={`flex items-center gap-2 ${index < step ? "text-[var(--color-atlas-blue)]" : "text-[var(--color-ink-muted)]"}`}>{index < step ? <Check size={14}/> : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-surface)]">{index + 1}</span>}{label}{index < 4 && <ChevronRight size={12}/>}</li>)}</ol>
      {props.disabled && <p className="rounded-2xl bg-amber-50 p-4 text-sm">Save your current field settings and conversion choices before reviewing or continuing. Review details are cleared while the editor has changes.</p>}
      {error && <p role="alert" className="my-4 rounded-2xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="my-4 text-sm text-[var(--color-ink-muted)]">{notice}</p>}
      {busy && <p role="status" className="my-4 text-sm">{busy}</p>}
      {!preparationId && <Button type="button" variant="primary" disabled={blocked} onClick={prepare}>Prepare saved change</Button>}
      {preparationId && !active && !props.disabled && <p className="text-sm text-[var(--color-ink-muted)]">A saved review is selected. Refresh it to check your current access and its latest progress.</p>}
      {preparationId && !active && !props.disabled && <div className="mt-4 space-y-3 rounded-2xl bg-[var(--color-surface)] p-4 text-sm">
        <p>Recovery checks only whether this saved change can be stopped. It does not load protected records, totals or conversion progress.</p>
        {props.callbacks.recoveryStatus && <Button type="button" disabled={blocked} onClick={checkRecovery}>Check recovery options</Button>}
        {cancellable && <><p>A previously verified publication can be stopped. The server checks your current access and its latest state again.</p><Button type="button" disabled={blocked || cancellable.revision > 2147483646} onClick={() => setConfirmation("cancel")}>Stop published change</Button></>}
        {safeRecovery && safeRecovery.publicationState !== "PUBLISHED" && <p>{safeRecovery.publicationState === "CANCELLED" ? "This pending change was stopped before going live. Its saved history is kept." : "This saved review has no pending publication to stop. Refresh the full review for other authorised options."}</p>}
        {safeRecovery && safeRecovery.publicationState === null && <Button type="button" variant="ghost" disabled={blocked} onClick={leave}>Leave this review</Button>}
      </div>}
      {active && <div className="space-y-5">
        {active.currentHead && <p className="text-sm">Live field now: <strong>{active.currentHead.versionLabel}</strong>. This is the current live version, separate from this review’s history.</p>}
        {review && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Complete review totals">{[["Affected records", review.affectedCount], ["Ready", review.valid], ["Need correction", review.invalid], ["Information loss", review.lossy]].map(([label, value]) => <div key={label} className="rounded-2xl bg-[var(--color-surface)] p-4"><p className="text-xs text-[var(--color-ink-muted)]">{label}</p><p className="mt-1 text-2xl font-semibold">{typeof value === "number" ? value.toLocaleString() : value}</p></div>)}</div>}
        {!publication && active.preparationState === "PREPARING" && <div><p className="mb-3 text-sm">Review one batch of up to 25 records at a time. Complete totals are checked after every record is collected.</p><div className="flex flex-wrap gap-3"><Button type="button" disabled={blocked} onClick={collect}>Review next batch</Button><Button type="button" variant="primary" disabled={blocked || !collected?.exhausted || collected.revision !== active.preparationRevision} onClick={seal}>Check complete review</Button></div></div>}
        {review && !publication && <div>{review.invalid > 0 ? <p className="rounded-2xl bg-amber-50 p-4 text-sm">Correct the invalid values and prepare a new review before publishing. The live field is unchanged.</p> : <><p className="mb-3 text-sm">Publishing saves the reviewed target; it does not switch the live field yet.</p>{[...props.reviewNotes ?? [], ...notes].length > 0 && <ul className="mb-4 list-disc space-y-1 pl-5 text-sm">{[...props.reviewNotes ?? [], ...notes].map((text, index) => <li key={index}>{text}</li>)}</ul>}<label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={warningAck} disabled={blocked} onChange={event => setWarningAck(event.target.checked)}/>I have reviewed the saved settings and publication notes.</label>{review.lossy > 0 && <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={lossAck} disabled={blocked} onChange={event => setLossAck(event.target.checked)}/>I accept the information loss shown in this complete review.</label>}<Button type="button" className="mt-4" variant="primary" disabled={blocked || !warningAck || (review.lossy > 0 && !lossAck)} onClick={() => setConfirmation("publish")}>Publish reviewed target</Button></>}</div>}
        {publication?.state === "PUBLISHED" && <div className="space-y-3"><p className="text-sm">The new version is published. The current live field stays in place until conversion is complete and you confirm Go live.</p>{!execution && <Button type="button" variant="primary" disabled={blocked} onClick={start}>Start conversion</Button>}{execution && <><p className="text-sm font-medium">Converted {execution.processedCount.toLocaleString()} of {execution.affectedCount.toLocaleString()} records</p>{execution.state === "FAILED" && <p className="rounded-2xl bg-amber-50 p-4 text-sm">The last batch did not commit. Recheck access and changed records before explicitly resuming.</p>}{["RUNNING", "FAILED"].includes(execution.state) && <Button type="button" disabled={blocked} variant="primary" onClick={execute}>{execution.state === "FAILED" ? "Resume next batch" : "Convert next batch"}</Button>}{execution.state === "READY" && <Button type="button" variant="primary" disabled={blocked} onClick={() => setConfirmation("cutover")}>Review go live</Button>}</>}<div><Button type="button" variant="ghost" disabled={blocked} onClick={() => setConfirmation("cancel")}>Stop published change</Button></div></div>}
        {cutover && <div className="rounded-2xl bg-[var(--color-surface)] p-4 text-sm"><p className="font-semibold">{cutover.state === "ACTIVATED" ? "This reviewed change was made live." : cutover.state === "ROLLED_BACK" ? "This reviewed change was restored to its previous field." : "This reviewed change is finished."}</p><p className="mt-2 leading-6">This describes the saved operation. Later live versions are shown separately above.</p>{cutover.state === "ACTIVATED" && <><p className="mt-3 leading-6">The previous version can be restored only while the reviewed records remain unchanged. New target writes require a separate reverse review.</p><div className="mt-4 flex flex-wrap gap-3"><Button type="button" disabled={blocked} onClick={() => setConfirmation("rollback")}>Review restoration</Button><Button type="button" disabled={blocked} onClick={() => setConfirmation("finalize")}>Review finish</Button></div></>}</div>}
        {publication?.state === "CANCELLED" && <p className="rounded-2xl bg-[var(--color-surface)] p-4 text-sm">This pending change was stopped before going live. Its saved history is kept.</p>}
      </div>}
      {preparationId && active && !publication && <Button type="button" className="mt-5" variant="ghost" disabled={blocked} onClick={leave}>Leave this review</Button>}
    </div>
    {confirmation && !props.disabled && <ConfirmationDialog title={confirmations[confirmation].title} busy={!!busy} onClose={() => setConfirmation(null)}><p className="text-sm leading-6 text-[var(--color-ink-muted)]">{confirmations[confirmation].text}</p><div className="mt-6 flex flex-wrap justify-end gap-3"><Button type="button" disabled={blocked} onClick={() => setConfirmation(null)}>Keep current state</Button><Button type="button" variant={confirmation === "cancel" ? "danger" : "primary"} disabled={blocked} onClick={confirm}>{busy || confirmations[confirmation].button}</Button></div></ConfirmationDialog>}
  </section>;
}
function ConfirmationDialog({ title, busy, onClose, children }: { title: string; busy: boolean; onClose(): void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const previous = document.activeElement; ref.current?.querySelector<HTMLButtonElement>("button")?.focus(); return () => { if (previous instanceof HTMLElement) previous.focus(); }; }, []);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl" onKeyDown={event => {
    if (event.key === "Escape" && !busy) onClose();
    if (event.key !== "Tab") return;
    const buttons = [...ref.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []];
    if (!buttons.length) { event.preventDefault(); ref.current?.focus(); }
    else if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
    else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
  }}><h3 className="mb-3 text-xl font-semibold">{title}</h3>{children}</div></div>;
}
