export const EMAIL_PRESETS: Array<{ key: string; label: string; smtpHost: string; smtpPort: number; smtpSecurity: "STARTTLS" | "SSL"; imapHost: string; note: string; imapPort?: number }> = [
  { key: "microsoft", label: "Microsoft 365 / Outlook", smtpHost: "smtp.office365.com", smtpPort: 587, smtpSecurity: "STARTTLS", imapHost: "outlook.office365.com", note: "SMTP AUTH must be enabled for the mailbox. Use an app password if MFA is on." },
  { key: "google", label: "Google Workspace / Gmail", smtpHost: "smtp.gmail.com", smtpPort: 587, smtpSecurity: "STARTTLS", imapHost: "imap.gmail.com", note: "Use an app password (2-step verification must be on)." },
  { key: "ionos", label: "IONOS", smtpHost: "smtp.ionos.co.uk", smtpPort: 587, smtpSecurity: "STARTTLS", imapHost: "imap.ionos.co.uk", note: "Use the full mailbox address as the username." },
  { key: "zoho", label: "Zoho Mail", smtpHost: "smtp.zoho.eu", smtpPort: 465, smtpSecurity: "SSL", imapHost: "imap.zoho.eu", note: "" },
  { key: "custom", label: "Other (enter details)", smtpHost: "", smtpPort: 587, smtpSecurity: "STARTTLS", imapHost: "", note: "Ask your IT provider for the SMTP server, port and security." },
];

export const SOCIAL_PLATFORMS: Array<{ key: string; label: string; api: boolean; fields: Array<{ name: string; label: string; secret?: boolean; hint?: string }>; note: string }> = [
  { key: "bluesky", label: "Bluesky", api: true, fields: [{ name: "handle", label: "Handle", hint: "name.bsky.social" }, { name: "appPassword", label: "App password", secret: true }], note: "Create an app password in Bluesky settings." },
  { key: "mastodon", label: "Mastodon", api: true, fields: [{ name: "instance", label: "Server", hint: "https://mastodon.social" }, { name: "accessToken", label: "Access token", secret: true }], note: "Create an application with the write:statuses scope." },
  { key: "telegram", label: "Telegram channel", api: true, fields: [{ name: "botToken", label: "Bot token", secret: true }, { name: "chatId", label: "Channel", hint: "@yourchannel" }], note: "Add the bot as a channel administrator." },
  { key: "discord", label: "Discord channel", api: true, fields: [{ name: "webhookUrl", label: "Webhook URL", secret: true }], note: "Channel settings, Integrations, Webhooks." },
  { key: "facebook", label: "Facebook page", api: true, fields: [{ name: "pageId", label: "Page ID" }, { name: "pageToken", label: "Page access token", secret: true }], note: "A long-lived page token with pages_manage_posts and pages_read_engagement, from your Meta developer app." },
  { key: "linkedin", label: "LinkedIn", api: false, fields: [], note: "Posts are prepared here and opened in LinkedIn to publish (copy-and-open)." },
  { key: "x", label: "X", api: false, fields: [], note: "Posts are prepared here and opened in X to publish (copy-and-open)." },
  { key: "instagram", label: "Instagram (business or creator)", api: true, fields: [{ name: "igUserId", label: "Instagram account ID", hint: "17841400000000000" }, { name: "accessToken", label: "Access token", secret: true }], note: "The Instagram account must be a business or creator account linked to a Facebook page. Use a long-lived token with instagram_content_publish. Every post needs a picture." },
  { key: "threads", label: "Threads", api: true, fields: [{ name: "userId", label: "Threads user ID" }, { name: "accessToken", label: "Access token", secret: true }], note: "A long-lived Threads token with threads_content_publish, from your Meta developer app." },
  { key: "tiktok", label: "TikTok", api: false, fields: [], note: "Prepared here for copy-and-open." },
];
