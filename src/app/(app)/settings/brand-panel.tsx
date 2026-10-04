"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { COMPANY_COUNTRIES, type CompanyProfile } from "@/core/setup/company-profile";
import { displayName, letterheadLines } from "@/core/documents/company-brand";
import { saveCompanyBrand } from "./actions";

const field = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";

function savedLogo(value: string | null) {
  return value && /^data:image\/(png|jpeg|webp|gif);base64,/i.test(value) ? value : null;
}

export function BrandPanel({ name, logoDataUrl, profile }: { name: string; logoDataUrl: string | null; profile: CompanyProfile }) {
  const [accent, setAccent] = useState(profile.accentColour);
  const [legalName, setLegalName] = useState(profile.legalName);
  const [tradingName, setTradingName] = useState(profile.tradingName);
  const [registrationNumber, setRegistrationNumber] = useState(profile.registrationNumber);
  const [vatNumber, setVatNumber] = useState(profile.vatNumber);
  const [addressLine1, setAddressLine1] = useState(profile.addressLine1);
  const [city, setCity] = useState(profile.city);
  const [postcode, setPostcode] = useState(profile.postcode);
  const [country, setCountry] = useState(profile.country);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [website, setWebsite] = useState(profile.website);
  const [tagline, setTagline] = useState(profile.tagline);
  const [terms, setTerms] = useState(profile.terms);
  const [paymentDetails, setPaymentDetails] = useState(profile.paymentDetails);
  const [documentFooter, setDocumentFooter] = useState(profile.documentFooter);
  const initialLogo = savedLogo(logoDataUrl);
  const [logoPreview, setLogoPreview] = useState(initialLogo);
  const [logoKind, setLogoKind] = useState(initialLogo?.startsWith("data:image/png") ? "png" : initialLogo?.startsWith("data:image/jpeg") ? "jpg" : initialLogo ? "other" : "none");
  const [remove, setRemove] = useState(false);
  const draft = { ...profile, legalName, tradingName, registrationNumber, vatNumber, addressLine1, city, postcode, country, phone, email, website, tagline, accentColour: accent, terms, paymentDetails, documentFooter };
  const shown = displayName(draft, name);
  const lines = letterheadLines(draft, name);
  const mark = remove ? null : logoPreview;
  const printsOnInvoice = !remove && (logoKind === "png" || logoKind === "jpg");
  const ready = [
    { label: "Logo", ok: Boolean(mark) },
    { label: "Prints on invoices", ok: printsOnInvoice },
    { label: "Letterhead", ok: Boolean(draft.addressLine1 && (draft.legalName || draft.tradingName)) },
    { label: "VAT number", ok: Boolean(draft.vatNumber) },
    { label: "Terms", ok: Boolean(draft.terms.trim()) },
    { label: "How to pay", ok: Boolean(draft.paymentDetails.trim()) },
  ];

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <ActionForm action={saveCompanyBrand} className="space-y-5">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8">
          <h3 className="text-lg font-semibold">Logo</h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">PNG or JPG is printed on invoices, quotations, order acknowledgements and proformas. WEBP and GIF stay in the workspace. Square or wide, under 350 KB.</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <span className="flex size-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
              {mark ? <img src={mark} alt="" className="max-h-full max-w-full object-contain" /> : <ImageIcon className="text-slate-300" size={28} />}
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <input name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="max-w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-xs file:font-semibold" onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setRemove(false);
                setLogoKind(file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "other");
                setLogoPreview(URL.createObjectURL(file));
              }} />
              {savedLogo(logoDataUrl) && <label className="flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" name="remove" checked={remove} onChange={(event) => setRemove(event.target.checked)} /> Remove the current logo</label>}
            </div>
          </div>
        </section>
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8">
          <h3 className="text-lg font-semibold">Colour and name</h3>
          <p className="mt-2 text-sm text-slate-500">The colour is the rule and the document title on customer paperwork. The trading name is the name in the letterhead.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr]">
            <label className="text-xs">Brand colour<input name="accentColour" type="color" value={accent} onChange={(event) => setAccent(event.target.value)} className="mt-2 h-11 w-16 cursor-pointer rounded-xl border border-slate-200 bg-white p-1" /></label>
            <label className="text-xs sm:col-span-1">Tagline<input name="tagline" value={tagline} maxLength={140} onChange={(event) => setTagline(event.target.value)} placeholder="Made in Yorkshire" className={field} /></label>
            <label className="text-xs">Trading name<input name="tradingName" value={tradingName} maxLength={200} onChange={(event) => setTradingName(event.target.value)} className={field} /></label>
            <label className="text-xs">Legal name<input name="legalName" value={legalName} maxLength={200} onChange={(event) => setLegalName(event.target.value)} className={field} /></label>
          </div>
        </section>
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8">
          <h3 className="text-lg font-semibold">Letterhead</h3>
          <p className="mt-2 text-sm text-slate-500">Address, company number, VAT and contact details print under your name. The same details stay on Workspace.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs sm:col-span-2">Registered address<input name="addressLine1" value={addressLine1} maxLength={200} onChange={(event) => setAddressLine1(event.target.value)} className={field} /></label>
            <label className="text-xs">City<input name="city" value={city} maxLength={80} onChange={(event) => setCity(event.target.value)} className={field} /></label>
            <label className="text-xs">Postcode<input name="postcode" value={postcode} maxLength={20} onChange={(event) => setPostcode(event.target.value)} className={field} /></label>
            <label className="text-xs">Country<select name="country" value={country} onChange={(event) => setCountry(event.target.value)} className={field}>{COMPANY_COUNTRIES.map((code) => <option key={code}>{code}</option>)}</select></label>
            <label className="text-xs">Company number<input name="registrationNumber" value={registrationNumber} maxLength={40} onChange={(event) => setRegistrationNumber(event.target.value)} className={field} /></label>
            <label className="text-xs">VAT number<input name="vatNumber" value={vatNumber} maxLength={40} onChange={(event) => setVatNumber(event.target.value)} className={field} /></label>
            <label className="text-xs">Phone<input name="phone" value={phone} maxLength={40} onChange={(event) => setPhone(event.target.value)} className={field} /></label>
            <label className="text-xs">Email<input name="email" type="email" value={email} maxLength={200} onChange={(event) => setEmail(event.target.value)} className={field} /></label>
            <label className="text-xs sm:col-span-2">Website<input name="website" value={website} maxLength={200} onChange={(event) => setWebsite(event.target.value)} placeholder="https://" className={field} /></label>
          </div>
        </section>
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8">
          <h3 className="text-lg font-semibold">Terms and payment</h3>
          <p className="mt-2 text-sm text-slate-500">These print at the end of every customer invoice, credit note, quotation, acknowledgement and proforma.</p>
          <label className="mt-5 block text-xs">How to pay<textarea name="paymentDetails" value={paymentDetails} maxLength={1500} onChange={(event) => setPaymentDetails(event.target.value)} rows={4} placeholder="Bank, sort code, account number and the reference to quote." className={field} /></label>
          <label className="mt-4 block text-xs">Terms and conditions<textarea name="terms" value={terms} maxLength={8000} onChange={(event) => setTerms(event.target.value)} rows={8} placeholder="Payment is due within the agreed terms. Title passes on payment." className={field} /></label>
          <label className="mt-4 block text-xs">Footer line<input name="documentFooter" value={documentFooter} maxLength={400} onChange={(event) => setDocumentFooter(event.target.value)} placeholder="Leave blank to print the legal name, company number and VAT number." className={field} /></label>
          <button className="mt-6 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-xs font-semibold text-white">Save brand</button>
        </section>
      </ActionForm>
      <aside className="space-y-4 xl:sticky xl:top-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[var(--shadow-atlas)]">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Customer copy</p>
            <p className="mt-1 text-sm text-slate-500">Invoices open looking like this.</p>
          </div>
          <div className="bg-slate-50 p-4">
            <div className="min-h-80 rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden">{mark ? <img src={mark} alt="" className="max-h-12 max-w-16 object-contain" /> : <span className="text-[10px] text-slate-300">Logo</span>}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{shown}</p>
                  {tagline && <p className="truncate text-[10px] text-slate-400">{tagline}</p>}
                </div>
              </div>
              <div className="mt-3 space-y-0.5 text-[10px] leading-relaxed text-slate-500">{lines.length ? lines.map((line) => <p key={line}>{line}</p>) : <p>Add the address and VAT number.</p>}</div>
              <div className="my-4 h-0.5 w-full" style={{ background: accent }} />
              <p className="text-[10px] font-semibold tracking-wide" style={{ color: accent }}>TAX INVOICE</p>
              <p className="mt-1 text-lg font-semibold tracking-tight">INV-1042</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[10px] text-slate-500">
                <div><p className="font-semibold" style={{ color: accent }}>Invoice address</p><p className="mt-1">The customer’s billing address</p></div>
                <div className="text-right"><p>Issued today</p><p>Due on the agreed date</p></div>
              </div>
              <div className="mt-4 h-8 rounded-md bg-slate-50" />
              <p className="mt-4 text-[10px] leading-relaxed text-slate-400">{paymentDetails.trim() ? paymentDetails.trim().slice(0, 120) : "Payment details appear here."}</p>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{terms.trim() ? terms.trim().slice(0, 160) : "Your terms appear at the end of the invoice."}</p>
            </div>
          </div>
        </div>
        <ul className="rounded-[28px] border border-slate-200 bg-white p-5 text-sm">
          {ready.map((item) => <li key={item.label} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0"><span>{item.label}</span><span className={item.ok ? "text-emerald-600" : "text-slate-400"}>{item.ok ? "Ready" : "Add"}</span></li>)}
        </ul>
      </aside>
    </div>
  );
}
