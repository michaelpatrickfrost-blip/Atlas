import { redirect } from "next/navigation";
export default async function LegacyPricing({ searchParams, params }: { searchParams: Promise<Record<string, string | string[] | undefined>>; params: Promise<{ priceListId: string }> }) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) for (const item of value) query.append(key, item);
    else if (value !== undefined) query.set(key, value);
  }
  redirect("/sales/price-lists" + "/" + encodeURIComponent((await params).priceListId) + (query.size ? "?" + query.toString() : ""));
}
