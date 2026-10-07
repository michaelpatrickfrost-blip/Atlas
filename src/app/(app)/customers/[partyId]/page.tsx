import Link from "next/link";
import { EditCustomerDetails } from "@/app/(app)/customers/[partyId]/edit-details";
import { CustomerRecordActions } from "@/app/(app)/customers/[partyId]/record-actions";
import {RecordEmail} from "@/app/(app)/_shared/record-email";
import { CustomerHierarchy } from "./hierarchy";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { customerWasDeleted, getCustomer, getSetupChecklist } from "@/core/customers/queries";
import { getCustomerOverviewContributions } from "@/core/customers/overview";
import { getCustomerActivity } from "@/core/activity/log";
import { db } from "@/core/db/client";
import { CustomerHeader } from "@/app/(app)/customers/[partyId]/header";
import { CustomerTabs, type CustomerTabKey } from "@/app/(app)/customers/[partyId]/tabs";
import { CustomerOverview } from "@/app/(app)/customers/[partyId]/overview";
import { RelationshipSummary } from "@/app/(app)/customers/[partyId]/relationship-summary";
import { Addresses } from "@/app/(app)/customers/[partyId]/people-places";
import { Contacts } from "@/app/(app)/customers/[partyId]/contacts";
import { Commercial } from "@/app/(app)/customers/[partyId]/commercial";
import { FinanceAndTax } from "@/app/(app)/customers/[partyId]/finance-tax";
import { CustomerActivity } from "@/app/(app)/customers/[partyId]/activity";
import { EchoRail } from "@/modules/audit/components/echo-rail";

export default async function CustomerRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ partyId: string }>;
  searchParams: Promise<{ tab?: string; echo?: string }>;
}) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.read);

  const { partyId } = await params;
  const { tab, echo } = await searchParams;
  const activeTab = (["overview", "contacts", "people", "relationships", "commercial", "finance", "activity"].includes(tab ?? "") ? tab : "overview") as CustomerTabKey;

  const customer = await getCustomer(session.organisationId, partyId);
  if (!customer) {
    if (!await customerWasDeleted(session.organisationId, partyId)) notFound();
    return <section data-guardian-state="record-deleted" className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-8"><h1 className="text-2xl font-semibold">Customer deleted</h1><p className="text-sm leading-relaxed text-slate-600">This customer&apos;s identifying details have been removed. Historical documents remain in their owning apps.</p><Link href="/customers" className="inline-block text-sm font-medium text-blue-600">Back to customers →</Link></section>;
  }

  const [contributions, accountManager] = await Promise.all([
    getCustomerOverviewContributions(session, partyId),
    customer.accountManagerUserId ? db.user.findUnique({ where: { id: customer.accountManagerUserId }, select: { name: true } }) : null,
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <CustomerHeader
        customer={customer}
        accountManagerName={accountManager?.name ?? null}
        contributions={contributions}
        onHold={customer.creditProfile?.onHold ?? false}
        hasVerifiedTaxRegistration={customer.taxRegistrations.some((r) => r.validationStatus === "MANUALLY_VERIFIED" || r.validationStatus === "VERIFIED_BY_SERVICE")}
        extra={<>{can(session, "customers.edit") && <><CustomerRecordActions partyId={partyId} customerName={customer.name} archived={customer.archived} /><EditCustomerDetails customer={customer} /></>}{can(session, "echo.read") ? <EchoRail entityType="Party" entityId={customer.id} title={customer.name} canWrite={can(session, "echo.write")} startOpen={echo === "1"} /> : null}</>}
      />
      <CustomerTabs partyId={partyId} active={activeTab} />

      {activeTab === "overview" && (
        <>
          <RelationshipSummary partyId={partyId} session={session} />
          <CustomerOverview customer={customer} contributions={contributions} checklist={getSetupChecklist(customer)} session={session} />
        </>
      )}
      {activeTab === "contacts" && <Contacts customer={customer} session={session} />}
      {activeTab === "people" && <Addresses customer={customer} session={session} />}
      {activeTab === "relationships" && <CustomerHierarchy partyId={partyId} session={session} />}
      {activeTab === "commercial" && <Commercial customer={customer} session={session} />}
      {activeTab === "finance" && <FinanceAndTax customer={customer} session={session} />}
      {activeTab === "activity" && <RecordEmail kind="customer" recordId={partyId} />}
      {activeTab === "activity" && (
        <CustomerActivity customer={customer} activity={await getCustomerActivity(session.organisationId, partyId)} session={session} />
      )}
    </div>
  );
}
