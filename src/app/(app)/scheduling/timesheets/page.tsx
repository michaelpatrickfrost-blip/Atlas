import { redirect } from "next/navigation";

export default async function Page({ searchParams }: { searchParams: Promise<{ week?: string; employeeId?: string }> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.week) query.set("week", params.week);
  if (params.employeeId) query.set("employeeId", params.employeeId);
  const suffix = query.size ? `?${query}` : "";
  redirect(`/people/timesheets${suffix}`);
}
