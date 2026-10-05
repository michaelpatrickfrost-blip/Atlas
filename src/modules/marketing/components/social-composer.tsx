"use client";
import { useState } from "react";
import { ActionForm } from "@/components/ui/action-form";
import { saveSocialPost } from "../services/social-actions";

export type SocialAccountOption = { id: string; label: string; platform: string; platformLabel: string; limit: number };
export type SocialDraft = { id: string; caption: string; linkUrl: string; mediaUrls: string[]; hashtags: string[]; accountIds: string[]; scheduledAt: string };
const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";
const button = "rounded-xl px-4 py-2.5 text-sm font-medium";

/** Write once, choose the accounts, then post now, schedule or keep as a draft. */
export function SocialComposer({ accounts, draft, defaultTime }: { accounts: SocialAccountOption[]; draft?: SocialDraft; defaultTime: string }) {
  const [caption, setCaption] = useState(draft?.caption ?? ""), [tags, setTags] = useState(draft?.hashtags.join(" ") ?? ""), [media, setMedia] = useState(draft?.mediaUrls.join("\n") ?? "");
  const [chosen, setChosen] = useState<string[]>(draft?.accountIds ?? accounts.map((account) => account.id));
  const tagList = tags.split(/[\s,]+/).map((tag) => tag.replace(/^#/, "")).filter(Boolean);
  const missing = tagList.filter((tag) => !caption.toLowerCase().includes(`#${tag.toLowerCase()}`));
  const length = caption.trim().length + (missing.length ? 2 + missing.map((tag) => `#${tag}`).join(" ").length : 0);
  const picked = accounts.filter((account) => chosen.includes(account.id));
  const hasImage = media.trim().length > 0;
  const problems = [...picked.filter((account) => length > account.limit).map((account) => `${account.label} allows ${account.limit} characters; this is ${length}.`), ...(picked.some((account) => account.platform === "instagram") && !hasImage ? ["Instagram needs a picture."] : [])];
  const first = media.split(/\s+/).find((url) => /^https:\/\//i.test(url));
  return <ActionForm action={saveSocialPost}><div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
    <div className="space-y-4">
      {draft && <input type="hidden" name="id" value={draft.id} />}
      <fieldset><legend className="text-xs font-medium">Post to</legend>
        {accounts.length ? <div className="mt-2 flex flex-wrap gap-2">{accounts.map((account) => { const on = chosen.includes(account.id); return <label key={account.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${on ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600"}`}><input type="checkbox" name="accountIds" value={account.id} checked={on} onChange={(event) => setChosen((current) => event.target.checked ? [...current, account.id] : current.filter((id) => id !== account.id))} className="size-4" /><span><span className="font-medium">{account.label}</span><span className="ml-1 text-xs opacity-70">{account.platformLabel}</span></span></label>; })}</div> : <p className="mt-2 text-sm text-slate-500">No accounts connected yet.</p>}
      </fieldset>
      <label className="block text-xs font-medium">Post<textarea name="caption" required rows={7} maxLength={5000} value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="What do you want to say?" className={field} /><span className={`mt-1 block font-normal ${problems.length ? "text-red-600" : "text-slate-500"}`}>{length} characters{picked.length ? ` · shortest limit ${Math.min(...picked.map((account) => account.limit))}` : ""}</span></label>
      <label className="block text-xs font-medium">Hashtags<input name="hashtags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="drainage civils groundworks" className={field} /><span className="mt-1 block font-normal text-slate-500">Added to the end if they are not already in the post.</span></label>
      <label className="block text-xs font-medium">Link (optional)<input name="linkUrl" type="url" defaultValue={draft?.linkUrl} placeholder="https://" className={field} /></label>
      <label className="block text-xs font-medium">Pictures: one public image link per line<textarea name="mediaUrls" rows={2} value={media} onChange={(event) => setMedia(event.target.value)} placeholder="https://yourwebsite.co.uk/images/product.jpg" className={field} /><span className="mt-1 block font-normal text-slate-500">Instagram needs one. Facebook and Threads use the first.</span></label>
      {!!problems.length && <ul className="space-y-1 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{problems.map((problem) => <li key={problem}>{problem}</li>)}</ul>}
      <div className="rounded-2xl border border-slate-200 p-4">
        <label className="block text-xs font-medium">Schedule for (UK time)<input name="scheduledAt" type="datetime-local" defaultValue={draft?.scheduledAt || defaultTime} className={field} /></label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button name="mode" value="schedule" disabled={!!problems.length || !picked.length} className={`${button} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50`}>Schedule</button>
          <button name="mode" value="now" disabled={!!problems.length || !picked.length} className={`${button} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50`}>Post now</button>
          <button name="mode" value="draft" className={`${button} text-slate-500 hover:bg-slate-100`}>Save as draft</button>
        </div>
      </div>
    </div>
    <div>
      <p className="text-xs font-medium">Preview</p>
      <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs text-slate-400">{picked.map((account) => account.platformLabel).join(" · ") || "No account chosen"}</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-800">{caption || "Your post appears here."}{missing.length ? `\n\n${missing.map((tag) => `#${tag}`).join(" ")}` : ""}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- a remote picture the user pasted; previewed as-is. */}
        {first && <img src={first} alt="" className="mt-3 max-h-56 w-full rounded-xl object-cover" />}
      </div>
    </div>
  </div></ActionForm>;
}
