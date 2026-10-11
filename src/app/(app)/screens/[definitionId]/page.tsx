import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { listCustomerScreens, customerScreenRecords } from "@/core/studio/pages/customer-catalog";
import { readActiveCustomerPage, prepareVisiblePageSurfaceInTransaction } from "@/core/studio/pages/customer-gateway";
import { PublishedBusinessScreen } from "./screen";
import { withFieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { loadTicketProgressFormInTransaction } from "@/core/service-work/page-form";
import { TicketProgressForm } from "@/components/service-work/ticket-progress-form";
import type { ReactNode } from "react";

export default async function BusinessScreen({ params, searchParams }: {
  params: Promise<{ definitionId: string }>; searchParams: Promise<{ record?: string; size?: string }>;
}) {
  const session = await requireSession(), { definitionId } = await params, { record, size } = await searchParams;
  const formFactor = size === "phone" || size === "tablet" ? size : "desktop";
  const screen = (await listCustomerScreens(session)).find(screen => screen.id === definitionId);
  if (!screen) notFound();
  if (screen.scope === "record" && !record) {
    const choices = await customerScreenRecords(session, definitionId);
    return <div className="mx-auto max-w-4xl space-y-6"><Link href="/home" className="text-sm text-blue-700">Back to your business</Link>
      <header><h1 className="text-3xl font-semibold tracking-tight">{screen.name}</h1><p className="mt-2 text-sm text-slate-500">Choose a record to open in your business design.</p></header>
      <div className="grid gap-3">{choices.records.map(record => <Link key={record.id} href={`/screens/${definitionId}?record=${encodeURIComponent(record.id)}`} className="rounded-2xl border bg-white p-5 font-medium text-blue-700">{record.label}</Link>)}</div>
      {!choices.records.length && <p className="rounded-2xl border bg-white p-6 text-sm text-slate-500">There are no accessible records yet.</p>}
      {choices.hasMore && <p className="text-sm text-slate-500">Showing the first 50 accessible records. Open other records from their app.</p>}
    </div>;
  }
  const request = screen.scope === "record" && record ? { kind: "record" as const, recordId: record } : { kind: "list" as const };
  const view = await readActiveCustomerPage(session, { definitionId, request, formFactor });
  const surfaces: Record<string, ReactNode> = {};
  for (const component of view.model.sections.flatMap(section => section.components)) if (component.type === "surface"
    && component.surface?.id === "tickets.ticket.progress_form" && component.surface.version === 1) {
    const form = await withFieldRuntimeAuthority(session, async authority => {
      const prepared = await prepareVisiblePageSurfaceInTransaction(authority, { definitionId, request, formFactor,
        componentId: component.id, expectedVersionId: view.versionId, expectedDefinitionRevision: view.definitionRevision });
      if (prepared.ownerModuleId !== "tickets" || prepared.surface.id !== "tickets.ticket.progress_form" || prepared.anchor.nativeRevision === undefined)
        throw new Error("The ticket form is unavailable.");
      const expectedUpdatedAt = prepared.anchor.revision.slice(prepared.anchor.revision.indexOf("@") + 1);
      return loadTicketProgressFormInTransaction(prepared.authority, { recordId: prepared.anchor.recordId,
        expectedRevision: prepared.anchor.nativeRevision, expectedUpdatedAt });
    });
    surfaces[component.id] = <TicketProgressForm {...form}/>;
  }
  return <div className="mx-auto max-w-7xl space-y-6"><Link href="/home" className="text-sm text-blue-700">Back to your business</Link>
    <header><p className="text-xs font-medium text-slate-500">{session.organisationName}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{view.name}</h1></header>
    <PublishedBusinessScreen key={`${view.versionId}:${record ?? "list"}:${formFactor}`} initial={view} request={request} surfaces={surfaces}/></div>;
}
