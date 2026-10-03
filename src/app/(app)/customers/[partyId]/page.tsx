import { CustomerHierarchy } from "./hierarchy";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { getCustomer, getSetupChecklist } from "@/core/customers/queries";
import { getCustomerOverviewContributions } from "@/core/customers/overview";
import { getCustomerActivity } from "@/core/activity/log";
import { db } from "@/core/db/client";
import { CustomerHeader } from "@/app/(app)/customers/[partyId]/header";
import { CustomerTabs, type CustomerTabKey } from "@/app/(app)/customers/[partyId]/tabs";
import { CustomerOverview } from "@/app/(app)/customers/[partyId]/overview";
import { PeopleAndPlaces } from "@/app/(app)/customers/[partyId]/people-places";
import { Commercial } from "@/app/(app)/customers/[partyId]/commercial";
import { FinanceAndTax } from "@/app/(app)/customers/[partyId]/finance-tax";
import { CustomerActivity } from "@/app/(app)/customers/[partyId]/activity";

export default async function CustomerRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ partyId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.read);

  const { partyId } = await params;
  const { tab } = await searchParams;
  const activeTab = (["overview", "people", "commercial", "finance", "activity"].includes(tab ?? "") ? tab : "overview") as CustomerTabKey;

  const customer = await getCustomer(session.organisationId, partyId);
  if (!customer) notFound();

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
      />
      <CustomerHierarchy partyId={partyId} session={session} />
      <CustomerTabs partyId={partyId} active={activeTab} />

      {activeTab === "overview" && (
        <CustomerOverview customer={customer} contributions={contributions} checklist={getSetupChecklist(customer)} session={session} />
      )}
      {activeTab === "people" && <PeopleAndPlaces customer={customer} session={session} />}
      {activeTab === "commercial" && <Commercial customer={customer} session={session} />}
      {activeTab === "finance" && <FinanceAndTax customer={customer} session={session} />}
      {activeTab === "activity" && (
        <CustomerActivity customer={customer} activity={await getCustomerActivity(session.organisationId, partyId)} session={session} />
      )}
    </div>
  );
}
