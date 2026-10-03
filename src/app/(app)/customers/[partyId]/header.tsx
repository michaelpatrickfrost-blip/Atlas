import Link from "next/link";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import type { CustomerStatus } from "@/generated/prisma/client";
import type { CustomerOverviewContribution } from "@/core/modules/types";

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
}: {
  customer: { id: string; name: string; customerCode: string; status: CustomerStatus; countryOfRegistration: string | null };
  accountManagerName: string | null;
  contributions: CustomerOverviewContribution[];
  onHold: boolean;
  hasVerifiedTaxRegistration: boolean;
}) {
  const actions = contributions.flatMap((contribution) => contribution.actions);

  return (
    <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
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

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link key={action.href + action.label} href={action.href}>
              <Button variant="secondary">{action.label}</Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
