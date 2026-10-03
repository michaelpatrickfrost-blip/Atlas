import { redirect } from "next/navigation";
import { getSession } from "@/core/auth/session";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="atlas-shell flex h-screen min-w-0">
      <Sidebar session={session} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar session={session} />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-7 sm:py-7 lg:px-9">
          <div className="atlas-page-enter">{children}</div>
        </main>
      </div>
    </div>
  );
}
