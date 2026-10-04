import { db } from "@/core/db/client";
import { readCompanyProfile, type CompanyProfile } from "@/core/setup/company-profile";
import { displayName, footerLine, letterheadLines } from "@/core/documents/company-brand";
import type { Brand } from "./render-pure";
export * from "./render-pure";

export function publicBaseUrl() {
  return (process.env.ATLAS_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || "https://atlassystem.online").replace(/\/$/, "");
}

export type LoadedBrand = Brand & { profile: CompanyProfile };

export async function loadBrand(organisationId: string): Promise<LoadedBrand> {
  const org = await db.organisation.findUnique({ where: { id: organisationId }, select: { name: true, slug: true, logoDataUrl: true, companyProfile: true } });
  const profile = readCompanyProfile(org?.companyProfile);
  const name = displayName(profile, org?.name ?? "Atlas");
  return {
    name, profile, accent: profile.accentColour || "#1d1d1f",
    logoUrl: org?.logoDataUrl && org.slug ? `${publicBaseUrl()}/api/public/logo/${encodeURIComponent(org.slug)}` : null,
    letterhead: letterheadLines(profile, org?.name ?? name), footer: footerLine(profile, org?.name ?? name),
  };
}

