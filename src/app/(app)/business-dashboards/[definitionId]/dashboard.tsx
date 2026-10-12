"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessViewCharts } from "@/modules/analytics/components/business-view-charts";
import type { PublishedBusinessView } from "@/modules/analytics/services/business-view-contract";
import { refreshPublishedBusinessDashboard } from "../actions";

export function PublishedBusinessDashboard({ initial }: { initial: PublishedBusinessView }) {
  const [view, setView] = useState<PublishedBusinessView | null>(initial), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const running = useRef(false), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const refresh = useCallback(async () => {
    if (running.current) return;
    running.current = true; setBusy(true); setError("");
    try {
      const updated = await refreshPublishedBusinessDashboard({ definitionId: initial.definitionId,
        expectedHead: { versionId: initial.view.versionId, definitionRevision: initial.definitionRevision, checksum: initial.view.checksum } });
      if (updated.definitionId !== initial.definitionId || updated.definitionRevision !== initial.definitionRevision
        || updated.view.versionId !== initial.view.versionId || updated.view.checksum !== initial.view.checksum)
        throw new Error("The published design changed.");
      if (alive.current) setView(updated);
    } catch {
      if (alive.current) { setView(null); setError("This dashboard could not refresh. Reload the page to check the latest published design and your current access."); }
    } finally { running.current = false; if (alive.current) setBusy(false); }
  }, [initial.definitionId, initial.definitionRevision, initial.view.versionId, initial.view.checksum]);
  useEffect(() => {
    if (!initial.content.refreshSeconds) return;
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, initial.content.refreshSeconds * 1000);
    return () => clearInterval(timer);
  }, [initial.content.refreshSeconds, refresh]);
  return <div aria-busy={busy} className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Current authorised business figures · Published version {initial.view.version}</p>
      <Button onClick={() => void refresh()} disabled={busy}><RefreshCw size={15}/>{busy ? "Refreshing…" : "Refresh figures"}</Button></div>
    {error && <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{error}</p>}
    {view && <BusinessViewCharts view={view}/>}
  </div>;
}
