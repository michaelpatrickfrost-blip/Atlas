import { readCompanyProfile, type CompanyProfile } from "@/core/setup/company-profile";

export type PrintableLogo = { bytes: Uint8Array; type: "png" | "jpg" };

/** What a customer sees on an invoice, quotation, acknowledgement or proforma. */
export type DocumentBrand = {
  displayName: string;
  accent: readonly [number, number, number];
  tagline: string;
  letterhead: string[];
  terms: string;
  paymentDetails: string;
  footer: string;
  logo: PrintableLogo | null;
};

export function displayName(profile: CompanyProfile, organisationName: string) {
  return profile.tradingName || profile.legalName || organisationName;
}

export function letterheadLines(profile: CompanyProfile, organisationName: string) {
  const name = displayName(profile, organisationName);
  const lines: string[] = [];
  if (profile.legalName && profile.legalName !== name) lines.push(profile.legalName);
  const address = [profile.addressLine1, profile.city, profile.postcode, profile.country].filter(Boolean).join(", ");
  if (address) lines.push(address);
  if (profile.registrationNumber) lines.push(`Company ${profile.registrationNumber}`);
  if (profile.vatNumber) lines.push(`VAT ${profile.vatNumber}`);
  const contact = [profile.phone, profile.email, profile.website.replace(/^https?:\/\//i, "")].filter(Boolean).join(" · ");
  if (contact) lines.push(contact);
  return lines;
}

export function footerLine(profile: CompanyProfile, organisationName: string) {
  if (profile.documentFooter.trim()) return profile.documentFooter.trim();
  const name = profile.legalName || displayName(profile, organisationName);
  return [name, profile.registrationNumber && `Company ${profile.registrationNumber}`, profile.vatNumber && `VAT ${profile.vatNumber}`].filter(Boolean).join(" · ");
}

/** A near-white accent disappears on the page. Customer paperwork stays readable. */
export function assertPrintableAccent(value: string) {
  const hex = value.trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) throw new Error("Choose a brand colour.");
  const channel = (start: number) => parseInt(hex.slice(start, start + 2), 16) / 255;
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  if (luminance > 0.82) throw new Error("Choose a darker brand colour so it reads on a white invoice.");
  return hex.toLowerCase();
}

export function accentChannels(hex: string): readonly [number, number, number] {
  const safe = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#1d1d1f";
  const channel = (start: number) => parseInt(safe.slice(start, start + 2), 16) / 255;
  return [channel(1), channel(3), channel(5)];
}

/** PNG and JPG print on customer documents. WEBP and GIF stay in the workspace only. */
export function printableLogo(dataUrl: string | null | undefined): PrintableLogo | null {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:image\/(png|jpeg);base64,([a-z0-9+/=\s]+)$/i);
  if (!match) return null;
  const binary = atob(match[2].replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  if (bytes.length < 8) return null;
  return { bytes, type: match[1].toLowerCase() === "png" ? "png" : "jpg" };
}

export function documentBrandFrom(organisation: { name: string; logoDataUrl?: string | null; companyProfile?: unknown }): DocumentBrand {
  const profile = readCompanyProfile(organisation.companyProfile);
  return {
    displayName: displayName(profile, organisation.name),
    accent: accentChannels(profile.accentColour),
    tagline: profile.tagline.trim(),
    letterhead: letterheadLines(profile, organisation.name),
    terms: profile.terms.trim(),
    paymentDetails: profile.paymentDetails.trim(),
    footer: footerLine(profile, organisation.name),
    logo: printableLogo(organisation.logoDataUrl),
  };
}
