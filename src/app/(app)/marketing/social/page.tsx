import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { ActionForm } from "@/components/ui/action-form";
import { CreateDialog } from "@/components/ui/create-dialog";
import { StatusPill } from "@/components/ui/status-pill";
import { SOCIAL_PLATFORMS } from "@/core/email/presets";
import { API_PLATFORMS, PLATFORM_LIMITS } from "@/core/social/publish";
import { requireMarketing } from "@/modules/marketing/services/queries";
import { deleteSocialPost, retrySocialPost } from "@/modules/marketing/services/social-actions";
import { SocialComposer, type SocialDraft } from "@/modules/marketing/components/social-composer";

const panel = "rounded-2xl border border-slate-200 bg-white p-5";
const small = "rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900";
const UK = "Europe/London";
const ukDay = (value: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: UK }).format(value);
const ukClock = (value: Date) => value.toLocaleTimeString("en-GB", { timeZone: UK, hour: "2-digit", minute: "2-digit" });
const ukInput = (value: Date) => `${ukDay(value)}T${ukClock(value)}`;
const ukWhen = (value: Date) => value.toLocaleString("en-GB", { timeZone: UK, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const tone = (status: string) => (status === "PUBLISHED" ? "success" : status === "FAILED" ? "danger" : status === "PARTIAL" || status === "SCHEDULED" || status === "PUBLISHING" ? "warning" : "neutral");
const word = (status: string) => ({ DRAFT: "Draft", SCHEDULED: "Scheduled", PUBLISHING: "Publishing", PUBLISHED: "Published", PARTIAL: "Partly published", FAILED: "Failed", PENDING: "Waiting", SKIPPED: "Skipped" }[status] ?? status);
const chip: Record<string, string> = { DRAFT: "border-slate-200 bg-slate-50 text-slate-600", SCHEDULED: "border-blue-200 bg-blue-50 text-blue-800", PUBLISHING: "border-blue-200 bg-blue-50 text-blue-800", PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-800", PARTIAL: "border-amber-200 bg-amber-50 text-amber-800", FAILED: "border-red-200 bg-red-50 text-red-700" };
function start(offset: number) { const now = new Date(); const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7) + offset * 7)); return monday; }
function nextHour() { const next = new Date(Date.now() + 3_600_000); next.setMinutes(0, 0, 0); return next; }

