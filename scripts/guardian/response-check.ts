/** Classify rendered responses without storing their business content. */
export function responseOutcome(status: number, html: string): "failed" | "restricted" | "unavailable" | "http-render-pass" {
  if (status !== 200 || /Something went wrong\.|NEXT_HTTP_ERROR_FALLBACK;[45]\d\d|Application error: a server-side exception/.test(html)) return "failed";
  if (/You (?:don&#x27;t|don't) have permission|This app is (?:not enabled|disabled)|not included in your company account|Ask your workspace administrator to enable this app in Manage apps\./.test(html)) return "restricted";
  if (/data-guardian-state="record-(?:deleted|unavailable)"/.test(html)) return "unavailable";
  return "http-render-pass";
}
