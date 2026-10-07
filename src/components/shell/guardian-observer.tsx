"use client";
import { useEffect } from "react";
import { safePath } from "@/core/guardian/report";

export function GuardianObserver() {
  useEffect(() => {
    const sent = new Set<string>();
    function report(kind: string, code: string) {
      const path = safePath(location.pathname);
      const key = `${kind}:${path}:${code}`;
      if (sent.has(key) || sent.size >= 20) return;
      sent.add(key);
      void fetch("/api/guardian/telemetry", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, code, path }), keepalive: true }).catch(() => {});
    }
    const onError = (event: ErrorEvent) => report("BROWSER_ERROR", event.error instanceof Error && /^[A-Za-z]+Error$/.test(event.error.name) ? event.error.name : "ScriptError");
    const onRejection = () => report("UNHANDLED_REJECTION", "PromiseRejection");
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (link && ["", "#"].includes(link.getAttribute("href") ?? "") && !link.hasAttribute("role")) report("EMPTY_LINK", "EmptyDestination");
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    document.addEventListener("click", onClick, true);
    return () => { window.removeEventListener("error", onError); window.removeEventListener("unhandledrejection", onRejection); document.removeEventListener("click", onClick, true); };
  }, []);
  return null;
}
