import { z } from "zod";

export const COMPANY_TIMEZONES = ["Europe/London", "Europe/Dublin", "Europe/Paris", "Europe/Berlin", "America/New_York", "America/Chicago", "America/Los_Angeles", "Asia/Dubai", "Asia/Singapore", "Australia/Sydney", "UTC"] as const;
export const COMPANY_CURRENCIES = ["GBP", "EUR", "USD"] as const;
export const COMPANY_COUNTRIES = ["GB", "IE", "FR", "DE", "NL", "US", "AE", "SG", "AU"] as const;

const text = (max: number) => z.string().max(max).default("");

export const companyProfileSchema = z.object({
  legalName: text(200),
  tradingName: text(200),
  registrationNumber: text(40),
  vatNumber: text(40),
  industry: text(80),
  website: text(200).refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), "Website must start with http:// or https://."),
  phone: text(40),
  email: text(200).refine((value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Enter a valid company email."),
  addressLine1: text(200),
  city: text(80),
  postcode: text(20),
  country: z.string().regex(/^[A-Z]{2}$/).default("GB"),
  timezone: z.string().refine((value) => COMPANY_TIMEZONES.includes(value as (typeof COMPANY_TIMEZONES)[number]), "Choose a listed time zone.").default("Europe/London"),
  defaultCurrency: z.string().regex(/^[A-Z]{3}$/).default("GBP"),
  fiscalYearStartMonth: z.number().int().min(1).max(12).default(4),
  locale: z.enum(["en-GB", "en-US"]).default("en-GB"),
  /** Printed on customer paperwork. Charcoal until the company picks its own colour. */
  accentColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#1d1d1f"),
  tagline: text(140),
  terms: text(8000),
  paymentDetails: text(1500),
  documentFooter: text(400),
});

export type CompanyProfile = z.infer<typeof companyProfileSchema>;

export function readCompanyProfile(value: unknown): CompanyProfile {
  const parsed = companyProfileSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : companyProfileSchema.parse({});
}

export const FISCAL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
