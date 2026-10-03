import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { QuickCreateForm } from "@/app/(app)/customers/new/quick-create-form";

export default async function NewCustomerPage() {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.create);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Add customer</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Just the essentials for now — you can complete VAT, billing and credit details afterwards.
        </p>
      </div>
      <QuickCreateForm />
    </div>
  );
}
