import type { Metadata } from "next";
import { db } from "@/core/db/client";
import { loadPublicContract } from "@/core/contracts/actions";
import { loadBrand } from "@/core/email/render";
import { formatMoney } from "@/core/shared/money";
import { SignForm } from "./form";

export const metadata: Metadata = { title: "Review and sign", robots: { index: false, follow: false } };
const long = (value: Date) => value.toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "long", timeStyle: "short" });
const day = (value: Date) => value.toLocaleDateString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "long", year: "numeric" });
type Brand = Awaited<ReturnType<typeof loadBrand>>;

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const contract = await loadPublicContract(token);
  if (!contract) return <Shell brand={null}><h1 style={{ fontSize: 20, fontWeight: 700 }}>This link is no longer valid</h1><p style={{ marginTop: 8, color: "#52525b" }}>It may have been replaced by a newer one. Ask the person who sent it for a fresh link.</p></Shell>;
  const brand = await loadBrand(contract.organisationId);
  const quote = contract.kind === "QUOTE";
  const expired = !!contract.expiresAt && contract.expiresAt < new Date();
  const open = ["SENT", "VIEWED"].includes(contract.status) && !expired;
  const lines = quote && contract.quoteId ? await db.quote.findFirst({ where: { id: contract.quoteId, organisationId: contract.organisationId }, select: { reference: true, netAmount: true, taxAmount: true, totalAmount: true, totalCurrency: true, expiryDate: true, lines: { where: { optional: false }, orderBy: { lineNumber: "asc" }, select: { id: true, type: true, description: true, quantity: true, unitOfMeasure: true, unitAmount: true, netAmount: true } } } }) : null;
  const file = contract.fileName ? `/sign/${token}/file` : null;
  return <Shell brand={brand}>
    <p style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#71717a" }}>{quote ? "Quotation for your approval" : "Document for your signature"} · {contract.reference}</p>
    <h1 style={{ marginTop: 6, fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{contract.title}</h1>
    {contract.message && <p style={{ marginTop: 14, whiteSpace: "pre-wrap", fontSize: 15, color: "#3f3f46", lineHeight: 1.6 }}>{contract.message}</p>}
    {open && contract.expiresAt && <p style={{ marginTop: 14, display: "inline-block", background: "#fef3c7", color: "#92400e", borderRadius: 999, padding: "5px 12px", fontSize: 13 }}>Open for you to {quote ? "approve" : "sign"} until {day(contract.expiresAt)}</p>}

    {lines && <section style={{ marginTop: 24, border: "1px solid #e4e4e7", borderRadius: 14, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr style={{ background: "#fafafa", textAlign: "left", fontSize: 12, color: "#71717a" }}><th style={{ padding: "10px 14px" }}>Item</th><th style={{ padding: "10px 14px", textAlign: "right" }}>Qty</th><th style={{ padding: "10px 14px", textAlign: "right" }}>Price</th><th style={{ padding: "10px 14px", textAlign: "right" }}>Amount</th></tr></thead>
        <tbody>{lines.lines.map((line) => ["SECTION", "NOTE"].includes(line.type) ? <tr key={line.id} style={{ borderTop: "1px solid #f4f4f5" }}><td colSpan={4} style={{ padding: "10px 14px", fontWeight: line.type === "SECTION" ? 700 : 400, fontStyle: line.type === "NOTE" ? "italic" : "normal", color: "#3f3f46" }}>{line.description}</td></tr> : <tr key={line.id} style={{ borderTop: "1px solid #f4f4f5" }}><td style={{ padding: "10px 14px" }}>{line.description}</td><td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>{line.quantity.toLocaleString("en-GB")} {line.unitOfMeasure}</td><td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>{formatMoney(line.unitAmount, lines.totalCurrency)}</td><td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap", fontWeight: 600 }}>{formatMoney(line.netAmount, lines.totalCurrency)}</td></tr>)}</tbody>
      </table>
      <div style={{ borderTop: "1px solid #e4e4e7", padding: "14px", display: "flex", justifyContent: "flex-end" }}><dl style={{ width: 260, fontSize: 14, margin: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#52525b" }}><dt>Net</dt><dd style={{ margin: 0 }}>{formatMoney(lines.netAmount, lines.totalCurrency)}</dd></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#52525b" }}><dt>VAT</dt><dd style={{ margin: 0 }}>{formatMoney(lines.taxAmount, lines.totalCurrency)}</dd></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", marginTop: 6, borderTop: "1px solid #e4e4e7", fontSize: 18, fontWeight: 700 }}><dt>Total</dt><dd style={{ margin: 0 }}>{formatMoney(lines.totalAmount, lines.totalCurrency)}</dd></div>
      </dl></div>
      {lines.expiryDate && <p style={{ padding: "0 14px 14px", fontSize: 12, color: "#71717a", textAlign: "right" }}>Prices valid until {day(lines.expiryDate)}.</p>}
    </section>}

    {file && <section style={{ marginTop: 24 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}><h2 style={{ fontSize: 15, fontWeight: 700 }}>{quote ? "The full quotation" : "The document"}</h2><span style={{ display: "flex", gap: 14, fontSize: 13 }}><a href={file} target="_blank" rel="noopener" style={{ color: brand.accent, fontWeight: 600 }}>Open in a new tab</a><a href={`${file}?download=1`} style={{ color: brand.accent, fontWeight: 600 }}>Download PDF</a></span></div>
      <object data={`${file}#toolbar=0&view=FitH`} type="application/pdf" style={{ marginTop: 10, width: "100%", height: "70vh", minHeight: 420, border: "1px solid #e4e4e7", borderRadius: 14, background: "#fafafa" }}><p style={{ padding: 20, fontSize: 14 }}>Your browser cannot show the PDF here. <a href={file} target="_blank" rel="noopener" style={{ color: brand.accent, fontWeight: 600 }}>Open the PDF</a> to read it, then come back to {quote ? "approve" : "sign"}.</p></object>
    </section>}
    {contract.bodyHtml && <section style={{ marginTop: 24, border: "1px solid #e4e4e7", borderRadius: 14, padding: 22, fontSize: 15, lineHeight: 1.65, color: "#27272a" }} dangerouslySetInnerHTML={{ __html: contract.bodyHtml }} />}

    <section style={{ marginTop: 28, borderTop: "1px solid #e4e4e7", paddingTop: 24 }}>
      {contract.status === "SIGNED" ? <div style={{ border: "1px solid #a7f3d0", background: "#ecfdf5", borderRadius: 14, padding: 20 }}><p style={{ color: "#047857", fontWeight: 700, fontSize: 17 }}>{quote ? "Approved" : "Signed"}</p><p style={{ marginTop: 6, fontSize: 14, color: "#065f46" }}>By {contract.signerName} on {contract.signedAt ? long(contract.signedAt) : ""}. This page is your record.</p></div>
        : contract.status === "DECLINED" ? <p style={{ fontWeight: 600, color: "#b91c1c" }}>This {quote ? "quotation" : "document"} was declined.{contract.declinedReason && contract.declinedReason !== "No reason given" ? ` “${contract.declinedReason}”` : ""}</p>
        : expired ? <p style={{ fontWeight: 600, color: "#b91c1c" }}>This link closed on {contract.expiresAt ? day(contract.expiresAt) : ""}. Ask {brand.name} to send it again.</p>
        : <><h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>{quote ? "Approve this quotation" : "Sign this document"}</h2><SignForm token={token} accent={brand.accent} quote={quote} company={brand.name} /></>}
    </section>
    <p style={{ marginTop: 26, fontSize: 11, color: "#a1a1aa", wordBreak: "break-all" }}>Document fingerprint (SHA-256): {contract.contentHash}</p>
  </Shell>;
}

function Shell({ brand, children }: { brand: Brand | null; children: React.ReactNode }) {
  const accent = brand?.accent ?? "#1d1d1f";
  return <main style={{ minHeight: "100vh", background: "#f4f4f5", padding: "24px 16px 48px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", color: "#18181b" }}>
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 4px 18px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- the company's own logo, stored as a data URL. */}
        {brand?.logoUrl ? <img src={brand.logoUrl} alt={brand.name} style={{ maxHeight: 48, maxWidth: 200, objectFit: "contain" }} /> : <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, borderRadius: 10, background: accent, color: "#fff", fontWeight: 700, fontSize: 18 }}>{(brand?.name ?? "A").charAt(0)}</span>}
        <span style={{ fontWeight: 700, fontSize: 18 }}>{brand?.name ?? ""}</span>
      </header>
      <div style={{ background: "#fff", borderRadius: 18, padding: "32px 28px", borderTop: `4px solid ${accent}`, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>{children}</div>
      {brand && <footer style={{ marginTop: 18, textAlign: "center", fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{brand.letterhead.length ? <p>{brand.letterhead.join(" · ")}</p> : null}<p>{brand.footer}</p></footer>}
    </div>
  </main>;
}
