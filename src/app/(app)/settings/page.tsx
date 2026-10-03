import { requireSession } from "@/core/auth/session";

export default async function SettingsPage() {
  const session = await requireSession();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Settings</h1>
      <p className="text-sm text-[var(--color-ink-muted)]">
        Signed in to {session.organisationName}. Organisation, role and billing settings land here as Atlas grows.
      </p>
    </div>
  );
}
