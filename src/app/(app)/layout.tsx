import { redirect } from "next/navigation";
import { getSession } from "@/core/auth/session";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen">
      <Sidebar session={session} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar session={session} />
        <main className="flex-1 overflow-y-auto bg-[var(--color-app-bg)] px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
