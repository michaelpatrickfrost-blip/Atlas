"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { PLATFORM_LIMITS, withHashtags } from "@/core/social/publish";
import { requireMarketing } from "./queries";
import { publishDueSocialPosts } from "./social-scheduler";

const text = (form: FormData, name: string, max = 300) => String(form.get(name) ?? "").trim().slice(0, max);
const EDITABLE = ["DRAFT", "SCHEDULED", "FAILED", "PARTIAL"];

/** A date and time typed in UK local time, as the instant it means. */
function ukTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const shown = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess));
  const part = (type: string) => Number(shown.find((entry) => entry.type === type)?.value);
  const offset = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour") % 24, part("minute")) - guess;
  return new Date(guess - offset);
}

async function manage() {
  const session = await requireSession();
  assertCapability(session, "marketing.campaign.manage");
  await requireMarketing(session);
  return session;
}
const refresh = () => revalidatePath("/marketing/social");

/** Save a social post as a draft, schedule it, or publish it now, to the chosen accounts. */
export async function saveSocialPost(form: FormData) {
  const session = await manage(), organisationId = session.organisationId;
  const id = text(form, "id", 60), mode = text(form, "mode", 10) || "draft";
  const caption = String(form.get("caption") ?? "").trim().slice(0, 5000);
  if (!caption) throw new Error("Write the post.");
  const linkUrl = text(form, "linkUrl", 500);
  if (linkUrl && !/^https?:\/\/\S+$/i.test(linkUrl)) throw new Error("The link must start with http:// or https://.");
  const mediaUrls = String(form.get("mediaUrls") ?? "").split(/\s+/).map((value) => value.trim()).filter(Boolean).slice(0, 4);
  if (mediaUrls.some((url) => !/^https:\/\/\S+$/i.test(url))) throw new Error("Each picture must be a public https:// link to the image.");
  const hashtags = [...new Set(text(form, "hashtags", 500).split(/[\s,]+/).map((tag) => tag.replace(/^#/, "").trim()).filter(Boolean))].slice(0, 30);
  const accountIds = [...new Set(form.getAll("accountIds").map(String))];
  const accounts = accountIds.length ? await db.socialAccount.findMany({ where: { organisationId, id: { in: accountIds }, active: true }, select: { id: true, platform: true, label: true } }) : [];
  if (accounts.length !== accountIds.length) throw new Error("One of the chosen accounts is no longer connected.");
  if (mode !== "draft" && !accounts.length) throw new Error("Choose at least one account to post to.");
  const full = withHashtags(caption, hashtags);
  for (const account of accounts) {
    const limit = PLATFORM_LIMITS[account.platform];
    if (limit && full.length > limit) throw new Error(`${account.label}: the post is ${full.length} characters and the limit is ${limit}. Shorten it or untick that account.`);
    if (account.platform === "instagram" && !mediaUrls.length) throw new Error("Instagram needs a picture. Add an image link or untick Instagram.");
  }
  let scheduledAt: Date | null = null;
  if (mode === "schedule") {
    scheduledAt = ukTime(text(form, "scheduledAt", 20));
    if (!scheduledAt) throw new Error("Choose the date and time to post.");
    if (scheduledAt.getTime() < Date.now() - 60_000) throw new Error("That time has passed. Choose a later time, or post now.");
  }
  if (mode === "now") scheduledAt = new Date();
  const status = mode === "draft" ? "DRAFT" : "SCHEDULED";
  const data = { caption, linkUrl: linkUrl || null, mediaUrls, hashtags, status, scheduledAt, lastError: null, publishedAt: null };
  const targets = accounts.map((account) => ({ organisationId, platform: account.platform, accountId: account.id, publishMode: "api", status: "PENDING" }));
  const postId = await db.$transaction(async (tx) => {
    if (id) {
      const existing = await tx.marketingSocialPost.findFirst({ where: { id, organisationId }, select: { status: true } });
      if (!existing) throw new Error("This post no longer exists.");
      if (!EDITABLE.includes(existing.status)) throw new Error("This post has already been published and cannot be changed.");
      await tx.marketingSocialPost.update({ where: { id }, data });
      await tx.marketingSocialPostTarget.deleteMany({ where: { postId: id, organisationId, status: { not: "PUBLISHED" } } });
      const kept = await tx.marketingSocialPostTarget.findMany({ where: { postId: id, organisationId }, select: { platform: true } });
      const fresh = targets.filter((target) => !kept.some((row) => row.platform === target.platform));
      if (fresh.length) await tx.marketingSocialPostTarget.createMany({ data: fresh.map((target) => ({ ...target, postId: id })) });
      return id;
    }
    const post = await tx.marketingSocialPost.create({ data: { ...data, organisationId, createdBy: session.userId } });
    if (targets.length) await tx.marketingSocialPostTarget.createMany({ data: targets.map((target) => ({ ...target, postId: post.id })) });
    return post.id;
  });
  await writeAudit({ organisationId, actorUserId: session.userId, action: mode === "now" ? "marketing.social.published" : mode === "schedule" ? "marketing.social.scheduled" : "marketing.social.drafted", entityType: "MarketingSocialPost", entityId: postId, after: { accounts: accounts.map((account) => account.label), scheduledAt } });
  if (mode === "now") {
    await publishDueSocialPosts(10);
    refresh();
    const result = await db.marketingSocialPost.findFirst({ where: { id: postId }, select: { status: true, targets: { where: { status: "FAILED" }, select: { platform: true, lastError: true } } } });
    if (result?.targets.length) throw new Error(`Not everything was published. ${result.targets.map((target) => `${target.platform}: ${target.lastError}`).join(" · ")}`);
  }
  refresh();
}

export async function deleteSocialPost(form: FormData) {
  const session = await manage(), id = text(form, "id", 60);
  const post = await db.marketingSocialPost.findFirst({ where: { id, organisationId: session.organisationId }, select: { status: true } });
  if (!post) throw new Error("This post no longer exists.");
  if (post.status === "PUBLISHING") throw new Error("This post is being published right now. Try again in a minute.");
  await db.marketingSocialPost.delete({ where: { id } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "marketing.social.deleted", entityType: "MarketingSocialPost", entityId: id });
  refresh();
}

/** Try the accounts that failed again, now. */
export async function retrySocialPost(form: FormData) {
  const session = await manage(), id = text(form, "id", 60), organisationId = session.organisationId;
  const post = await db.marketingSocialPost.findFirst({ where: { id, organisationId }, select: { status: true } });
  if (!post || !["FAILED", "PARTIAL"].includes(post.status)) throw new Error("Nothing on this post needs retrying.");
  await db.$transaction([
    db.marketingSocialPostTarget.updateMany({ where: { postId: id, organisationId, status: { in: ["FAILED", "SKIPPED"] } }, data: { status: "PENDING", lastError: null } }),
    db.marketingSocialPost.update({ where: { id }, data: { status: "SCHEDULED", scheduledAt: new Date(), lastError: null } }),
  ]);
  await publishDueSocialPosts(10);
  refresh();
}
