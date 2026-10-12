import React, { type ReactNode } from "react";
import type { ContractReference } from "@/core/studio/registry/types";
import { parseTicketPanel, ticketPanelKinds, ticketPanelSurface, type TicketPanelKind } from "@/core/service-work/page-panel-contract";
import type { z } from "zod";
import { ticketPanelValues } from "@/core/service-work/page-panel-contract";

const friendly = (value: string) => value.replaceAll("_", " ").toLowerCase();
const date = (value: string | null) => value ? new Date(value).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "No target";
type Row<K extends TicketPanelKind> = { id: string; values: z.infer<typeof ticketPanelValues[K]> };
export function TicketHistoryPanel({ rows, bounded = false }: { rows: Row<"activity">[]; bounded?: boolean }) {
  return <div className="min-w-0">{bounded && <p className="mb-3 text-xs text-slate-500">Most recent entries · up to 50. Open the full ticket for its complete history.</p>}
    {!rows.length && <p className="text-sm text-slate-500">No history yet.</p>}<div className="divide-y divide-slate-100">{rows.map(({ id, values }) => <article key={id} className="py-4">
      <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500"><strong className="capitalize text-slate-700">{friendly(values.kind)}</strong><span>{date(values.created_at)}</span></div>
      <p className="mt-1 text-xs text-slate-400">{values.actor} · {values.visibility === "INTERNAL" ? "Internal · receiving team only" : "Requester visible"}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{values.body}</p></article>)}</div></div>;
}
export function TicketEvidencePanel({ rows, bounded = false }: { rows: Row<"documents">[]; bounded?: boolean }) {
  return <div className="min-w-0 space-y-2">{bounded && <p className="text-xs text-slate-500">Most recent evidence · up to 50.</p>}
    {!rows.length && <p className="text-sm text-slate-500">No evidence attached.</p>}{rows.map(({ id, values }) => <a className="block break-words text-sm text-teal-700 hover:underline" key={id}
      href={`/api/service-files/${encodeURIComponent(id)}`}>{values.name} · {Math.ceil(values.size / 1024)} KB</a>)}</div>;
}
export function TicketRelationshipsPanel({ rows, bounded = false, outstanding = false }: { rows: Row<"relationships">[]; bounded?: boolean; outstanding?: boolean }) {
  return <div className="min-w-0 space-y-2">{bounded && <p className="text-xs text-slate-500">{outstanding ? "Open linked work" : "Linked records"} · up to 50. Each record keeps its own permissions.</p>}
    {!rows.length && <p className="text-sm text-slate-500">{outstanding ? "No outstanding linked work." : "No linked work."}</p>}{rows.map(({ id, values }) => <a key={id}
      href={`/${values.destination === "case" ? "service/cases" : values.destination === "query" ? "service/queries" : "tickets"}/${encodeURIComponent(id)}`}
      className="block rounded-xl border border-slate-200 p-3 text-sm hover:border-teal-300"><span className="block break-words text-teal-700">{values.number} · {values.subject}</span>
      <span className="mt-1 block text-xs text-slate-500">{values.relationship} · <span className="capitalize">{friendly(values.status)}</span></span></a>)}</div>;
}
export function TicketStatusPanel({ rows }: { rows: Row<"status">[] }) {
  const value = rows[0]?.values;
  return value ? <div className="min-w-0"><span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize">{friendly(value.status)}</span>
    {[{ label: "First response", state: value.first_response_state, due: value.first_response_due }, { label: "Resolution", state: value.resolution_state, due: value.resolution_due }].map(item => <div key={item.label} className="mt-4">
      <p className="text-xs text-slate-500">{item.label}</p><p className={`mt-1 text-sm font-medium capitalize ${item.state === "BREACHED" ? "text-red-700" : "text-teal-700"}`}>{friendly(item.state)}</p><p className="mt-1 text-xs text-slate-400">{date(item.due)}</p></div>)}
    <p className="mt-5 break-words text-xs text-slate-500">Owner: {value.owner} · Reopened {value.reopen_count} times</p></div> : <p className="text-sm text-slate-500">Status unavailable.</p>;
}
export function TicketApprovalPanel({ rows }: { rows: Row<"approval">[] }) {
  return !rows.length ? <p className="text-sm text-slate-500">No approval requested.</p> : <div className="min-w-0"><p className="mt-2 text-sm capitalize">{friendly(rows[0].values.approval_status)}</p>
    {rows.filter(row => row.values.stage !== null).map(({ id, values }) => <div key={id} className="mt-3 rounded-xl border border-slate-100 p-3">
      <p className="break-words text-xs text-slate-600">Stage {(values.stage ?? 0) + 1} · {values.approver} · <span className="capitalize">{friendly(values.status)}</span></p>
      {values.reason && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{values.reason}</p>}{values.due_at && <p className="mt-2 text-xs text-slate-400">Due {date(values.due_at)}</p>}</div>)}</div>;
}
/** Pure allowlisted read-only rendering. Live caller supplies ONLY outputs from
 * the owner-approved shared Page reader. No DB, commands, arbitrary URL or grants.
 * Design mode must remain inert in the shared PageRenderer, not call this adapter. */
export function TicketRecordSurface({ surface, outputs }: { surface: Pick<ContractReference, "id" | "version">; outputs: readonly unknown[] }): ReactNode {
  const kind = ticketPanelKinds.find(kind => surface.id === ticketPanelSurface(kind).id && surface.version === 1);
  if (!kind) return null;
  if (outputs.length !== 1) throw new Error("The Ticket panel is unavailable.");
  if (kind === "activity") return <TicketHistoryPanel rows={parseTicketPanel(kind, outputs[0])} bounded/>;
  if (kind === "documents") return <TicketEvidencePanel rows={parseTicketPanel(kind, outputs[0])} bounded/>;
  if (kind === "relationships" || kind === "outstanding_work") return <TicketRelationshipsPanel rows={parseTicketPanel(kind, outputs[0])} bounded outstanding={kind === "outstanding_work"}/>;
  if (kind === "approval") return <TicketApprovalPanel rows={parseTicketPanel(kind, outputs[0])}/>;
  return <TicketStatusPanel rows={parseTicketPanel(kind, outputs[0])}/>;
}
