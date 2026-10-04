"use client";
import Link from "next/link";
import { buildProformaFacts, formatKg, formatVolume, hasBlock, INCOTERMS, measuresOf, PROFORMA_STATEMENT } from "../domain/invoice-templates";
import type { DocumentData, DocumentDraft } from "./document-types";

const input = "w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-atlas-blue)]";

export function InvoiceTemplatePanel({ templates, customerId, customerName, products, lines, addresses, assignmentId, onAssignment, draft }: {
  templates: NonNullable<DocumentData["invoiceTemplates"]>;
  customerId: string;
  customerName?: string;
  products: DocumentData["products"];
  lines: Array<{ productId: string; type: string; description: string; quantity: number }>;
  addresses: DocumentData["addresses"];
  assignmentId: string;
  onAssignment: (id: string) => void;
  draft?: DocumentDraft;
}) {
  const attached = templates.filter((template) => template.partyId === customerId);
  const chosen = attached.find((template) => template.id === assignmentId);
  const blocks = chosen?.blocks ?? [];
  const exportSale = chosen?.kind === "EXPORT";
  const facts = exportSale ? buildProformaFacts({
    blocks,
    header: {
      incoterms: draft?.incoterms || null, namedPlace: draft?.namedPlace || null, portOfLoading: draft?.portOfLoading || null, portOfDischarge: draft?.portOfDischarge || null,
      packageCount: draft?.packageCount ? Number(draft.packageCount) : null, packageType: draft?.packageType || null, marks: draft?.shippingMarks || chosen?.marks || null,
      reasonForExport: draft?.reasonForExport || null, buyerEori: draft?.buyerEori || chosen?.buyerEori || null, buyerVat: draft?.buyerVat || chosen?.buyerVat || null,
    },
    destinationCountry: addresses.find((address) => address.id === (draft?.deliveryAddressId ?? ""))?.country ?? null,
    invoiceAddress: draft?.invoiceAddressId ? { line1: "selected" } : null,
    deliveryAddress: draft?.deliveryAddressId ? { line1: "selected" } : null,
    sellerEori: "preview",
    lines: lines.filter((line) => line.type === "PRODUCT" && line.productId).map((line) => {
      const product = products.find((item) => item.id === line.productId);
      return { type: line.type, description: line.description || product?.name || "", code: product?.code, quantity: line.quantity, unitAmount: 0, netAmount: 0, measures: measuresOf(product) };
    }),
  }) : null;
  if (!customerId) return <p className="text-sm text-slate-500">Choose the customer on Sale, then pick the invoice template attached to their account.</p>;
  return <div className="space-y-6">
    <div><h3 className="text-lg font-semibold">Invoice template</h3><p className="mt-1 text-sm text-slate-500">The template on the customer account decides the address and the extra details printed for them. An export template raises a proforma with this sale. That proforma is not a tax invoice.</p></div>
    {attached.length === 0 ? <><input type="hidden" name="invoiceAssignmentId" value="" /><p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">No invoice template is attached to {customerName ?? "this customer"}. Add one on their account. Company templates live in the template menu.</p></> : <label className="block text-xs font-medium text-slate-500">Template on this account<select name="invoiceAssignmentId" value={assignmentId} onChange={(event) => onAssignment(event.target.value)} className={`${input} mt-2`}><option value="">No template</option>{attached.map((template) => <option key={template.id} value={template.id}>{template.name} · {template.kind === "EXPORT" ? "Export proforma" : "Domestic invoice"}{template.isDefault ? " · Default" : ""}</option>)}</select></label>}
    {chosen && <p className="text-xs text-slate-500">Prints {chosen.blocks.length ? chosen.blocks.join(", ") : "the standard invoice"}.</p>}
    {exportSale && chosen && <div key={chosen.id} className="space-y-5">
      <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">{PROFORMA_STATEMENT}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {hasBlock(blocks, "incoterms") && <label className="text-xs text-slate-500">Incoterms<select name="incoterms" defaultValue={draft?.incoterms ?? ""} className={`${input} mt-2`}><option value="">Choose</option>{INCOTERMS.map((term) => <option key={term}>{term}</option>)}</select></label>}
        {hasBlock(blocks, "incoterms") && <label className="text-xs text-slate-500">Named place<input name="namedPlace" defaultValue={draft?.namedPlace ?? ""} placeholder="For example, Felixstowe or the buyer's warehouse" className={`${input} mt-2`}/></label>}
        {hasBlock(blocks, "ports") && <label className="text-xs text-slate-500">Port of loading<input name="portOfLoading" defaultValue={draft?.portOfLoading ?? ""} className={`${input} mt-2`}/></label>}
        {hasBlock(blocks, "ports") && <label className="text-xs text-slate-500">Port of discharge<input name="portOfDischarge" defaultValue={draft?.portOfDischarge ?? ""} className={`${input} mt-2`}/></label>}
        {hasBlock(blocks, "packages") && <label className="text-xs text-slate-500">Packages<input name="packageCount" type="number" min={1} defaultValue={draft?.packageCount ?? ""} className={`${input} mt-2`}/></label>}
        {hasBlock(blocks, "packages") && <label className="text-xs text-slate-500">Packing<input name="packageType" defaultValue={draft?.packageType ?? "Cartons"} className={`${input} mt-2`}/></label>}
        {hasBlock(blocks, "buyerIdentity") && <label className="text-xs text-slate-500">Buyer EORI<input name="buyerEori" defaultValue={draft?.buyerEori || chosen.buyerEori} className={`${input} mt-2`}/></label>}
        {hasBlock(blocks, "buyerIdentity") && <label className="text-xs text-slate-500">Buyer VAT<input name="buyerVat" defaultValue={draft?.buyerVat || chosen.buyerVat} className={`${input} mt-2`}/></label>}
        {hasBlock(blocks, "notifyParty") && <label className="text-xs text-slate-500 sm:col-span-2">Notify party<select name="notifyAddressId" defaultValue={draft?.notifyAddressId || chosen.notifyAddressId || ""} className={`${input} mt-2`}><option value="">No notify party</option>{addresses.map((address) => <option key={address.id} value={address.id}>{address.label}</option>)}</select></label>}
        {hasBlock(blocks, "marks") && <label className="text-xs text-slate-500 sm:col-span-2">Shipping marks<textarea name="shippingMarks" defaultValue={draft?.shippingMarks || chosen.marks} className={`${input} mt-2 min-h-20`}/></label>}
        {hasBlock(blocks, "reasonForExport") && <label className="text-xs text-slate-500 sm:col-span-2">Reason for export<input name="reasonForExport" defaultValue={draft?.reasonForExport ?? "Sale"} className={`${input} mt-2`}/></label>}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[720px] text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr>{["Product", "Net weight", "Gross weight", "Volume", "Origin", "Commodity code"].map((heading) => <th key={heading} className="px-3 py-3 font-medium">{heading}</th>)}</tr></thead>
          <tbody>{facts?.lines.map((line) => <tr key={`${line.code}-${line.description}`} className="border-t border-slate-100"><td className="px-3 py-3">{line.description}<span className="mt-1 block text-[10px] text-slate-400">{line.code}</span></td><td className="px-3 py-3">{formatKg(line.netGrams)}</td><td className="px-3 py-3">{formatKg(line.grossGrams)}</td><td className="px-3 py-3">{formatVolume(line.volumeMl)}</td><td className="px-3 py-3">{line.originCountry ?? "Missing"}</td><td className="px-3 py-3">{line.commodityCode ?? "Missing"}</td></tr>)}{!facts?.lines.length && <tr><td colSpan={6} className="px-3 py-4 text-slate-500">Add products on Sale. Weight, volume, origin and commodity code come from the product.</td></tr>}</tbody>
          {!!facts?.lines.length && <tfoot><tr className="border-t border-slate-200 font-medium"><td className="px-3 py-3">Total</td><td className="px-3 py-3">{formatKg(facts.totals.netGrams)}</td><td className="px-3 py-3">{formatKg(facts.totals.grossGrams)}</td><td className="px-3 py-3">{formatVolume(facts.totals.volumeMl)}</td><td colSpan={2} /></tr></tfoot>}
        </table>
      </div>
      <p className="text-xs text-slate-500">A blank weight, volume, origin or commodity code is completed on the product. The sale can be saved while those are missing. Confirming the export waits until the proforma is complete.</p>
    </div>}
    <p className="text-xs text-slate-500"><Link href={`/customers/${customerId}?tab=commercial`} className="text-blue-600">Customer account</Link> · <Link href="/sales/templates" className="text-blue-600">Template menu</Link></p>
  </div>;
}
