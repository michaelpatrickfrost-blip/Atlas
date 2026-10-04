import { redirect } from "next/navigation";
import { getSession } from "@/core/auth/session";
import { ShellChrome } from "@/components/shell/shell-chrome";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <ShellChrome sidebar={<Sidebar session={session} />} topbar={<Topbar session={session} />}>
      {children}
    </ShellChrome>
  );
}
