import { GuardianObserver } from "@/components/shell/guardian-observer";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/core/auth/session";
import { ShellChrome } from "@/components/shell/shell-chrome";
import { Topbar } from "@/components/shell/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    const path=(await headers()).get("x-atlas-request-path") ?? "";
    redirect(path === "/atlas" || path.startsWith("/atlas/") ? "/atlas/login" : "/login");
  }

  return <ShellChrome topbar={<Topbar session={session} />}><GuardianObserver />{children}</ShellChrome>;
}
