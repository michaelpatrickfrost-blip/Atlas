import { PDFDocument, StandardFonts, rgb, PageSizes, type PDFFont, type PDFImage } from "pdf-lib";
import { formatMoney } from "@/core/shared/money";
import type { DocumentBrand } from "@/core/documents/company-brand";

export type QuotePdfData = {
  documentType?: "Quotation" | "Order acknowledgement" | "Tax invoice" | "Credit note" | "Debit note";
  requestedDeliveryDate?: Date | null;
  promisedDeliveryDate?: Date | null;
  dueDate?: Date | null;
  notes?: string | null;
  reference: string;
  organisationName: string;
  customerName: string;
  customerCode: string;
  status: string;
  createdAt: Date;
  expiryDate: Date | null;
  customerPoReference: string | null;
  paymentTerms: string | null;
  currency: string;
  invoiceAddress: unknown;
  deliveryAddress: unknown;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  overallDiscount?: number;
  vatLabel?: string;
  brand?: DocumentBrand | null;
  lines: { type?: string; optional?: boolean; description: string; code: string | null; quantity: number; unitAmount: number; discountPercent: number; netAmount: number; taxAmount: number; supplyNote?: string | null }[];
};

export async function buildQuotePdf(quote: QuotePdfData) {
  const documentType = quote.documentType ?? "Quotation";
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const brand = quote.brand ?? null;
  const displayName = brand?.displayName || quote.organisationName;
  pdf.setTitle(`${documentType} ${quote.reference}`);
  pdf.setAuthor(displayName);
  pdf.setCreator(displayName);
  pdf.setSubject(documentType);
  const ink = rgb(0.09, 0.14, 0.23);
  const muted = rgb(0.4, 0.45, 0.53);
  const accent = brand ? rgb(brand.accent[0], brand.accent[1], brand.accent[2]) : rgb(0.11, 0.11, 0.12);
  const line = rgb(0.88, 0.91, 0.95);
  const safe = (value: string, face: PDFFont) => [...value].map((character) => { try { face.encodeText(character); return character; } catch { return "?"; } }).join("");
  const wrap = (value: string, width: number, size: number, face = font) => {
    const lines: string[] = [];
    let current = "";
    for (const word of safe(value, face).split(/\s+/)) {
      if (face.widthOfTextAtSize(`${current} ${word}`.trim(), size) > width && current) { lines.push(current); current = ""; }
      if (face.widthOfTextAtSize(word, size) > width) {
        for (const character of word) {
          if (face.widthOfTextAtSize(current + character, size) > width) { lines.push(current); current = ""; }
          current += character;
        }
      } else current += (current ? " " : "") + word;
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  };
  let logo: PDFImage | null = null;
  if (brand?.logo) {
    try { logo = brand.logo.type === "png" ? await pdf.embedPng(brand.logo.bytes) : await pdf.embedJpg(brand.logo.bytes); } catch { logo = null; }
  }
  let page = pdf.addPage(PageSizes.A4);
  let y = 780;
  const text = (value: string, x: number, at: number, size = 10, strong = false, color = ink) => page.drawText(safe(value, strong ? bold : font), { x, y: at, size, font: strong ? bold : font, color });
  const right = (value: string, x: number, at: number, size = 10, strong = false) => text(value, x - (strong ? bold : font).widthOfTextAtSize(safe(value, strong ? bold : font), size), at, size, strong);
  const paintLogo = (top: number) => {
    if (!logo) return 0;
    const scale = Math.min(120 / logo.width, 42 / logo.height);
    const width = logo.width * scale;
    const height = logo.height * scale;
    page.drawImage(logo, { x: 42, y: top - height, width, height });
    return height;
  };
  const paintFull = () => {
    const logoHeight = paintLogo(800);
    const nameX = logo ? 176 : 42;
    text(displayName, nameX, 786, 16, true);
    if (brand?.tagline) text(brand.tagline, nameX, 770, 8, false, muted);
    let at = logo ? Math.min(756, 800 - logoHeight - 16) : 756;
    for (const row of brand?.letterhead ?? []) { text(row, 42, at, 8, false, muted); at -= 11; }
    page.drawRectangle({ x: 42, y: at - 4, width: 511, height: 2, color: accent });
    at -= 24;
    text(documentType.toUpperCase(), 42, at, 9, true, accent);
    right(`Issued ${quote.createdAt.toLocaleDateString("en-GB")}`, 553, at, 9);
    at -= 22;
    text(quote.reference, 42, at, 20, true);
    if (quote.expiryDate) right(`Valid until ${quote.expiryDate.toLocaleDateString("en-GB")}`, 553, at, 9);
    else if (quote.dueDate) right(`Due ${quote.dueDate.toLocaleDateString("en-GB")}`, 553, at, 9);
    at -= 16;
    text(`${quote.status} · ${quote.currency}`, 42, at, 9, false, muted);
    if (quote.customerPoReference) right(`PO ${quote.customerPoReference}`, 553, at, 9);
    return at - 28;
  };
  const paintCompact = () => {
    paintLogo(812);
    text(displayName, logo ? 176 : 42, 792, 11, true);
    right(quote.reference, 553, 792, 9, false);
    page.drawRectangle({ x: 42, y: 778, width: 511, height: 2, color: accent });
    return 756;
  };
  const tableHeader = () => {
    page.drawRectangle({ x: 42, y: y - 9, width: 511, height: 28, color: rgb(0.95, 0.97, 0.99) });
    text("PRODUCT / DESCRIPTION", 52, y, 8, true, muted);
    right("QTY", 352, y, 8, true);
    right("UNIT PRICE", 423, y, 8, true);
    right("DISC %", 473, y, 8, true);
    right("NET", 543, y, 8, true);
    y -= 36;
  };
  const address = (label: string, value: unknown, x: number, start: number) => {
    text(label, x, start, 8, true, accent);
    const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
    const content = [record.label, record.line1, record.line2, record.city, record.region, record.postcode, record.country].filter((part) => typeof part === "string" && part).join(", ");
    let at = start - 16;
    for (const row of wrap(content || "Not specified", 235, 9)) { text(row, x, at, 9); at -= 12; }
    return at;
  };
  const continuePage = () => { page = pdf.addPage(PageSizes.A4); y = paintCompact(); tableHeader(); };
  y = paintFull();
  text(quote.customerName, 42, y, 13, true);
  text(quote.customerCode, 42, y - 16, 9, false, muted);
  y = Math.min(address("INVOICE ADDRESS", quote.invoiceAddress, 42, y - 34), address("DELIVERY ADDRESS", quote.deliveryAddress, 313, y - 34)) - 18;
  tableHeader();
  for (const item of quote.lines) {
    if (["SECTION", "NOTE"].includes(item.type ?? "")) {
      const heading = wrap(item.description, 480, 10, item.type === "SECTION" ? bold : font);
      if (y - heading.length * 14 < 100) continuePage();
      for (const row of heading) { text(row, 52, y, 10, item.type === "SECTION"); y -= 14; }
      y -= 12;
      continue;
    }
    const rows = wrap((item.optional ? "OPTIONAL: " : "") + item.description, 260, 9);
    const noteRows = item.supplyNote ? wrap(item.supplyNote, 260, 8) : [];
    const height = Math.max(35, rows.length * 13 + 18 + (item.code ? 12 : 0) + noteRows.length * 11);
    if (y - height < 100) continuePage();
    let at = y;
    for (const row of rows) { text(row, 52, at, 9); at -= 13; }
    if (item.code) text(item.code, 52, at - 3, 8, false, muted);
    if (noteRows.length) {
      let noteAt = at - (item.code ? 16 : 3);
      for (const row of noteRows) { text(row, 52, noteAt, 8, false, muted); noteAt -= 11; }
    }
    const quantity = Number.isInteger(item.quantity) ? String(item.quantity) : String(Math.round(item.quantity * 1000) / 1000);
    right(quantity, 352, y, 9);
    right(formatMoney(item.unitAmount, quote.currency), 423, y, 9);
    right(item.discountPercent.toFixed(1), 473, y, 9);
    const net = (quote.overallDiscount ?? 0) > 0 && !item.optional ? Math.round(item.unitAmount * item.quantity * (1 - (item.discountPercent || 0) / 100)) : item.netAmount;
    right(formatMoney(net, quote.currency), 543, y, 9, true);
    page.drawLine({ start: { x: 42, y: y - height + 10 }, end: { x: 553, y: y - height + 10 }, thickness: 0.5, color: line });
    y -= height;
  }
  const ensure = (needed: number) => { if (y < needed) { page = pdf.addPage(PageSizes.A4); y = paintCompact(); } };
  if (quote.requestedDeliveryDate || quote.promisedDeliveryDate) {
    ensure(160);
    text(`Requested delivery: ${quote.requestedDeliveryDate?.toLocaleDateString("en-GB") ?? "To be agreed"} · Promised: ${quote.promisedDeliveryDate?.toLocaleDateString("en-GB") ?? "To be agreed"}`, 42, y, 9);
    y -= 22;
  }
  ensure(150);
  text("Payment terms", 42, y, 9, true);
  y -= 14;
  for (const row of wrap(quote.paymentTerms ?? "To be agreed", 240, 9)) { text(row, 42, y, 9, false, muted); y -= 12; }
  const totalsTop = y + 12;
  const vatLabel = quote.vatLabel ?? "VAT";
  const rows: string[][] = (quote.overallDiscount ?? 0) > 0
    ? [["Goods", formatMoney(quote.netAmount + (quote.overallDiscount ?? 0), quote.currency)], ["Overall discount", `-${formatMoney(quote.overallDiscount ?? 0, quote.currency)}`]]
    : [["Untaxed amount", formatMoney(quote.netAmount, quote.currency)]];
  rows.push([vatLabel, formatMoney(quote.taxAmount, quote.currency)]);
  rows.forEach((row, index) => { text(row[0], 350, totalsTop - index * 18, 10, false, muted); right(row[1], 543, totalsTop - index * 18, 10); });
  const lineY = totalsTop - rows.length * 18 - 4;
  page.drawLine({ start: { x: 350, y: lineY }, end: { x: 543, y: lineY }, thickness: 1, color: line });
  text("Total", 350, lineY - 20, 13, true);
  right(formatMoney(quote.totalAmount, quote.currency), 543, lineY - 20, 14, true);
  y = Math.min(y, lineY - 36);
  const paragraph = (title: string, body: string) => {
    ensure(120);
    y -= 8;
    text(title, 42, y, 9, true);
    y -= 14;
    for (const row of wrap(body, 511, 8)) {
      if (y < 72) { page = pdf.addPage(PageSizes.A4); y = paintCompact(); }
      text(row, 42, y, 8, false, muted);
      y -= 11;
    }
  };
  if (quote.notes) paragraph("Notes", quote.notes);
  if (brand?.paymentDetails) paragraph("How to pay", brand.paymentDetails);
  if (brand?.terms) paragraph("Terms", brand.terms);
  const pages = pdf.getPages();
  pages.forEach((sheet, index) => {
    const footer = brand?.footer || displayName;
    sheet.drawLine({ start: { x: 42, y: 46 }, end: { x: 553, y: 46 }, thickness: 0.5, color: line });
    sheet.drawText(safe(`${footer} · ${quote.reference}`, font).slice(0, 140), { x: 42, y: 30, size: 8, font, color: muted });
    const marker = `${index + 1} / ${pages.length}`;
    sheet.drawText(marker, { x: 553 - font.widthOfTextAtSize(marker, 8), y: 30, size: 8, font, color: muted });
  });
  return pdf.save();
}
