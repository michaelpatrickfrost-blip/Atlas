import Link from "next/link";
import {db} from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { QuickCreateForm } from "@/app/(app)/customers/new/quick-create-form";

export default async function NewCustomerPage() {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.create);

  const policy=await db.organisation.findUniqueOrThrow({where:{id:session.organisationId},select:{allowCustomerCreation:true}});
  if(!policy.allowCustomerCreation)return <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8"><h1 className="text-2xl font-semibold">Customer creation is disabled</h1><p className="my-4 text-sm text-slate-500">Your company administrator has restricted new customer creation. Existing customer records remain available.</p><Link href="/customers" className="text-sm text-blue-600">Return to customers →</Link></div>;
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
