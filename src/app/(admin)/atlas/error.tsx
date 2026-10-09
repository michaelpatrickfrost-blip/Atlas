"use client";

import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { useEffect } from "react";
import { safePath } from "@/core/guardian/report";

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const isForbidden = error.message.startsWith("FORBIDDEN");
  const isUnauthenticated = error.message === "UNAUTHENTICATED";
  useEffect(() => {
    if (isForbidden || isUnauthenticated) return;
    const code = error.digest && /^[A-Za-z0-9_-]{1,60}$/.test(error.digest) ? `Digest:${error.digest}` : "RenderError";
    void fetch("/api/guardian/telemetry", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "PAGE_ERROR", path: safePath(location.pathname), code }), keepalive: true }).catch(() => {});
  }, [error.digest, isForbidden, isUnauthenticated]);

  if (isUnauthenticated) {
    return <div><EmptyState title="Your session has expired." description="Sign in again to continue." /><div className="text-center"><Link href="/atlas/login" className="text-sm text-blue-700">Sign in</Link></div></div>;
  }

  return (
    <div><EmptyState
      title={isForbidden ? "You don't have permission to view this." : "Something went wrong."}
      description={isForbidden ? "Ask an administrator for access if you think this is a mistake." : "Your records are still on the server. Open the page again from the Admin menu."}
    /><div className="mt-4 flex justify-center gap-4">{!isForbidden && <button type="button" onClick={retry} className="rounded-xl bg-slate-900 px-5 py-3 text-sm text-white">Try again</button>}<Link href="/atlas" className="rounded-xl border px-5 py-3 text-sm">Back to Companies</Link></div></div>
  );
}
