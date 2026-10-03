import { redirect } from "next/navigation";
import { getSession } from "@/core/auth/session";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen min-w-0">
      <Sidebar session={session} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar session={session} />
        <main className="min-w-0 flex-1 overflow-y-auto bg-[var(--color-app-bg)] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
