"use client";
import { useState } from "react";
export function BriefCopy({ brief }: { brief: string }) {
  const [status, setStatus] = useState("");
  return <div><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(brief); setStatus("Copied"); } catch { setStatus("Use Download brief or select the text below."); } }} className="text-sm text-blue-700">Copy for AI</button><span role="status" className="ml-2 text-xs text-slate-500">{status}</span></div>;
}
