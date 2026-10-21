import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { listCustomerScreens, customerScreenRecords } from "@/core/studio/pages/customer-catalog";
import { readActiveCustomerPage, prepareVisiblePageSurfaceInTransaction } from "@/core/studio/pages/customer-gateway";
import { PublishedBusinessScreen } from "./screen";
import { withFieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { loadTicketProgressFormInTransaction } from "@/core/service-work/page-form";
import { TicketProgressForm } from "@/components/service-work/ticket-progress-form";
import { readRecordDefaultCustomerPage, prepareVisibleRecordDefaultSurfaceInTransaction } from "@/core/studio/pages/record-default";
import type { ReactNode } from "react";
import { BusinessScreenRecordChooser } from "./record-chooser";

export default async function BusinessScreen({ params, searchParams }: {
  params: Promise<{ definitionId: string }>; searchParams: Promise<{ record?: string; size?: string; mode?: string }>;
}) {
  const session = await requireSession(), { definitionId } = await params, { record, size, mode } = await searchParams;
  const formFactor = size === "phone" || size === "tablet" ? size : "desktop";
  if (mode !== undefined && mode !== "record_default") notFound();
  const selected = mode === "record_default";
  if (selected && !record) notFound();
  const screen = selected ? null : (await listCustomerScreens(session)).find(screen => screen.id === definitionId);
  if (!selected && !screen) notFound();
  if (screen?.scope === "record" && !record) {
    const choices = await customerScreenRecords(session, definitionId);
    return <div className="mx-auto max-w-4xl space-y-6"><Link href="/home" className="text-sm text-blue-700">Back to your business</Link>
      <header><h1 className="text-3xl font-semibold tracking-tight">{screen.name}</h1><p className="mt-2 text-sm text-slate-500">Choose a record to open in your business design.</p></header>
      <BusinessScreenRecordChooser initial={choices}/>
    </div>;
  }
  const request = (selected || screen?.scope === "record") && record ? { kind: "record" as const, recordId: record } : { kind: "list" as const };
  const defaultView = selected ? await readRecordDefaultCustomerPage(session, { mode: "record_default", entityId: "tickets.ticket",
    recordId: record, definitionId, formFactor }) : null;
  const view = selected ? defaultView : await readActiveCustomerPage(session, { definitionId, request, formFactor });
  if (!view) notFound();
  const surfaces: Record<string, ReactNode> = {};
  for (const component of view.model.sections.flatMap(section => section.components)) if (component.type === "surface"
    && component.surface?.id === "tickets.ticket.progress_form" && component.surface.version === 1) {
    const form = await withFieldRuntimeAuthority(session, async authority => {
      const assertions = { definitionId, formFactor, componentId: component.id,
        expectedVersionId: view.versionId, expectedDefinitionRevision: view.definitionRevision };
      const prepared = defaultView
        ? await prepareVisibleRecordDefaultSurfaceInTransaction(authority, { ...assertions, mode: defaultView.mode,
          entityId: defaultView.entityId, recordId: defaultView.recordId, expectedProfileFingerprint: defaultView.profileFingerprint,
          expectedNativeRevision: defaultView.nativeRevision })
        : await prepareVisiblePageSurfaceInTransaction(authority, { ...assertions, request });
      if (prepared.ownerModuleId !== "tickets" || prepared.surface.id !== "tickets.ticket.progress_form" || prepared.anchor.nativeRevision === undefined)
        throw new Error("The ticket form is unavailable.");
      const expectedUpdatedAt = prepared.anchor.revision.slice(prepared.anchor.revision.indexOf("@") + 1);
      return loadTicketProgressFormInTransaction(prepared.authority, { recordId: prepared.anchor.recordId,
        expectedRevision: prepared.anchor.nativeRevision, expectedUpdatedAt });
    });
    surfaces[component.id] = <TicketProgressForm {...form}/>;
  }
  const back = selected && record ? `/tickets/${encodeURIComponent(record)}` : "/home";
  return <div className="mx-auto max-w-7xl space-y-6"><Link href={back} className="text-sm text-blue-700">{selected ? "Back to full ticket" : "Back to your business"}</Link>
    <header><p className="text-xs font-medium text-slate-500">{session.organisationName}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{view.name}</h1></header>
    <PublishedBusinessScreen key={`${view.versionId}:${record ?? "list"}:${formFactor}:${defaultView?.profileFingerprint ?? "active"}`} initial={view} request={request} surfaces={surfaces}/></div>;
}
