import { GuardianObserver } from "@/components/shell/guardian-observer";
import { redirect } from "next/navigation";
import { getSession } from "@/core/auth/session";
import { ShellChrome } from "@/components/shell/shell-chrome";
import { Topbar } from "@/components/shell/topbar";
import { HomeNavigation } from "@/components/shell/home-navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return <ShellChrome topbar={<Topbar session={session} />} homeNavigation={<HomeNavigation session={session} />}><GuardianObserver />{children}</ShellChrome>;
}
