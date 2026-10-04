import { PDFDocument, StandardFonts, rgb, PageSizes, type PDFFont, type PDFImage } from "pdf-lib";
import { formatMoney } from "@/core/shared/money";
import type { DocumentBrand } from "@/core/documents/company-brand";
import { formatKg, formatVolume, PROFORMA_STATEMENT } from "../domain/invoice-templates";

export async function buildProformaPdf(input: {
  reference: string; orderReference: string; organisationName: string; customerName: string; customerCode: string;
  createdAt: Date; currency: string; customerPo: string | null; paymentTerms: string | null; snapshot: Record<string, unknown>;
  brand?: DocumentBrand | null;
}) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const brand = input.brand ?? null;
  const displayName = brand?.displayName || input.organisationName;
  const ink = rgb(0.09, 0.14, 0.23), muted = rgb(0.4, 0.45, 0.53);
  const accent = brand ? rgb(brand.accent[0], brand.accent[1], brand.accent[2]) : rgb(0.11, 0.11, 0.12);
  const safe = (value: string, face: PDFFont = font) => [...value].map((character) => { try { face.encodeText(character); return character; } catch { return "?"; } }).join("");
  let logo: PDFImage | null = null;
  if (brand?.logo) { try { logo = brand.logo.type === "png" ? await pdf.embedPng(brand.logo.bytes) : await pdf.embedJpg(brand.logo.bytes); } catch { logo = null; } }
  let page = pdf.addPage(PageSizes.A4);
  let y = 760;
  const text = (value: string, x: number, at: number, size = 10, strong = false) => page.drawText(safe(value).slice(0, 140), { x, y: at, size, font: strong ? bold : font, color: strong ? ink : muted });
  const seller = input.snapshot.seller as { name?: string; address?: string; vat?: string; eori?: string } | undefined;
  const header = input.snapshot.header as { incoterms?: string; namedPlace?: string; portOfLoading?: string; portOfDischarge?: string; packageCount?: number; packageType?: string; marks?: string; reasonForExport?: string; buyerEori?: string; buyerVat?: string } | undefined;
  const lines = Array.isArray(input.snapshot.lines) ? input.snapshot.lines as Array<Record<string, unknown>> : [];
  const totals = input.snapshot.totals as { netGrams?: number | null; grossGrams?: number | null; volumeMl?: number | null } | undefined;
  pdf.setTitle(`Proforma ${input.reference}`);
  pdf.setAuthor(displayName);
  pdf.setCreator(displayName);
  if (logo) {
    const scale = Math.min(120 / logo.width, 42 / logo.height);
    page.drawImage(logo, { x: 42, y: 800 - logo.height * scale, width: logo.width * scale, height: logo.height * scale });
  }
  page.drawText(safe(displayName, bold), { x: logo ? 176 : 42, y: 786, size: 14, font: bold, color: ink });
  if (brand?.tagline) { text(brand.tagline, logo ? 176 : 42, 770, 8); }
  let letter = 748;
  for (const row of brand?.letterhead ?? []) { text(row, 42, letter, 8); letter -= 11; }
  page.drawRectangle({ x: 42, y: letter - 6, width: 511, height: 2, color: accent });
  y = letter - 28;
  text("PROFORMA INVOICE", 42, y, 16, true); y -= 18;
  text(PROFORMA_STATEMENT, 42, y, 8); y -= 28;
  text(`${input.reference} · Sale ${input.orderReference}`, 42, y, 11, true); y -= 16;
  text(`${input.customerName} · ${input.customerCode}`, 42, y, 10, true); y -= 16;
  text(`Issued ${input.createdAt.toLocaleDateString("en-GB")} · ${input.currency}${input.customerPo ? ` · PO ${input.customerPo}` : ""}`, 42, y, 9); y -= 22;
  const address = (label: string, value: unknown) => {
    const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
    text(label, 42, y, 8, true); y -= 12;
    text([row.line1, row.line2, row.city, row.postcode, row.country].filter((part) => typeof part === "string" && part).join(", ") || "Not specified", 42, y, 9); y -= 16;
  };
  address("Invoice address", input.snapshot.invoiceAddress);
  address("Consignee", input.snapshot.deliveryAddress);
  if (input.snapshot.notifyAddress) address("Notify party", input.snapshot.notifyAddress);
  text(`Exporter ${seller?.name ?? displayName}${seller?.eori ? ` · EORI ${seller.eori}` : ""}${seller?.vat ? ` · VAT ${seller.vat}` : ""}`, 42, y, 9); y -= 12;
  if (seller?.address) { text(seller.address, 42, y, 8); y -= 14; }
  if (header?.buyerEori || header?.buyerVat) { text(`Buyer ${[header.buyerEori && `EORI ${header.buyerEori}`, header.buyerVat && `VAT ${header.buyerVat}`].filter(Boolean).join(" · ")}`, 42, y, 9); y -= 14; }
  text([header?.incoterms && `Incoterms ${header.incoterms}${header.namedPlace ? ` ${header.namedPlace}` : ""}`, input.snapshot.destinationCountry && `Destination ${input.snapshot.destinationCountry}`, header?.portOfLoading && `Loading ${header.portOfLoading}`, header?.portOfDischarge && `Discharge ${header.portOfDischarge}`].filter(Boolean).join(" · "), 42, y, 9); y -= 14;
  if (header?.packageCount) { text(`${header.packageCount} ${header.packageType ?? "packages"}`, 42, y, 9); y -= 14; }
  if (header?.marks) { text(`Marks ${header.marks}`, 42, y, 8); y -= 14; }
  if (header?.reasonForExport) { text(`Reason for export ${header.reasonForExport}`, 42, y, 8); y -= 16; }
  text("Goods", 42, y, 9, true); y -= 16;
  for (const line of lines) {
    if (y < 90) { page = pdf.addPage(PageSizes.A4); y = 780; }
    text(`${line.quantity} × ${line.description}${line.code ? ` (${line.code})` : ""} · ${formatMoney(Number(line.netAmount ?? 0), input.currency)}`, 42, y, 9, true); y -= 12;
    text([line.originCountry && `Origin ${line.originCountry}`, line.commodityCode && `Commodity ${line.commodityCode}`, `Net ${formatKg(line.netGrams as number | null)}`, `Gross ${formatKg(line.grossGrams as number | null)}`, `Volume ${formatVolume(line.volumeMl as number | null)}`].filter(Boolean).join(" · "), 42, y, 8); y -= 16;
  }
  if (y < 80) { page = pdf.addPage(PageSizes.A4); y = 780; }
  text(`Total net ${formatKg(totals?.netGrams ?? null)} · gross ${formatKg(totals?.grossGrams ?? null)} · volume ${formatVolume(totals?.volumeMl ?? null)}`, 42, y, 10, true); y -= 16;
  text(input.paymentTerms ? `Payment terms ${input.paymentTerms}` : "Payment terms to be agreed", 42, y, 9); y -= 16;
  if (typeof input.snapshot.footer === "string" && input.snapshot.footer) { text(input.snapshot.footer, 42, y, 8); y -= 14; }
  const closing = (title: string, body: string) => {
    if (y < 80) { page = pdf.addPage(PageSizes.A4); y = 780; }
    text(title, 42, y, 9, true); y -= 12;
    const words = safe(body).split(/\s+/);
    let current = "";
    const rows: string[] = [];
    for (const word of words) {
      if (font.widthOfTextAtSize(`${current} ${word}`.trim(), 8) > 511 && current) { rows.push(current); current = ""; }
      current += (current ? " " : "") + word;
    }
    if (current) rows.push(current);
    for (const row of rows) {
      if (y < 48) { page = pdf.addPage(PageSizes.A4); y = 780; }
      text(row, 42, y, 8); y -= 11;
    }
  };
  if (brand?.paymentDetails) closing("How to pay", brand.paymentDetails);
  if (brand?.terms) closing("Terms", brand.terms);
  const pages = pdf.getPages();
  pages.forEach((sheet, index) => {
    const marker = `${index + 1} / ${pages.length}`;
    sheet.drawText(safe(brand?.footer || displayName, font).slice(0, 110), { x: 42, y: 28, size: 8, font, color: muted });
    sheet.drawText(marker, { x: 553 - font.widthOfTextAtSize(marker, 8), y: 28, size: 8, font, color: muted });
  });
  return pdf.save();
}
