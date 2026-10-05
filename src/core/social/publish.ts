/**
 * Social publishing through official, free APIs only (no scraping, no paid gateway).
 * Ported from the HelloPort/Blocwrite scheduler and rebranded for Atlas; credentials come from the
 * encrypted SocialAccount record, never from local files.
 */
export type Creds = Record<string, string>;
export type PublishResult = { externalId: string; permalink: string };

export const PLATFORM_LIMITS: Record<string, number> = { threads: 500, bluesky: 300, mastodon: 500, telegram: 1024, discord: 2000, facebook: 5000, linkedin: 3000, x: 280, instagram: 2200, tiktok: 2200 };
export const API_PLATFORMS = ["facebook", "instagram", "threads", "bluesky", "mastodon", "telegram", "discord"];

export function withHashtags(caption: string, hashtags: string[]) {
  const base = caption.trim();
  const tags = hashtags.map((t) => t.replace(/^#/, "").replace(/\s+/g, "")).filter(Boolean).map((t) => `#${t}`);
  const missing = tags.filter((t) => !base.toLowerCase().includes(t.toLowerCase()));
  return missing.length ? `${base}${base ? "\n\n" : ""}${missing.join(" ")}` : base;
}

async function json(res: Response) { return (await res.json().catch(() => ({}))) as Record<string, unknown>; }
const bytesOf = new TextEncoder();

async function blueskySession(c: Creds) {
  const res = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: c.handle, password: c.appPassword }) });
  const data = await json(res);
  if (!res.ok || !data.did || !data.accessJwt) throw new Error(String(data.message ?? "Bluesky sign-in failed. Check the handle and app password."));
  return { did: String(data.did), jwt: String(data.accessJwt), handle: String(data.handle ?? c.handle) };
}

