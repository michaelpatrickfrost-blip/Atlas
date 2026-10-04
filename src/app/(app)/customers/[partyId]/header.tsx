import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import type { CustomerStatus } from "@/generated/prisma/client";
import type { CustomerOverviewContribution } from "@/core/modules/types";
import { HeaderActionsMenu } from "@/app/(app)/customers/[partyId]/actions-menu";

const STATUS_TONE: Record<CustomerStatus, StatusTone> = {
  PROSPECT: "neutral",
  ACTIVE: "success",
  ON_HOLD: "warning",
  INACTIVE: "neutral",
  CLOSED: "neutral",
};

export function CustomerHeader({
  customer,
  accountManagerName,
  contributions,
  onHold,
  hasVerifiedTaxRegistration,
  extra,
}: {
  customer: { id: string; name: string; customerCode: string; status: CustomerStatus; countryOfRegistration: string | null };
  accountManagerName: string | null;
  contributions: CustomerOverviewContribution[];
  onHold: boolean;
  hasVerifiedTaxRegistration: boolean;
  extra?: React.ReactNode;
}) {
  const actions = contributions.flatMap((contribution) => contribution.actions);

  return (
    <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{customer.name}</h1>
          <StatusPill label={customer.status.replace("_", " ")} tone={onHold ? "danger" : STATUS_TONE[customer.status]} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-ink-muted)]">
          <span>Customer {customer.customerCode}</span>
          {customer.countryOfRegistration && <span>{customer.countryOfRegistration}</span>}
          {hasVerifiedTaxRegistration && <span className="text-[var(--color-status-success)]">VAT verified</span>}
          {accountManagerName && <span>Account manager: {accountManagerName}</span>}
        </div>
      </div>

      {(actions.length > 0 || extra) && (
        <div className="flex shrink-0 items-center gap-2">
          {extra}
          <HeaderActionsMenu actions={actions} />
        </div>
      )}
    </div>
  );
}
