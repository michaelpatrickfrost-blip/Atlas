import { Card } from "@/components/ui/card";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/core/shared/money";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { maskBankAccount } from "@/core/customers/bank";
import type { Session } from "@/core/auth/session";
import type { getCustomer } from "@/core/customers/queries";
import {
  createTaxRegistrationFormAction,
  markTaxVerifiedFormAction,
  createBankAccountFormAction,
  createDirectDebitFormAction,
  cancelDirectDebitFormAction,
  updateCreditLimitFormAction,
  toggleCreditHoldFormAction,
} from "@/app/(app)/customers/[partyId]/actions";
import { RevealBankAccount } from "@/app/(app)/customers/[partyId]/reveal-bank-account";
import type { TaxValidationStatus, DirectDebitStatus } from "@/generated/prisma/client";

type Customer = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;

const TAX_STATUS_TONE: Record<TaxValidationStatus, StatusTone> = {
  NOT_VERIFIED: "neutral",
  MANUALLY_VERIFIED: "success",
  VERIFIED_BY_SERVICE: "success",
  FAILED: "danger",
};

const DD_STATUS_TONE: Record<DirectDebitStatus, StatusTone> = {
  PENDING: "neutral",
  ACTIVE: "success",
  CANCELLED: "neutral",
  FAILED: "danger",
};

const inputClass =
  "rounded-[var(--radius-atlas-sm)] border border-[var(--color-border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--color-atlas-blue)]";

