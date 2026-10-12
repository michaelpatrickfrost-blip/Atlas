"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { TicketRecordSurface } from "@/components/service-work/ticket-record-panels";
import { PageRenderer } from "@/components/studio/page-renderer";
import { EmbeddedBusinessView } from "@/modules/analytics/components/embedded-business-view";
import type { PageDisplayModel } from "@/core/studio/pages/render-model";
import type { PageReadRequest, PageQueryOutput } from "@/core/studio/pages/owner-contract";
import { loadBusinessScreen, loadRecordBusinessScreen, executeBusinessScreenButton, openBusinessScreenRecord } from "../actions";

type View = { definitionId: string; definitionRevision: number; versionId: string; name: string; model: PageDisplayModel;
  mode?: "record_default"; entityId?: string; recordId?: string; profileFingerprint?: string; nativeRevision?: number };
export function PublishedBusinessScreen({ initial, request, surfaces = {} }: { initial: View; request: PageReadRequest; surfaces?: Record<string, ReactNode> }) {
  const router = useRouter();
  const [view, setView] = useState(initial), [busy, setBusy] = useState(false), [feedback, setFeedback] = useState("");
  const [cursors, setCursors] = useState<Record<string, PageQueryOutput["nextCursor"]>>({});
  const epoch = useRef(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const resize = () => {
      const formFactor = innerWidth < 640 ? "phone" : innerWidth < 1024 ? "tablet" : "desktop";
      if (formFactor === view.model.formFactor) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        // Device-specific owning forms are Server Components. Re-read the route
        // so only currently visible forms load their protected values/receipts.
        const query = new URLSearchParams({ size: formFactor });
        if (request.kind === "record") query.set("record", request.recordId);
        if (view.mode === "record_default") query.set("mode", "record_default");
        router.replace(`/screens/${encodeURIComponent(view.definitionId)}?${query}`, { scroll: false });
      }, 120);
    };
    resize(); addEventListener("resize", resize); return () => { clearTimeout(timer); removeEventListener("resize", resize); };
  }, [view.definitionId, view.model.formFactor, view.mode, request, router]);
  const next = async (componentId: string, cursor: NonNullable<PageQueryOutput["nextCursor"]>) => {
    if (busy) return;
    setBusy(true); setFeedback(""); const updated = { ...cursors, [componentId]: cursor }, generation = ++epoch.current;
    try { const loaded = view.mode === "record_default"
      ? await loadRecordBusinessScreen({ mode: view.mode, entityId: view.entityId, recordId: view.recordId, definitionId: view.definitionId,
        formFactor: view.model.formFactor, cursors: updated, expectedVersionId: view.versionId, expectedDefinitionRevision: view.definitionRevision,
        expectedProfileFingerprint: view.profileFingerprint, expectedNativeRevision: view.nativeRevision })
      : await loadBusinessScreen({ definitionId: view.definitionId, request, formFactor: view.model.formFactor, cursors: updated });
      if (generation === epoch.current) { setView(loaded); setCursors(updated); }
    } catch { setFeedback("The next records could not be loaded. Your current screen is kept."); }
    finally { setBusy(false); }
  };
  const action = async (componentId: string) => {
    if (busy) return;
    const component = view.model.sections.flatMap(section => section.components).find(component => component.id === componentId);
    if (!component || component.type !== "action" || (component.confirm && !window.confirm(`Continue with ${component.label || "this action"}?`))) return;
    setBusy(true); setFeedback("");
    try { const result = await executeBusinessScreenButton({ definitionId: view.definitionId,
      ...(view.mode === "record_default" ? { mode: view.mode, entityId: view.entityId, recordId: view.recordId,
        expectedProfileFingerprint: view.profileFingerprint, expectedNativeRevision: view.nativeRevision } : { request }),
      formFactor: view.model.formFactor, cursors, componentId, expectedVersionId: view.versionId, expectedDefinitionRevision: view.definitionRevision });
      if (typeof result === "object" && result !== null && "kind" in result && result.kind === "navigation" && "href" in result
        && typeof result.href === "string" && /^\/api\/orders\/[^/]+\/pdf\?preview=1$/.test(result.href)) location.assign(result.href);
      else throw new Error("Invalid app response");
    } catch { setFeedback("This action could not be completed. Refresh the screen and check your access before trying again."); }
    finally { setBusy(false); }
  };
  const openRecord = async (componentId: string, selectedRecordId: string) => {
    if (busy) return;
    setBusy(true); setFeedback("");
    try { const href = await openBusinessScreenRecord({ definitionId: view.definitionId, request, formFactor: view.model.formFactor,
      cursors, componentId, selectedRecordId, expectedVersionId: view.versionId, expectedDefinitionRevision: view.definitionRevision });
      router.push(href);
    } catch { setFeedback("This record could not be opened. Refresh the list and check your access."); }
    finally { setBusy(false); }
  };
  return <div aria-busy={busy}>{feedback && <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{feedback}</p>}
    <PageRenderer model={view.model} interaction="live" onNext={next} onAction={action} onRecordSelect={openRecord}
      renderAnalyticsView={component => <EmbeddedBusinessView output={component.output}/>} renderSurface={component =>
      (view.versionId === initial.versionId && view.definitionRevision === initial.definitionRevision
        && view.model.formFactor === initial.model.formFactor && view.mode === initial.mode
        && view.profileFingerprint === initial.profileFingerprint && view.nativeRevision === initial.nativeRevision ? surfaces[component.id] : undefined)
      ?? (component.surface ? <TicketRecordSurface surface={component.surface} outputs={component.outputs}/> : null)
      ?? <p className="text-sm text-slate-500">This app form has changed. Refresh to load its current version.</p>}/></div>;
}
