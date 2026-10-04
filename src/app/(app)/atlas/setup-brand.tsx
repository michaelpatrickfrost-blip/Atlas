"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { COMPANY_COUNTRIES, type CompanyProfile } from "@/core/setup/company-profile";
import { displayName, letterheadLines } from "@/core/documents/company-brand";
import { saveCompanyBrand } from "@/app/(app)/settings/actions";

const field = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";

function savedLogo(value: string | null) {
  return value && /^data:image\/(png|jpeg|webp|gif);base64,/i.test(value) ? value : null;
}

/**
 * Company branding setup for the onboarding flow.
 * Allows customers to upload their logo, set their brand colour,
 * and configure company details that appear on customer documents.
 * Defaults to Atlas defaults if nothing is set.
 */
export function SetupBrand({
  name,
  logoDataUrl,
  profile,
}: {
  name: string;
  logoDataUrl: string | null;
  profile: CompanyProfile;
}) {
  const [accent, setAccent] = useState(profile.accentColour);
  const [tradingName, setTradingName] = useState(profile.tradingName);
  const [legalName, setLegalName] = useState(profile.legalName);
  const [addressLine1, setAddressLine1] = useState(profile.addressLine1);
  const [city, setCity] = useState(profile.city);
  const [postcode, setPostcode] = useState(profile.postcode);
  const [country, setCountry] = useState(profile.country);
  const [vatNumber, setVatNumber] = useState(profile.vatNumber);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [tagline, setTagline] = useState(profile.tagline);
  const [terms, setTerms] = useState(profile.terms);
  const [paymentDetails, setPaymentDetails] = useState(profile.paymentDetails);

  const initialLogo = savedLogo(logoDataUrl);
  const [logoPreview, setLogoPreview] = useState(initialLogo);
  const [remove, setRemove] = useState(false);

  const draft = {
    ...profile,
    legalName,
    tradingName,
    addressLine1,
    city,
    postcode,
    country,
    vatNumber,
    phone,
    email,
    accentColour: accent,
    tagline,
    terms,
    paymentDetails,
  };

  const shown = displayName(draft, name);
  const lines = letterheadLines(draft, name);
  const mark = remove ? null : logoPreview;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <ActionForm action={saveCompanyBrand} className="space-y-5">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8">
          <h3 className="text-lg font-semibold">White-label your workspace</h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            Add your logo, colours and company details. They appear on invoices and customer documents. Leave blank to use defaults.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Logo</p>
              <p className="mt-1 text-sm text-slate-500">PNG or JPG is printed on invoices. WEBP and GIF stay in the workspace. Square or wide, under 350 KB.</p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span className="flex size-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  {mark ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mark} alt="" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <ImageIcon className="text-slate-300" size={28} />
                  )}
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <input
                    name="logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="max-w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-xs file:font-semibold"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setRemove(false);
                      setLogoPreview(URL.createObjectURL(file));
                    }}
                  />
                  {savedLogo(logoDataUrl) && (
                    <label className="flex items-center gap-2 text-xs text-slate-500">
                      <input
                        type="checkbox"
                        name="remove"
                        checked={remove}
                        onChange={(event) => setRemove(event.target.checked)}
                      />
                      Remove the current logo
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Brand colour & name</p>
              <p className="mt-1 text-sm text-slate-500">The colour is the rule on customer documents. The trading name is shown in the letterhead.</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="text-xs">
                  Brand colour
                  <input
                    name="accentColour"
                    type="color"
                    value={accent}
                    onChange={(event) => setAccent(event.target.value)}
                    className="mt-2 h-11 w-16 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                  />
                </label>
                <label className="text-xs">
                  Tagline
                  <input
                    name="tagline"
                    value={tagline}
                    maxLength={140}
                    onChange={(event) => setTagline(event.target.value)}
                    placeholder="Made in Yorkshire"
                    className={field}
                  />
                </label>
                <label className="text-xs">
                  Trading name
                  <input
                    name="tradingName"
                    value={tradingName}
                    maxLength={200}
                    onChange={(event) => setTradingName(event.target.value)}
                    className={field}
                  />
                </label>
                <label className="text-xs">
                  Legal name
                  <input
                    name="legalName"
                    value={legalName}
                    maxLength={200}
                    onChange={(event) => setLegalName(event.target.value)}
                    className={field}
                  />
                </label>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Letterhead</p>
              <p className="mt-1 text-sm text-slate-500">Address, VAT and contact details print on customer documents.</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="text-xs sm:col-span-2">
                  Registered address
                  <input
                    name="addressLine1"
                    value={addressLine1}
                    maxLength={200}
                    onChange={(event) => setAddressLine1(event.target.value)}
                    className={field}
                  />
                </label>
                <label className="text-xs">
                  City
                  <input
                    name="city"
                    value={city}
                    maxLength={80}
                    onChange={(event) => setCity(event.target.value)}
                    className={field}
                  />
                </label>
                <label className="text-xs">
                  Postcode
                  <input
                    name="postcode"
                    value={postcode}
                    maxLength={20}
                    onChange={(event) => setPostcode(event.target.value)}
                    className={field}
                  />
                </label>
                <label className="text-xs">
                  Country
                  <select
                    name="country"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    className={field}
                  >
                    {COMPANY_COUNTRIES.map((code) => (
                      <option key={code}>{code}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs">
                  VAT number
                  <input
                    name="vatNumber"
                    value={vatNumber}
                    maxLength={40}
                    onChange={(event) => setVatNumber(event.target.value)}
                    className={field}
                  />
                </label>
                <label className="text-xs">
                  Phone
                  <input
                    name="phone"
                    value={phone}
                    maxLength={40}
                    onChange={(event) => setPhone(event.target.value)}
                    className={field}
                  />
                </label>
                <label className="text-xs sm:col-span-2">
                  Email
                  <input
                    name="email"
                    type="email"
                    value={email}
                    maxLength={200}
                    onChange={(event) => setEmail(event.target.value)}
                    className={field}
                  />
                </label>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Payment & terms</p>
              <p className="mt-1 text-sm text-slate-500">These print on every invoice and quotation your customers receive.</p>
              <div className="mt-3 space-y-4">
                <label className="block text-xs">
                  How to pay
                  <textarea
                    name="paymentDetails"
                    value={paymentDetails}
                    maxLength={1500}
                    onChange={(event) => setPaymentDetails(event.target.value)}
                    rows={3}
                    placeholder="Bank, sort code, account number and the reference to quote."
                    className={field}
                  />
                </label>
                <label className="block text-xs">
                  Terms and conditions
                  <textarea
                    name="terms"
                    value={terms}
                    maxLength={8000}
                    onChange={(event) => setTerms(event.target.value)}
                    rows={4}
                    placeholder="Payment is due within the agreed terms. Title passes on payment."
                    className={field}
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <button
          type="submit"
          className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Save company branding
        </button>
      </ActionForm>

      <aside className="space-y-4 xl:sticky xl:top-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[var(--shadow-atlas)]">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Customer sees
            </p>
            <p className="mt-1 text-sm text-slate-500">Your invoice header.</p>
          </div>
          <div className="bg-slate-50 p-4">
            <div className="min-h-64 rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden">
                  {mark ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mark} alt="" className="max-h-12 max-w-16 object-contain" />
                  ) : (
                    <span className="text-[10px] text-slate-300">Logo</span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{shown}</p>
                  {tagline && <p className="truncate text-[10px] text-slate-400">{tagline}</p>}
                </div>
              </div>
              <div className="mt-3 space-y-0.5 text-[10px] leading-relaxed text-slate-500">
                {lines.length
                  ? lines.map((line) => <p key={line}>{line}</p>)
                  : <p>Add the address and VAT number.</p>}
              </div>
              <div className="my-4 h-0.5 w-full" style={{ background: accent }} />
              <p className="text-[10px] font-semibold tracking-wide" style={{ color: accent }}>
                TAX INVOICE
              </p>
              <p className="mt-1 text-lg font-semibold tracking-tight">INV-0001</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
