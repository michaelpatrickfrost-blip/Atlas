import type { EmailBlock } from "./blocks";

export type MergeContext = Record<string, unknown>;

export function esc(value: unknown) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function lookup(ctx: MergeContext, path: string): string {
  let cur: unknown = ctx;
  for (const part of path.split(".")) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[part];
    else return "";
  }
  return cur == null ? "" : String(cur);
}

/** Replaces {{a.b}}. Unknown fields become empty, never the raw token, so customers never see template syntax. */
export function merge(text: string, ctx: MergeContext, escape = false) {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => (escape ? esc(lookup(ctx, path)) : lookup(ctx, path)));
}

export type Brand = { name: string; accent: string; logoUrl: string | null; letterhead: string[]; footer: string };

function paragraphs(text: string) {
  return text.split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px;line-height:1.6">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
}

export type RenderOptions = { unsubscribeUrl?: string; signatureHtml?: string; openPixelUrl?: string; preheader?: string };

/** Branded HTML (table layout, inline styles, safe in mail clients) plus a plain-text twin. */
export function renderEmail(blocks: EmailBlock[], brand: Brand, ctx: MergeContext, options: RenderOptions = {}) {
  const m = (t: string) => merge(t, ctx, true);
  const parts: string[] = [];
  const plain: string[] = [];
  const csatBase = lookup(ctx, "csat.url");
  for (const block of blocks) {
    switch (block.type) {
      case "heading": parts.push(`<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#111">${m(block.text)}</h1>`); plain.push(merge(block.text, ctx).toUpperCase()); break;
      case "text": parts.push(paragraphs(merge(block.text, ctx))); plain.push(merge(block.text, ctx)); break;
      case "image": if (/^https?:\/\//i.test(block.url)) parts.push(`<img src="${esc(merge(block.url, ctx))}" alt="${esc(block.alt)}" style="max-width:100%;border-radius:8px;margin:0 0 14px">`); break;
      case "button": {
        const url = merge(block.url, ctx);
        if (/^https?:\/\//i.test(url)) parts.push(`<p style="margin:8px 0 18px"><a href="${esc(url)}" style="background:${brand.accent};color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block">${m(block.label)}</a></p>`);
        plain.push(`${merge(block.label, ctx)}: ${url}`);
        break;
      }
      case "details": {
        const rows = block.rows.map(([k, v]) => [merge(k, ctx), merge(v, ctx)]).filter(([, v]) => v);
        if (rows.length) parts.push(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border-top:1px solid #e5e5e5">${rows.map(([k, v]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e5e5e5;color:#666;width:40%">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #e5e5e5;color:#111;font-weight:600">${esc(v)}</td></tr>`).join("")}</table>`);
        plain.push(rows.map(([k, v]) => `${k}: ${v}`).join("\n"));
        break;
      }
      case "columns":
        parts.push(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px"><tr><td valign="top" width="50%" style="padding-right:10px">${paragraphs(merge(block.left, ctx))}</td><td valign="top" width="50%" style="padding-left:10px">${paragraphs(merge(block.right, ctx))}</td></tr></table>`);
        plain.push(merge(block.left, ctx), merge(block.right, ctx));
        break;
      case "csat":
        if (csatBase) {
          const labels = ["Poor", "Fair", "Okay", "Good", "Great"];
          const sep = csatBase.includes("?") ? "&" : "?";
          parts.push(`<p style="margin:0 0 8px;font-weight:600">${m(block.question)}</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px"><tr>${[1, 2, 3, 4, 5].map((n) => `<td style="padding-right:8px"><a href="${esc(csatBase)}${sep}score=${n}" style="display:inline-block;width:44px;height:44px;line-height:44px;text-align:center;border:1px solid ${brand.accent};border-radius:8px;color:${brand.accent};text-decoration:none;font-weight:700" title="${labels[n - 1]}">${n}</a></td>`).join("")}</tr></table><p style="margin:0 0 14px;color:#888;font-size:12px">1 = poor, 5 = great</p>`);
          plain.push(`${merge(block.question, ctx)}\nRate us 1 to 5: ${csatBase}`);
        }
        break;
      case "divider": parts.push('<hr style="border:0;border-top:1px solid #e5e5e5;margin:18px 0">'); break;
      case "spacer": parts.push('<div style="height:18px"></div>'); break;
    }
  }
  const header = brand.logoUrl
    ? `<img src="${esc(brand.logoUrl)}" alt="${esc(brand.name)}" style="max-height:44px;max-width:220px">`
    : `<span style="font-size:20px;font-weight:700;color:${brand.accent}">${esc(brand.name)}</span>`;
  const footerLines = [...brand.letterhead.slice(0, 3), brand.footer].filter(Boolean);
  const unsubscribe = options.unsubscribeUrl ? `<p style="margin:10px 0 0"><a href="${esc(options.unsubscribeUrl)}" style="color:#888">Unsubscribe from marketing emails</a></p>` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#222">${options.preheader ? `<div style="display:none;max-height:0;overflow:hidden">${esc(options.preheader)}</div>` : ""}<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden"><tr><td style="padding:22px 28px;border-bottom:3px solid ${brand.accent}">${header}</td></tr><tr><td style="padding:28px;font-size:15px">${parts.join("")}${options.signatureHtml ?? ""}</td></tr><tr><td style="padding:18px 28px;background:#fafafa;color:#888;font-size:12px;line-height:1.5">${footerLines.map(esc).join("<br>")}${unsubscribe}</td></tr></table></td></tr></table>${options.openPixelUrl ? `<img src="${esc(options.openPixelUrl)}" width="1" height="1" alt="" style="display:none">` : ""}</body></html>`;
  const text = [...plain, "", ...footerLines, options.unsubscribeUrl ? `Unsubscribe: ${options.unsubscribeUrl}` : ""].filter((l) => l !== undefined).join("\n\n").trim();
  return { html, text };
}
