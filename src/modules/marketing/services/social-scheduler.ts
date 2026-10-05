import { db } from "@/core/db/client";
import { decryptSecret } from "@/core/security/secrets";
import { publishTo } from "@/core/social/publish";

/** Publishes due scheduled social posts (Marketing's Growth scheduler). Each target publishes independently;
 *  one failing platform never blocks the others for the same post. */
export async function publishDueSocialPosts(limit = 10) {
  const due = await db.marketingSocialPost.findMany({ where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } }, take: limit, include: { targets: { where: { status: "PENDING" } } } });
  let processed = 0;
  for (const post of due) {
    const claimed = await db.marketingSocialPost.updateMany({ where: { id: post.id, status: "SCHEDULED" }, data: { status: "PUBLISHING" } });
    if (!claimed.count) continue;
    processed += 1;
    let anyFailed = false;
    let anyOk = false;
    for (const target of post.targets) {
      try {
        const account = target.accountId ? await db.socialAccount.findFirst({ where: { id: target.accountId, organisationId: post.organisationId } }) : null;
        if (!account) { await db.marketingSocialPostTarget.update({ where: { id: target.id }, data: { status: "SKIPPED", lastError: "No connected account for this platform." } }); continue; }
        const creds = JSON.parse(decryptSecret(account.credentialsEnc));
        const text = target.captionOverride || post.caption;
        const result = await publishTo(target.platform, creds, { text, link: post.linkUrl ?? undefined, media: post.mediaUrls });
        await db.marketingSocialPostTarget.update({ where: { id: target.id }, data: { status: "PUBLISHED", externalId: result.externalId, permalink: result.permalink, publishedAt: new Date() } });
        anyOk = true;
      } catch (error) {
        anyFailed = true;
        await db.marketingSocialPostTarget.update({ where: { id: target.id }, data: { status: "FAILED", lastError: error instanceof Error ? error.message.slice(0, 500) : "Publish failed." } });
      }
    }
    const already = await db.marketingSocialPostTarget.count({ where: { postId: post.id, status: "PUBLISHED" } });
    if (already) anyOk = true;
    await db.marketingSocialPost.update({ where: { id: post.id }, data: { status: anyFailed && !anyOk ? "FAILED" : anyFailed ? "PARTIAL" : "PUBLISHED", publishedAt: new Date(), lastError: anyFailed ? "One or more platforms failed; see targets." : null } });
  }
  return processed;
}
