import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { ProspectQuickCreateForm } from "@/app/(app)/crm/prospect/new/quick-create-form";

export default async function NewProspectPage() {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.prospectCreate);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Add prospect</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Captured here flows through the same duplicate-checked pipeline as every other source.</p>
      </div>
      <ProspectQuickCreateForm />
    </div>
  );
}
