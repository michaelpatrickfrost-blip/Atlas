import { redirect } from "next/navigation";
import { getSession } from "@/core/auth/session";

export default async function DisplayLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return children;
}
