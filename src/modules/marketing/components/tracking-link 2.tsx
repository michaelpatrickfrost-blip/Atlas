"use client";
import { useState } from "react";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";
/** Builds a link that credits visits and leads to this campaign. */
export function TrackingLink({ campaign, channels }: { campaign: string; channels: string[] }) {
  const [url, setUrl] = useState(""), [source, setSource] = useState(channels[0] ?? "Email"), [content, setContent] = useState(""), [copied, setCopied] = useState(false);
  const slug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  let link = "";
  try { if (url.trim()) { const target = new URL(/^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`); target.searchParams.set("utm_source", slug(source)); target.searchParams.set("utm_medium", slug(source)); target.searchParams.set("utm_campaign", campaign); if (slug(content)) target.searchParams.set("utm_content", slug(content)); link = target.toString(); } } catch { link = ""; }
  return <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block text-xs font-medium">Page the link goes to<input value={url} onChange={(event) => { setUrl(event.target.value); setCopied(false); }} placeholder="yourwebsite.co.uk/offer" className={field} /></label>
      <label className="block text-xs font-medium">Where the link will be used<select value={source} onChange={(event) => { setSource(event.target.value); setCopied(false); }} className={field}>{(channels.length ? channels : ["Email", "Social", "Website"]).map((channel) => <option key={channel}>{channel}</option>)}</select></label>
      <label className="block text-xs font-medium">Which advert or post (optional)<input value={content} onChange={(event) => { setContent(event.target.value); setCopied(false); }} placeholder="launch email button" className={field} /></label>
    </div>
    {link ? <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3"><code className="min-w-0 flex-1 break-all text-xs">{link}</code><button type="button" onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); }} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white">{copied ? "Copied" : "Copy link"}</button></div> : <p className="text-sm text-slate-500">Enter the page address to get a tracked link for this campaign.</p>}
  </div>;
}
