"use client";
import { useState } from "react";
import { ActionForm } from "./action-form";
import { financeReconciliationForm } from "../services/banking";
import { digits, minor, money } from "../domain/money";
import { financeField as field } from "./workspace";

export function ReconciliationEditor({ transactionId, amount, currency, invoices }: { transactionId: string; amount: bigint; currency: string; invoices: { id: string; reference: string; currency: string; gross: bigint; settled: bigint; party: { name: string } | null }[] }) {
  const [rows, setRows] = useState<Array<{ id: string; amount: string; bankAmount: string }>>([]);
  const decimal = (amount: bigint, currency: string) => { const places = digits(currency), base = 10n ** BigInt(places); return `${amount / base}${places ? "." + (amount % base).toString().padStart(places, "0") : ""}`; };
  const update = (index: number, key: "amount" | "bankAmount", value: string) => setRows(previous => previous.map((row, i) => i === index ? { ...row, [key]: value } : row));
  let remainder = amount < 0n ? -amount : amount, valid = true;
  try { for (const row of rows) { const invoice = invoices.find(invoice => invoice.id === row.id)!; remainder -= minor(invoice.currency === currency ? row.amount : row.bankAmount, currency); } } catch { valid = false; }
  return <ActionForm action={financeReconciliationForm} label="Reconcile these allocations"><input type="hidden" name="transactionId" value={transactionId}/>
    <label className="block text-xs">Add a posted invoice<select className={field} value="" onChange={event => { const invoice = invoices.find(invoice => invoice.id === event.target.value); if (invoice) setRows(previous => [...previous, { id: invoice.id, amount: decimal(invoice.gross - invoice.settled, invoice.currency), bankAmount: "" }]); }}><option value="">Choose an invoice</option>{invoices.filter(invoice => !rows.some(row => row.id === invoice.id)).map(invoice => <option value={invoice.id} key={invoice.id}>{invoice.reference} · {invoice.party?.name} · {money(invoice.gross - invoice.settled, invoice.currency)}</option>)}</select></label>
    {rows.map((row, index) => { const invoice = invoices.find(invoice => invoice.id === row.id)!; return <fieldset className="grid gap-3 border-t border-slate-100 py-3 sm:grid-cols-3" key={row.id}><legend className="text-xs font-medium">{invoice.reference} · {invoice.party?.name}</legend><label className="text-xs">Invoice amount ({invoice.currency})<input name={`amount:${row.id}`} className={field} value={row.amount} onChange={event => update(index, "amount", event.target.value)} required/></label>{invoice.currency !== currency && <label className="text-xs">Equivalent bank amount ({currency})<input name={`bank:${row.id}`} className={field} value={row.bankAmount} onChange={event => update(index, "bankAmount", event.target.value)} required/></label>}<button className="self-end py-2 text-left text-xs text-slate-500" type="button" onClick={() => setRows(previous => previous.filter(item => item.id !== row.id))}>Remove allocation</button></fieldset>; })}
    <p aria-live="polite" className={`text-sm ${valid && remainder === 0n ? "text-blue-800" : "text-slate-500"}`}>{valid ? `Unallocated bank amount: ${money(remainder, currency)}` : "Enter valid decimal amounts."}</p><p className="text-xs leading-5 text-slate-500">The full bank amount must be allocated. Each invoice may be paid partially. Foreign-currency allocations clear the retained carrying value and post the exchange gain or loss to your configured profile.</p>
  </ActionForm>;
}
