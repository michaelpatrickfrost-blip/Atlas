import { TaskNotifications } from "@/components/shell/task-notifications";
import { MyTasksPanel } from "@/components/shell/my-tasks";
import { MessageDraftProvider } from "@/components/shell/message-drafts";
import { GuardianObserver } from "@/components/shell/guardian-observer";
import { redirect } from "next/navigation";
import { getSession } from "@/core/auth/session";
import { ShellChrome } from "@/components/shell/shell-chrome";
import { Topbar } from "@/components/shell/topbar";
import { HomeNavigation } from "@/components/shell/home-navigation";
import { IconRail } from "@/components/shell/icon-rail";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return <MessageDraftProvider key={`${session.organisationId}:${session.userId}`}><TaskNotifications><MyTasksPanel /><ShellChrome rail={<IconRail session={session} />} topbar={<Topbar session={session} />} homeNavigation={<HomeNavigation session={session} />}><GuardianObserver />{children}</ShellChrome></TaskNotifications></MessageDraftProvider>;
}