export default async function SocialScheduler({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const session = await requireSession();
  assertCapability(session, "marketing.campaign.read");
  await requireMarketing(session);
  const organisationId = session.organisationId, manage = can(session, "marketing.campaign.manage");
  const offset = Math.max(-52, Math.min(52, Number((await searchParams).week) || 0)), monday = start(offset), end = new Date(monday.getTime() + 7 * 86_400_000);
  const [connected, posts] = await Promise.all([
    db.socialAccount.findMany({ where: { organisationId, active: true, platform: { in: API_PLATFORMS } }, select: { id: true, label: true, platform: true, status: true }, orderBy: { createdAt: "asc" } }),
    db.marketingSocialPost.findMany({ where: { organisationId }, include: { targets: true }, orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }], take: 200 }),
  ]);
  const label = (platform: string) => SOCIAL_PLATFORMS.find((entry) => entry.key === platform)?.label.replace(/ \(.*\)$/, "").replace(/ page$| channel$/, "") ?? platform;
  const accounts = connected.map((account) => ({ id: account.id, label: account.label, platform: account.platform, platformLabel: label(account.platform), limit: PLATFORM_LIMITS[account.platform] ?? 5000 }));
  const days = Array.from({ length: 7 }, (_, index) => new Date(monday.getTime() + index * 86_400_000));
  const at = (post: (typeof posts)[number]) => post.publishedAt ?? post.scheduledAt;
  const inWeek = posts.filter((post) => { const when = at(post); return when && when >= new Date(monday.getTime() - 86_400_000) && when < new Date(end.getTime() + 86_400_000); });
  const upcoming = posts.filter((post) => post.status === "SCHEDULED").sort((a, b) => (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0));
  const drafts = posts.filter((post) => post.status === "DRAFT"), trouble = posts.filter((post) => ["FAILED", "PARTIAL"].includes(post.status)), done = posts.filter((post) => post.status === "PUBLISHED").slice(0, 15);
  const defaultTime = ukInput(nextHour()), today = ukDay(new Date());
  const draftOf = (post: (typeof posts)[number]): SocialDraft => ({ id: post.id, caption: post.caption, linkUrl: post.linkUrl ?? "", mediaUrls: post.mediaUrls, hashtags: post.hashtags, accountIds: post.targets.map((target) => target.accountId).filter((id): id is string => !!id), scheduledAt: post.scheduledAt && post.status !== "FAILED" ? ukInput(post.scheduledAt) : "" });
  const row = (post: (typeof posts)[number]) => <li key={post.id} className="py-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1"><p className="line-clamp-3 whitespace-pre-wrap text-sm text-slate-800">{post.caption}</p><p className="mt-1 text-xs text-slate-500">{post.status === "DRAFT" ? "Not scheduled" : at(post) ? ukWhen(at(post)!) : ""}{post.mediaUrls.length ? ` · ${post.mediaUrls.length} picture${post.mediaUrls.length === 1 ? "" : "s"}` : ""}{post.linkUrl ? " · link" : ""}</p></div>
      <StatusPill label={word(post.status)} tone={tone(post.status)} />
    </div>
    <div className="mt-2 flex flex-wrap items-center gap-2">{post.targets.map((target) => <span key={target.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs" title={target.lastError ?? ""}><span className={`size-1.5 rounded-full ${target.status === "PUBLISHED" ? "bg-emerald-500" : target.status === "FAILED" || target.status === "SKIPPED" ? "bg-red-500" : "bg-slate-300"}`} />{label(target.platform)}{target.permalink ? <a href={target.permalink} target="_blank" rel="noopener noreferrer" className="text-blue-600">View</a> : target.status !== "PENDING" && target.status !== "PUBLISHED" ? <span className="text-red-600">{word(target.status)}</span> : null}</span>)}{!post.targets.length && <span className="text-xs text-slate-400">No accounts chosen</span>}</div>
    {post.targets.filter((target) => target.lastError).map((target) => <p key={target.id} className="mt-1 text-xs text-red-600">{label(target.platform)}: {target.lastError}</p>)}
    {manage && <div className="mt-2 flex flex-wrap items-center gap-1">
      {["DRAFT", "SCHEDULED", "FAILED", "PARTIAL"].includes(post.status) && <CreateDialog label="Edit" title="Edit post" triggerClassName={small}><SocialComposer accounts={accounts} draft={draftOf(post)} defaultTime={defaultTime} /></CreateDialog>}
      {["FAILED", "PARTIAL"].includes(post.status) && <ActionForm action={retrySocialPost}><input type="hidden" name="id" value={post.id} /><button className={small}>Try again now</button></ActionForm>}
      {post.status !== "PUBLISHING" && <ActionForm action={deleteSocialPost}><input type="hidden" name="id" value={post.id} /><button className={small}>{post.status === "PUBLISHED" ? "Remove from list" : "Delete"}</button></ActionForm>}
    </div>}
  </li>;
  const list = (title: string, hint: string, rows: typeof posts) => rows.length ? <section className={panel}><h3 className="text-sm font-semibold">{title} <span className="ml-1 font-normal text-slate-400">{rows.length}</span></h3><p className="mt-1 text-xs text-slate-500">{hint}</p><ul className="mt-2 divide-y divide-slate-100">{rows.map(row)}</ul></section> : null;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-2xl font-semibold tracking-tight">Social scheduler</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Write a post once, send it to Facebook, Instagram and Threads, now or at a time you choose. Atlas publishes scheduled posts within a minute of their time.</p></div>
      {manage && !!accounts.length && <CreateDialog label="New post" title="New post"><SocialComposer accounts={accounts} defaultTime={defaultTime} /></CreateDialog>}
    </div>

    <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold">Connected accounts</h3>{can(session, "core.it.manage") && <Link href="/settings/it/social" className="text-xs font-medium text-blue-600">{accounts.length ? "Manage accounts →" : "Connect Facebook, Instagram or Threads →"}</Link>}</div>
      {accounts.length ? <div className="mt-3 flex flex-wrap gap-2">{connected.map((account) => <span key={account.id} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"><span className={`size-2 rounded-full ${account.status === "OK" ? "bg-emerald-500" : account.status === "ERROR" ? "bg-red-500" : "bg-amber-400"}`} />{account.label}<span className="text-xs text-slate-400">{label(account.platform)}</span></span>)}</div> : <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">No accounts are connected, so nothing can be posted yet. A company administrator connects them under Settings → Company → Social media accounts.</p>}
    </section>

    <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold">Week of {monday.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</h3><div className="flex gap-1 text-xs font-medium"><Link href={`/marketing/social?week=${offset - 1}`} className={small}>← Earlier</Link>{offset !== 0 && <Link href="/marketing/social" className={small}>This week</Link>}<Link href={`/marketing/social?week=${offset + 1}`} className={small}>Later →</Link></div></div>
      <div className="mt-4 grid gap-2 md:grid-cols-7">{days.map((day) => { const key = day.toISOString().slice(0, 10), items = inWeek.filter((post) => ukDay(at(post)!) === key).sort((a, b) => at(a)!.getTime() - at(b)!.getTime()); return <div key={key} className={`min-h-32 rounded-xl border p-2 ${key === today ? "border-blue-300 bg-blue-50/40" : "border-slate-200 bg-slate-50/60"}`}>
        <p className="px-1 text-xs font-semibold text-slate-600">{day.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", timeZone: "UTC" })}</p>
        <div className="mt-2 space-y-1.5">{items.map((post) => <div key={post.id} className={`rounded-lg border px-2 py-1.5 text-xs ${chip[post.status] ?? chip.DRAFT}`} title={post.caption}><p className="font-semibold tabular-nums">{ukClock(at(post)!)}</p><p className="line-clamp-2">{post.caption}</p><p className="mt-0.5 opacity-70">{post.targets.map((target) => label(target.platform)).join(" · ")}</p></div>)}{!items.length && <p className="px-1 text-xs text-slate-300">—</p>}</div>
      </div>; })}</div>
    </section>

    {list("Needs attention", "A platform refused these. The reason is shown; fix it and try again.", trouble)}
    {list("Scheduled", "Waiting for their time.", upcoming)}
    {list("Drafts", "Not scheduled yet.", drafts)}
    {list("Published", "The last fifteen.", done)}
    {!posts.length && <p className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">No posts yet. {accounts.length ? "Write your first one with New post." : "Connect an account first."}</p>}
  </div>;
}
