"use client";
import { useState, useTransition } from "react";
import { addDeliveryAddress, addInstaller } from "../services/delivery-address";

type Added = Awaited<ReturnType<typeof addDeliveryAddress>>;
const box = "w-full rounded-lg border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm";
const empty = { label: "", line1: "", line2: "", city: "", region: "", postcode: "", country: "United Kingdom", telephone: "", deliveryInstructions: "", makeDefault: false };

/** Add a delivery address without leaving the order. Deliberately not a <form>: it sits inside the order form. */
export function NewDeliveryAddress({ partyId, customerName, onAdded }: { partyId: string; customerName: string; onAdded: (address: Added) => void }) {
  const [open, setOpen] = useState(false), [values, setValues] = useState(empty), [error, setError] = useState(""), [pending, start] = useTransition();
  const set = (key: keyof typeof empty) => (event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [key]: event.target.value }));
  const stop = (event: React.KeyboardEvent) => { if (event.key === "Enter") event.preventDefault(); };
  if (!open) return <button type="button" disabled={!partyId} onClick={() => setOpen(true)} title={partyId ? "" : "Choose the customer first"} className="mt-1 text-xs font-medium text-[var(--color-atlas-blue)] disabled:text-slate-400">+ New delivery address</button>;
  return <div className="mt-2 space-y-2 rounded-xl border border-[var(--color-border)] bg-slate-50 p-3" onKeyDown={stop}>
    <p className="text-xs font-semibold text-[var(--color-ink)]">New delivery address for {customerName}</p>
    <input aria-label="Site or address name" placeholder="Site or address name (optional)" value={values.label} onChange={set("label")} className={box} />
    <input aria-label="Address line 1" placeholder="Address line 1" value={values.line1} onChange={set("line1")} className={box} />
    <input aria-label="Address line 2" placeholder="Address line 2" value={values.line2} onChange={set("line2")} className={box} />
    <div className="grid grid-cols-2 gap-2"><input aria-label="Town or city" placeholder="Town or city" value={values.city} onChange={set("city")} className={box} /><input aria-label="County" placeholder="County" value={values.region} onChange={set("region")} className={box} /><input aria-label="Postcode" placeholder="Postcode" value={values.postcode} onChange={set("postcode")} className={box} /><input aria-label="Country" placeholder="Country" value={values.country} onChange={set("country")} className={box} /></div>
    <input aria-label="Site telephone" placeholder="Site telephone (optional)" value={values.telephone} onChange={set("telephone")} className={box} />
    <input aria-label="Delivery instructions" placeholder="Delivery instructions: access, unloading, opening hours" value={values.deliveryInstructions} onChange={set("deliveryInstructions")} className={box} />
    <label className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]"><input type="checkbox" checked={values.makeDefault} onChange={(event) => setValues((current) => ({ ...current, makeDefault: event.target.checked }))} />Make this the customer&apos;s usual delivery address</label>
    {error && <p role="alert" className="text-xs text-[var(--color-status-danger)]">{error}</p>}
    <div className="flex gap-2"><button type="button" disabled={pending} onClick={() => start(async () => { setError(""); try { const added = await addDeliveryAddress(partyId, values); onAdded(added); setValues(empty); setOpen(false); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the address."); } })} className="rounded-lg bg-[var(--color-atlas-blue)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">{pending ? "Saving…" : "Save and use this address"}</button><button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-xs text-[var(--color-ink-muted)]">Cancel</button></div>
  </div>;
}

type Installer = Awaited<ReturnType<typeof addInstaller>>;
const blank = { name: "", contactFirstName: "", contactSurname: "", contactPhone: "", contactEmail: "" };

/** Set up an installer as its own customer record without leaving the order. Not a <form>. */
export function NewInstaller({ invoiceAccountId, invoiceAccountName, onAdded }: { invoiceAccountId: string; invoiceAccountName: string; onAdded: (installer: Installer) => void }) {
  const [open, setOpen] = useState(false), [values, setValues] = useState(blank), [error, setError] = useState(""), [pending, start] = useTransition();
  const set = (key: keyof typeof blank) => (event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [key]: event.target.value }));
  if (!open) return <button type="button" disabled={!invoiceAccountId} onClick={() => setOpen(true)} title={invoiceAccountId ? "" : "Choose the customer first"} className="mt-1 text-xs font-medium text-[var(--color-atlas-blue)] disabled:text-slate-400">+ New account to order for</button>;
  return <div className="mt-2 space-y-2 rounded-xl border border-[var(--color-border)] bg-slate-50 p-3" onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }}>
    <p className="text-xs font-semibold text-[var(--color-ink)]">New account, invoiced through {invoiceAccountName}</p>
    <input aria-label="Account name" placeholder="Name: installer, contractor, site or end customer" value={values.name} onChange={set("name")} className={box} />
    <div className="grid grid-cols-2 gap-2"><input aria-label="Contact first name" placeholder="Contact first name" value={values.contactFirstName} onChange={set("contactFirstName")} className={box} /><input aria-label="Contact surname" placeholder="Surname" value={values.contactSurname} onChange={set("contactSurname")} className={box} /><input aria-label="Phone" placeholder="Phone" value={values.contactPhone} onChange={set("contactPhone")} className={box} /><input aria-label="Email" placeholder="Email" value={values.contactEmail} onChange={set("contactEmail")} className={box} /></div>
    <p className="text-[11px] text-[var(--color-ink-muted)]">Saved once as its own customer record with its own delivery addresses. Other branches can order for the same account; whoever places the order is the one invoiced.</p>
    {error && <p role="alert" className="text-xs text-[var(--color-status-danger)]">{error}</p>}
    <div className="flex gap-2"><button type="button" disabled={pending} onClick={() => start(async () => { setError(""); try { const added = await addInstaller(invoiceAccountId, values); onAdded(added); setValues(blank); setOpen(false); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the account."); } })} className="rounded-lg bg-[var(--color-atlas-blue)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">{pending ? "Saving…" : "Save and use this account"}</button><button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-xs text-[var(--color-ink-muted)]">Cancel</button></div>
  </div>;
}
