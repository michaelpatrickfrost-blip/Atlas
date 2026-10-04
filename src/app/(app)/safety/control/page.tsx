import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { controlBoard } from "@/modules/safety/services/queries";
import { applyIsolationLock, clearIsolation, createIsolation, createPermit, placeSafetyHold, removeIsolationLock, verifyIsolation } from "@/modules/safety/services/control";
import { ENERGY_TYPES, PERMIT_KINDS } from "@/modules/safety/domain/work";
import { Eyebrow, Field, Panel, Quiet, Row, inputClass } from "../ui";

export default async function ControlPage() {
  const session = await requireSession();
  if (!can(session, C.permitRequest) && !can(session, C.holdManage) && !can(session, C.isolationApply) && !can(session, C.equipmentRead)) {
    const { assertCapability } = await import("@/core/permissions/check");
    assertCapability(session, C.permitRequest);
  }
  const board = await controlBoard(session);
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">Control</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-ink-muted)]">Permits, isolation and safety holds for work that is not routine. An expired permit is not valid.</p>
      </header>
      {board.conflicts.map((hint) => <p key={hint} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{hint}</p>)}
      <section>
        <Eyebrow>Permits</Eyebrow>
        <Panel>
          {board.permits.length === 0 && <Quiet>No permits.</Quiet>}
          {board.permits.map((permit) => <Row key={permit.id} href={`/safety/control/permits/${permit.id}`} title={`${permit.reference} · ${permit.title}`} meta={permit.shown.replaceAll("_", " ").toLowerCase()} tone={permit.shown === "EXPIRED" ? "stop" : permit.shown === "IN_PROGRESS" || permit.shown === "AUTHORISED" ? "active" : "attention"} />)}
        </Panel>
      </section>
      <section>
        <Eyebrow>Safety holds</Eyebrow>
        <Panel>
          {board.holds.length === 0 && <Quiet>Nothing is stopped.</Quiet>}
          {board.holds.map((hold) => <Row key={hold.id} href={`/safety/control/holds/${hold.id}`} title={`${hold.targetLabel}`} meta={hold.status === "ACTIVE" ? "Do not use" : "Override"} tone={hold.status === "ACTIVE" ? "stop" : "attention"} />)}
        </Panel>
      </section>
      <section>
        <Eyebrow>Isolations</Eyebrow>
        <Panel>
          {board.isolations.length === 0 && <Quiet>No active isolation.</Quiet>}
          {board.isolations.map((isolation) => (
            <div key={isolation.id} className="px-5 py-4 text-sm">
              <p className="font-medium">{isolation.reference} · {isolation.assetLabel}</p>
              <p className="mt-1 text-[var(--color-ink-muted)]">{isolation.locks.filter((lock) => !lock.removedAt).length} locks active · {isolation.status.toLowerCase()} · {isolation.energyTypes.join(", ").toLowerCase()}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {can(session, C.isolationApply) && <ActionForm action={applyIsolationLock} className="flex gap-2"><input type="hidden" name="isolationId" value={isolation.id} /><input name="identifier" placeholder="Lock id" className={inputClass} /><Button type="submit">Apply lock</Button></ActionForm>}
                {can(session, C.isolationVerify) && <ActionForm action={verifyIsolation}><input type="hidden" name="isolationId" value={isolation.id} /><Button type="submit">Verify</Button></ActionForm>}
                {isolation.locks.filter((lock) => !lock.removedAt).map((lock) => can(session, C.isolationRemove) && <ActionForm key={lock.id} action={removeIsolationLock}><input type="hidden" name="lockId" value={lock.id} /><Button type="submit">Remove {lock.identifier}</Button></ActionForm>)}
                {can(session, C.isolationRemove) && <ActionForm action={clearIsolation}><input type="hidden" name="isolationId" value={isolation.id} /><Button type="submit">Clear isolation</Button></ActionForm>}
              </div>
            </div>
          ))}
        </Panel>
      </section>
      <div className="grid gap-6 lg:grid-cols-3">
        {can(session, C.permitRequest) && (
          <ActionForm action={createPermit} className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5">
            <h2 className="font-semibold">Permit</h2>
            <Field label="Work"><input name="title" required className={inputClass} /></Field>
            <Field label="Type"><select name="kind" className={inputClass}>{PERMIT_KINDS.map((kind) => <option key={kind} value={kind}>{kind.replaceAll("_", " ").toLowerCase()}</option>)}</select></Field>
            <Field label="Expires"><input type="datetime-local" name="expiresAt" className={inputClass} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isolationRequired" /> Isolation required</label>
            <Button type="submit" variant="primary">Request</Button>
          </ActionForm>
        )}
        {can(session, C.holdManage) && (
          <ActionForm action={placeSafetyHold} className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5">
            <h2 className="font-semibold">Safety hold</h2>
            <Field label="Equipment or area"><input name="targetLabel" required className={inputClass} /></Field>
            <Field label="Target id"><input name="targetId" className={inputClass} placeholder="Manufacturing resource id, if any" /></Field>
            <Field label="Target type"><select name="targetType" className={inputClass}><option value="ASSET">Asset</option><option value="MANUFACTURING_RESOURCE">Manufacturing resource</option><option value="LOGISTICS_EQUIPMENT">Logistics equipment</option><option value="AREA">Area</option></select></Field>
            <Field label="Reason"><input name="reason" required className={inputClass} /></Field>
            <Button type="submit">Place hold</Button>
          </ActionForm>
        )}
        {can(session, C.isolationApply) && (
          <ActionForm action={createIsolation} className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5">
            <h2 className="font-semibold">Isolation</h2>
            <Field label="Asset"><input name="assetLabel" required className={inputClass} /></Field>
            <div className="grid grid-cols-2 gap-2 text-sm">{ENERGY_TYPES.map((energy) => <label key={energy} className="flex items-center gap-2"><input type="checkbox" name="energy" value={energy} />{energy.toLowerCase()}</label>)}</div>
            <Button type="submit">Plan isolation</Button>
          </ActionForm>
        )}
      </div>
    </div>
  );
}