export function FinanceAndTax({ customer, session }: { customer: Customer; session: Session }) {
  const canTaxRead = can(session, CUSTOMER_CAPABILITIES.taxRead);
  const canTaxManage = can(session, CUSTOMER_CAPABILITIES.taxManage);
  const canCreditRead = can(session, CUSTOMER_CAPABILITIES.creditRead);
  const canCreditManage = can(session, CUSTOMER_CAPABILITIES.creditManage);
  const canBankRead = can(session, CUSTOMER_CAPABILITIES.bankRead);
  const canBankManage = can(session, CUSTOMER_CAPABILITIES.bankManage);
  const canBankReveal = can(session, CUSTOMER_CAPABILITIES.bankReveal);

  if (!canTaxRead && !canCreditRead && !canBankRead) {
    return <p className="text-sm text-[var(--color-ink-muted)]">You don&apos;t have permission to view finance and tax information.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {canTaxRead && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Tax identity · VAT registrations</h2>
          {customer.taxRegistrations.length === 0 ? (
            <EmptyState title="No tax registrations yet." />
          ) : (
            <div className="flex flex-col gap-2">
              {customer.taxRegistrations.map((registration) => (
                <Card key={registration.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">
                      {registration.jurisdiction} {registration.registrationType} · {registration.number}
                    </p>
                    {registration.validationDate && (
                      <p className="text-xs text-[var(--color-ink-faint)]">
                        {registration.validationStatus === "MANUALLY_VERIFIED" ? "Manually verified" : "Verified"} ·{" "}
                        {registration.validationDate.toLocaleDateString("en-GB")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill label={registration.validationStatus.replace("_", " ").toLowerCase()} tone={TAX_STATUS_TONE[registration.validationStatus]} />
                    {canTaxManage && registration.validationStatus === "NOT_VERIFIED" && (
                      <form action={markTaxVerifiedFormAction.bind(null, registration.id, customer.id)}>
                        <Button type="submit" variant="secondary">
                          Mark as manually verified
                        </Button>
                      </form>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
          {canTaxManage && (
            <details className="mt-3 rounded-[var(--radius-atlas-md)] border border-dashed border-[var(--color-border)] p-4">
              <summary className="cursor-pointer text-sm font-medium text-[var(--color-atlas-blue)]">Add tax registration</summary>
              <form action={createTaxRegistrationFormAction.bind(null, customer.id)} className="mt-3 flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-3">
                  <input name="jurisdiction" placeholder="Jurisdiction (e.g. GB)" required className={inputClass} />
                  <input name="registrationType" placeholder="Type (e.g. VAT)" required className={inputClass} />
                  <input name="number" placeholder="Registration number" required className={inputClass} />
                </div>
                <Button type="submit" variant="primary" className="self-start">
                  Add registration
                </Button>
              </form>
            </details>
          )}
        </section>
      )}

      {canCreditRead && customer.creditProfile && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Credit & payment</h2>
          <Card className="flex flex-col gap-3 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Field label="Credit limit" value={formatMoney(customer.creditProfile.creditLimitAmount, customer.creditProfile.creditLimitCurrency)} />
              <Field label="On hold" value={customer.creditProfile.onHold ? "Yes" : "No"} />
              <Field label="Payment term" value={customer.creditProfile.paymentTerm?.name ?? "Not set"} />
              <Field label="Payment method" value={customer.creditProfile.paymentMethod ?? "Not set"} />
            </div>
            {canCreditManage && (
              <div className="flex flex-wrap gap-4 border-t border-[var(--color-border)] pt-3">
                <form action={updateCreditLimitFormAction.bind(null, customer.id)} className="flex items-end gap-2">
                  <label className="flex flex-col gap-1 text-xs text-[var(--color-ink-muted)]">
                    Change limit (£)
                    <input name="limit" type="number" step="0.01" min="0" className={inputClass} />
                  </label>
                  <Button type="submit" variant="secondary">
                    Update
                  </Button>
                </form>
                <form action={toggleCreditHoldFormAction.bind(null, customer.id, !customer.creditProfile.onHold)} className="flex items-end gap-2">
                  {!customer.creditProfile.onHold && (
                    <label className="flex flex-col gap-1 text-xs text-[var(--color-ink-muted)]">
                      Hold reason
                      <input name="reason" className={inputClass} />
                    </label>
                  )}
                  <Button type="submit" variant={customer.creditProfile.onHold ? "secondary" : "danger"}>
                    {customer.creditProfile.onHold ? "Release hold" : "Place on hold"}
                  </Button>
                </form>
              </div>
            )}
          </Card>
        </section>
      )}

      {canBankRead && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Bank accounts</h2>
          {customer.bankAccounts.length === 0 ? (
            <EmptyState title="No bank accounts on file." />
          ) : (
            <div className="flex flex-col gap-2">
              {customer.bankAccounts.map((account) => {
                const masked = maskBankAccount(account);
                return (
                  <Card key={account.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">{account.bankName ?? account.accountHolder}</p>
                      <p className="text-sm text-[var(--color-ink-muted)]">
                        {masked.sortCode && <>Sort code {masked.sortCode} · </>}
                        {masked.accountNumber && <>Account {masked.accountNumber}</>}
                        {masked.iban && masked.iban}
                      </p>
                    </div>
                    <RevealBankAccount bankAccountId={account.id} partyId={customer.id} canReveal={canBankReveal} />
                  </Card>
                );
              })}
            </div>
          )}
          {canBankManage && (
            <details className="mt-3 rounded-[var(--radius-atlas-md)] border border-dashed border-[var(--color-border)] p-4">
              <summary className="cursor-pointer text-sm font-medium text-[var(--color-atlas-blue)]">Add bank account</summary>
              <form action={createBankAccountFormAction.bind(null, customer.id)} className="mt-3 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <input name="accountHolder" placeholder="Account holder" required className={inputClass} />
                  <input name="bankName" placeholder="Bank name" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input name="sortCode" placeholder="Sort code (UK)" className={inputClass} />
                  <input name="accountNumber" placeholder="Account number (UK)" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input name="iban" placeholder="IBAN (international)" className={inputClass} />
                  <input name="bic" placeholder="BIC/SWIFT" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input name="country" placeholder="Country" defaultValue="GB" className={inputClass} />
                  <input name="currency" placeholder="Currency" defaultValue="GBP" className={inputClass} />
                </div>
                <Button type="submit" variant="primary" className="self-start">
                  Add bank account
                </Button>
              </form>
            </details>
          )}

          <h2 className="mb-3 mt-6 text-sm font-medium text-[var(--color-ink-muted)]">Direct Debit</h2>
          {customer.directDebitMandates.length === 0 ? (
            <EmptyState title="No Direct Debit mandates." />
          ) : (
            <div className="flex flex-col gap-2">
              {customer.directDebitMandates.map((mandate) => (
                <Card key={mandate.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">
                      {mandate.scheme.replace("_", " ")} · {mandate.mandateReference}
                    </p>
                    <p className="text-xs text-[var(--color-ink-faint)]">
                      {mandate.bankAccount.bankName ?? mandate.bankAccount.accountHolder} ·{" "}
                      {maskBankAccount(mandate.bankAccount).accountNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill label={mandate.status} tone={DD_STATUS_TONE[mandate.status]} />
                    {canBankManage && mandate.status === "ACTIVE" && (
                      <form action={cancelDirectDebitFormAction.bind(null, mandate.id, customer.id)}>
                        <Button type="submit" variant="ghost">
                          Cancel mandate
                        </Button>
                      </form>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
          {canBankManage && customer.bankAccounts.length > 0 && (
            <details className="mt-3 rounded-[var(--radius-atlas-md)] border border-dashed border-[var(--color-border)] p-4">
              <summary className="cursor-pointer text-sm font-medium text-[var(--color-atlas-blue)]">Set up Direct Debit</summary>
              <form action={createDirectDebitFormAction.bind(null, customer.id)} className="mt-3 flex flex-col gap-3">
                <select name="bankAccountId" required className={inputClass}>
                  {customer.bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bankName ?? account.accountHolder} · {maskBankAccount(account).accountNumber}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select name="scheme" defaultValue="BACS" className={inputClass}>
                    <option value="BACS">BACS</option>
                    <option value="SEPA_CORE">SEPA Core</option>
                    <option value="SEPA_B2B">SEPA B2B</option>
                  </select>
                  <input name="mandateReference" placeholder="Mandate reference" required className={inputClass} />
                </div>
                <Button type="submit" variant="primary" className="self-start">
                  Create mandate
                </Button>
              </form>
            </details>
          )}
        </section>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--color-ink)]">{value}</p>
      <p className="text-xs text-[var(--color-ink-muted)]">{label}</p>
    </div>
  );
}
