import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { agreementLabel, formatHours } from "@/core/pricing/agreements";
import { formatMoney } from "@/core/shared/money";
import { StatusPill } from "@/components/ui/status-pill";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { AgreementForm } from "../../agreement-form";
import { PriceCsv } from "../../price-sheet";
import { ProductSearch } from "../../product-search";
import { applyAgreementCsv, previewAgreementCsv, removeAgreementPrice, saveAgreementPrice } from "../../actions";

const field = "mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm";

export default async function AgreementPage({ params }: { params: Promise<{ agreementId: string }> }) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingRead);
  const { agreementId } = await params;
  const agreement = await db.commercialAgreement.findFirst({
    where: { id: agreementId, organisationId: session.organisationId },
    include: {
      party: { select: { id: true, name: true, customerCode: true } },
      priceList: { select: { id: true, name: true, currency: true } },
      prices: { include: { product: { select: { code: true, name: true } } }, orderBy: [{ product: { code: "asc" } }, { minimumQuantity: "asc" }] },
    },
  });
  if (!agreement) notFound();
  const manage = can(session, CORE_CAPABILITIES.pricingManage);
  const [customers, lists, products] = manage
    ? await Promise.all([
        db.party.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true, customerCode: true }, orderBy: { name: "asc" }, take: 500 }),
        db.priceList.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true, currency: true }, orderBy: { name: "asc" } }),
        db.product.findMany({ where: { organisationId: session.organisationId, active: true }, select: { id: true, code: true, name: true, basePriceAmount: true, baseCurrency: true }, orderBy: { code: "asc" } }),
      ])
    : [[], [], []];
  const status = agreementLabel(agreement.status, agreement.endsOn);
  const currency = agreement.priceList?.currency ?? "GBP";

  return (
    <div className="space-y-6">
      <Link href="/pricing/agreements" className="text-sm text-[var(--color-atlas-blue)]">All agreements</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">{agreement.number}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">{agreement.name}</h2>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            <Link href={`/customers/${agreement.party.id}?tab=commercial`} className="text-[var(--color-atlas-blue)]">{agreement.party.customerCode} · {agreement.party.name}</Link>
            {" · "}{agreement.startsOn.toLocaleDateString("en-GB")}{agreement.endsOn ? ` – ${agreement.endsOn.toLocaleDateString("en-GB")}` : " onwards"}
          </p>
        </div>
        <StatusPill label={status.label} tone={status.tone} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-[22px] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-atlas)]">
          <p className="text-xs text-[var(--color-ink-muted)]">Prices come from</p>
          <p className="mt-2 font-semibold">{agreement.priceList ? <Link href={`/pricing/${agreement.priceList.id}`} className="text-[var(--color-atlas-blue)]">{agreement.priceList.name}</Link> : "The customer’s usual list"}</p>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{agreement.paymentTerms || "No payment terms written down"}</p>
        </article>
        <article className="rounded-[22px] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-atlas)] sm:col-span-2">
          <p className="text-xs text-[var(--color-ink-muted)]">Service promise</p>
          <p className="mt-2 font-semibold">{agreement.slaName || "No named promise"}</p>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{[agreement.coverage, agreement.responseMinutes ? `Respond within ${formatHours(agreement.responseMinutes)}` : "", agreement.resolutionMinutes ? `Resolve within ${formatHours(agreement.resolutionMinutes)}` : ""].filter(Boolean).join(" · ") || "Add coverage and response times when you have promised them."}</p>
          {agreement.slaNotes && <p className="mt-2 text-sm">{agreement.slaNotes}</p>}
        </article>
      </div>

      <section className="overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-white shadow-[var(--shadow-atlas)]">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h3 className="text-sm font-semibold">Special prices</h3>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">These beat the price list while the agreement is active. Leave this empty to charge the whole list.</p>
        </div>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-faint)]">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">From qty</th>
              <th className="px-3 py-3 text-right font-medium">Price</th>
              {manage && <th className="px-5 py-3" />}
            </tr>
          </thead>
          <tbody>
            {agreement.prices.map((price) => (
              <tr key={price.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-5 py-3"><span className="font-medium">{price.product.code}</span><span className="mt-0.5 block text-xs text-[var(--color-ink-muted)]">{price.product.name}</span></td>
                <td className="px-3 py-3">{price.minimumQuantity}</td>
                <td className="px-3 py-3 text-right font-medium">{formatMoney(price.unitPriceAmount, currency)}</td>
                {manage && (
                  <td className="px-5 py-3 text-right">
                    <form action={removeAgreementPrice.bind(null, agreement.id, price.id)}><button type="submit" className="text-xs text-[var(--color-ink-muted)]">Remove</button></form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!agreement.prices.length && <p className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">No special prices. The price list covers this customer.</p>}
        {manage && (
          <ActionForm action={saveAgreementPrice.bind(null, agreement.id)} className="grid gap-3 border-t border-[var(--color-border)] p-5 sm:grid-cols-[1.4fr_0.6fr_0.6fr_auto] sm:items-end">
            <ProductSearch products={products.map((product) => ({ id: product.id, code: product.code, name: product.name, price: product.baseCurrency === currency ? product.basePriceAmount / 100 : undefined }))} fillPrice="price" />
            <label className="text-sm">From quantity<input name="quantity" type="number" min="1" step="1" defaultValue="1" required className={field} /></label>
            <label className="text-sm">Price ({currency})<input name="price" type="number" min="0" step="0.01" required className={field} /></label>
            <Button type="submit" variant="primary">Add price</Button>
          </ActionForm>
        )}
      </section>

      {manage && (
        <PriceCsv
          preview={previewAgreementCsv.bind(null, agreement.id)}
          apply={applyAgreementCsv.bind(null, agreement.id)}
          templateHref="/api/import-template?entity=prices"
          sheetHref={`/api/pricing-sheet?agreementId=${agreement.id}`}
        />
      )}

      {manage && (
        <section className="rounded-[22px] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-atlas)]">
          <h3 className="mb-4 text-sm font-semibold">Edit the agreement</h3>
          <AgreementForm agreement={agreement} customers={customers} lists={lists} />
        </section>
      )}
      {agreement.notes && !manage && <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">{agreement.notes}</p>}
    </div>
  );
}