async function postBluesky(c: Creds, text: string, media: string[]): Promise<PublishResult> {
  const s = await blueskySession(c);
  const body = text.slice(0, 300);
  const facets: unknown[] = [];
  for (const m of body.matchAll(/https?:\/\/[^\s<>"]+/gi)) {
    const uri = m[0].replace(/[),.;!?]+$/, "");
    const start = bytesOf.encode(body.slice(0, m.index)).length;
    facets.push({ index: { byteStart: start, byteEnd: start + bytesOf.encode(uri).length }, features: [{ $type: "app.bsky.richtext.facet#link", uri }] });
  }
  const images: unknown[] = [];
  for (const url of media.slice(0, 4)) {
    const img = await fetch(url);
    if (!img.ok) continue;
    const buf = Buffer.from(await img.arrayBuffer());
    if (buf.length > 950_000) continue;
    const up = await fetch("https://bsky.social/xrpc/com.atproto.repo.uploadBlob", { method: "POST", headers: { Authorization: `Bearer ${s.jwt}`, "Content-Type": img.headers.get("content-type") ?? "image/jpeg" }, body: new Uint8Array(buf) });
    const blob = (await json(up)).blob;
    if (blob) images.push({ alt: "", image: blob });
  }
  const record: Record<string, unknown> = { $type: "app.bsky.feed.post", text: body || " ", createdAt: new Date().toISOString() };
  if (facets.length) record.facets = facets;
  if (images.length) record.embed = { $type: "app.bsky.embed.images", images };
  const res = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", { method: "POST", headers: { Authorization: `Bearer ${s.jwt}`, "Content-Type": "application/json" }, body: JSON.stringify({ repo: s.did, collection: "app.bsky.feed.post", record }) });
  const data = await json(res);
  if (!res.ok || !data.uri) throw new Error(String(data.message ?? "Bluesky rejected the post."));
  return { externalId: String(data.uri), permalink: `https://bsky.app/profile/${s.handle}/post/${String(data.uri).split("/").pop()}` };
}

async function postMastodon(c: Creds, text: string): Promise<PublishResult> {
  const base = c.instance.replace(/\/$/, "");
  const res = await fetch(`${base}/api/v1/statuses`, { method: "POST", headers: { Authorization: `Bearer ${c.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: text.slice(0, 500), visibility: "public" }) });
  const data = await json(res);
  if (!res.ok || !data.id) throw new Error(String(data.error ?? "Mastodon rejected the post."));
  return { externalId: String(data.id), permalink: String(data.url ?? base) };
}

async function postTelegram(c: Creds, text: string, media: string[]): Promise<PublishResult> {
  const method = media[0] ? "sendPhoto" : "sendMessage";
  const body = media[0] ? { chat_id: c.chatId, photo: media[0], caption: text.slice(0, 1024) } : { chat_id: c.chatId, text: text.slice(0, 4096) };
  const res = await fetch(`https://api.telegram.org/bot${c.botToken}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await json(res);
  if (!res.ok || !data.ok) throw new Error(String(data.description ?? "Telegram rejected the post."));
  const msg = data.result as { message_id: number; chat?: { username?: string } };
  return { externalId: String(msg.message_id), permalink: msg.chat?.username ? `https://t.me/${msg.chat.username}/${msg.message_id}` : "" };
}

async function postDiscord(c: Creds, text: string, media: string[]): Promise<PublishResult> {
  const res = await fetch(`${c.webhookUrl}?wait=true`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: text.slice(0, 2000), embeds: media[0] ? [{ image: { url: media[0] } }] : undefined }) });
  const data = await json(res);
  if (!res.ok) throw new Error(String(data.message ?? "Discord rejected the post."));
  return { externalId: String(data.id ?? ""), permalink: "" };
}

async function postFacebook(c: Creds, text: string, link?: string): Promise<PublishResult> {
  const params = new URLSearchParams({ message: text.slice(0, 5000), access_token: c.pageToken });
  if (link) params.set("link", link);
  const res = await fetch(`https://graph.facebook.com/v19.0/${c.pageId}/feed`, { method: "POST", body: params });
  const data = await json(res);
  if (!res.ok || !data.id) throw new Error(String((data.error as { message?: string } | undefined)?.message ?? "Facebook rejected the post."));
  return { externalId: String(data.id), permalink: `https://facebook.com/${String(data.id)}` };
}

const metaError = (data: Record<string, unknown>, fallback: string) => String((data.error as { message?: string } | undefined)?.message ?? fallback);

/** A Facebook post with a picture goes to the page's photos; otherwise to its feed. */
async function postFacebookPhoto(c: Creds, text: string, image: string): Promise<PublishResult> {
  const res = await fetch(`https://graph.facebook.com/v19.0/${c.pageId}/photos`, { method: "POST", body: new URLSearchParams({ url: image, caption: text.slice(0, 5000), access_token: c.pageToken }) });
  const data = await json(res);
  if (!res.ok || !data.id) throw new Error(metaError(data, "Facebook rejected the photo."));
  return { externalId: String(data.post_id ?? data.id), permalink: `https://facebook.com/${String(data.post_id ?? data.id)}` };
}

/** Instagram publishes in two steps: create a media container from a public image, then publish it. */
async function postInstagram(c: Creds, text: string, media: string[]): Promise<PublishResult> {
  if (!media[0]) throw new Error("Instagram needs a picture. Add an image link to the post.");
  const base = `https://graph.facebook.com/v19.0/${c.igUserId}`;
  const created = await json(await fetch(`${base}/media`, { method: "POST", body: new URLSearchParams({ image_url: media[0], caption: text.slice(0, 2200), access_token: c.accessToken }) }));
  if (!created.id) throw new Error(metaError(created, "Instagram could not read that image. It must be a public JPEG link."));
  const published = await json(await fetch(`${base}/media_publish`, { method: "POST", body: new URLSearchParams({ creation_id: String(created.id), access_token: c.accessToken }) }));
  if (!published.id) throw new Error(metaError(published, "Instagram rejected the post."));
  const link = await json(await fetch(`https://graph.facebook.com/v19.0/${published.id}?fields=permalink&access_token=${encodeURIComponent(c.accessToken)}`));
  return { externalId: String(published.id), permalink: String(link.permalink ?? "") };
}

/** Threads also publishes in two steps. Text only, or text with one picture. */
async function postThreads(c: Creds, text: string, media: string[], link?: string): Promise<PublishResult> {
  const base = `https://graph.threads.net/v1.0/${c.userId}`;
  const body = new URLSearchParams({ media_type: media[0] ? "IMAGE" : "TEXT", text: (link && !text.includes(link) ? `${text}\n\n${link}` : text).slice(0, 500), access_token: c.accessToken });
  if (media[0]) body.set("image_url", media[0]);
  const created = await json(await fetch(`${base}/threads`, { method: "POST", body }));
  if (!created.id) throw new Error(metaError(created, "Threads rejected the post."));
  const published = await json(await fetch(`${base}/threads_publish`, { method: "POST", body: new URLSearchParams({ creation_id: String(created.id), access_token: c.accessToken }) }));
  if (!published.id) throw new Error(metaError(published, "Threads could not publish the post."));
  const info = await json(await fetch(`https://graph.threads.net/v1.0/${published.id}?fields=permalink&access_token=${encodeURIComponent(c.accessToken)}`));
  return { externalId: String(published.id), permalink: String(info.permalink ?? "") };
}

export async function publishTo(platform: string, creds: Creds, post: { text: string; link?: string; media: string[] }): Promise<PublishResult> {
  switch (platform) {
    case "bluesky": return postBluesky(creds, post.text, post.media);
    case "mastodon": return postMastodon(creds, post.text);
    case "telegram": return postTelegram(creds, post.text, post.media);
    case "discord": return postDiscord(creds, post.text, post.media);
    case "facebook": return post.media[0] ? postFacebookPhoto(creds, post.link && !post.text.includes(post.link) ? `${post.text}\n\n${post.link}` : post.text, post.media[0]) : postFacebook(creds, post.text, post.link);
    case "instagram": return postInstagram(creds, post.link && !post.text.includes(post.link) ? `${post.text}\n\n${post.link}` : post.text, post.media);
    case "threads": return postThreads(creds, post.text, post.media, post.link);
    default: throw new Error("This platform is prepared here and published by hand (copy and open).");
  }
}

export async function verifySocial(platform: string, creds: Creds): Promise<{ ok: boolean; error?: string }> {
  try {
    if (platform === "bluesky") await blueskySession(creds);
    else if (platform === "mastodon") { const r = await fetch(`${creds.instance.replace(/\/$/, "")}/api/v1/accounts/verify_credentials`, { headers: { Authorization: `Bearer ${creds.accessToken}` } }); if (!r.ok) throw new Error("Mastodon rejected the token."); }
    else if (platform === "telegram") { const d = await json(await fetch(`https://api.telegram.org/bot${creds.botToken}/getMe`)); if (!d.ok) throw new Error("Telegram rejected the bot token."); }
    else if (platform === "discord") { const r = await fetch(creds.webhookUrl); if (!r.ok) throw new Error("Discord does not recognise that webhook."); }
    else if (platform === "instagram") { const d = await json(await fetch(`https://graph.facebook.com/v19.0/${creds.igUserId}?fields=username&access_token=${encodeURIComponent(creds.accessToken)}`)); if (!d.username) throw new Error(metaError(d, "Instagram rejected the account ID or token.")); }
    else if (platform === "threads") { const d = await json(await fetch(`https://graph.threads.net/v1.0/${creds.userId}?fields=username&access_token=${encodeURIComponent(creds.accessToken)}`)); if (!d.username) throw new Error(metaError(d, "Threads rejected the user ID or token.")); }
    else if (platform === "facebook") { const d = await json(await fetch(`https://graph.facebook.com/v19.0/${creds.pageId}?fields=name&access_token=${encodeURIComponent(creds.pageToken)}`)); if (!d.name) throw new Error("Facebook rejected the page token."); }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Connection failed." };
  }
}

export function intentUrl(platform: string, text: string, link?: string) {
  const t = encodeURIComponent(text);
  if (platform === "x") return `https://twitter.com/intent/tweet?text=${t}${link ? `&url=${encodeURIComponent(link)}` : ""}`;
  if (platform === "linkedin") return `https://www.linkedin.com/feed/?shareActive=true&text=${t}`;
  return "";
}
