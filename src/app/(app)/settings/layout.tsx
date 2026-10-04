import { Suspense } from "react";
import { Settings2 } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { AppHeader } from "@/components/shell/app-header";
import { settingsNav } from "./settings-menu";
import { SettingsNav } from "./settings-nav";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <AppHeader icon={Settings2} title="Company administration" eyebrow={session.organisationName} />
      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Suspense fallback={<div className="h-48" />}>
          <SettingsNav groups={settingsNav(session)} />
        </Suspense>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
