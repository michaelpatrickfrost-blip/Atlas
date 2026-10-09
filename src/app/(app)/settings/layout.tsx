import { Suspense } from "react";
import { Settings2, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { settingsNav, canOpenCompanyAdmin } from "./settings-menu";
import { SettingsNav } from "./settings-nav";
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  if (!canOpenCompanyAdmin(session)) redirect("/profile/settings");
  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white bg-white/80 px-6 py-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Settings2 size={24} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.17em] text-blue-600">
              {session.organisationName}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Company settings
            </h1>
          </div>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <ShieldCheck size={15} />
          Company administration
        </span>
      </header>
      <div className="grid items-start gap-5 xl:grid-cols-[235px_minmax(0,1fr)]">
        <Suspense fallback={<div className="h-48" />}>
          <SettingsNav groups={settingsNav(session)} />
        </Suspense>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
