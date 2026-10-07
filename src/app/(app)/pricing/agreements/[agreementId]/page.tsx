import { redirect } from "next/navigation";
export default async function LegacyPricing({ searchParams, params }: { searchParams: Promise<Record<string, string | string[] | undefined>>; params: Promise<{ agreementId: string }> }) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) for (const item of value) query.append(key, item);
    else if (value !== undefined) query.set(key, value);
  }
  redirect("/crm/agreements" + "/" + encodeURIComponent((await params).agreementId) + (query.size ? "?" + query.toString() : ""));
}
