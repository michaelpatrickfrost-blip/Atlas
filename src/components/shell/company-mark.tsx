import { db } from "@/core/db/client";
import { readCompanyProfile } from "@/core/setup/company-profile";

const SIZES = {
  sm: "size-8 rounded-xl text-[10px]",
  md: "size-10 rounded-2xl text-xs",
  lg: "size-14 rounded-[18px] text-sm",
} as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "A") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function safeLogo(value: string | null | undefined) {
  if (!value) return null;
  return /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value) ? value : null;
}

/** The signed-in company's logo, or a monogram when none has been added. */
export async function CompanyMark({ organisationId, name, size = "md" }: { organisationId: string; name: string; size?: keyof typeof SIZES }) {
  let logo: string | null = null;
  let accent = "#1d1d1f";
  try {
    const org = await db.organisation.findUnique({ where: { id: organisationId }, select: { logoDataUrl: true, companyProfile: true } });
    logo = safeLogo(org?.logoDataUrl);
    accent = readCompanyProfile(org?.companyProfile).accentColour;
  } catch {
    logo = null;
  }
  const box = `${SIZES[size]} shrink-0 overflow-hidden`;
  if (logo) return <span className={`flex items-center justify-center border border-black/10 bg-white p-1 ${box}`}><img src={logo} alt="" className="max-h-full max-w-full object-contain" /></span>;
  return <span className={`flex items-center justify-center font-medium text-white ${box}`} style={{ background: accent }}>{initials(name)}</span>;
}
