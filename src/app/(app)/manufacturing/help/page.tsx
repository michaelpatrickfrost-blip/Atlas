import { redirect } from "next/navigation";
export default async function SupplyHelp({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 120) : "";
  redirect(`/guides/apps/manufacturing${q ? `?q=${encodeURIComponent(q)}` : ""}`);
}
