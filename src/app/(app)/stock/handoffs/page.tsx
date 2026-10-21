import {addQuantity} from "@/core/shared/quantity";
import Link from "next/link";
import { PackageCheck, Factory, ArrowRight, Boxes } from "lucide-react";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/core/auth/session";
import { isModuleEnabled } from "@/core/modules/runtime";
import { readProductionHandoffs } from "@/modules/stock/services/production-handoff";
import { ActionForm } from "@/components/ui/action-form";
import { CreateDialog } from "@/components/ui/create-dialog";
import { collectBatch } from "./actions";
const field =
  "mt-1.5 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";
export default async function Handoffs({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string; page?: string }>;
}) {
  const session = await requireSession();
  const query = await searchParams,
    data = await readProductionHandoffs(session, query),
    manage = session.capabilities.has("stock.manage");
  const showOrder =
    session.capabilities.has("manufacturing.order.read") &&
    (await isModuleEnabled(session, "manufacturing"));
  const pageHref = (page: number) => {
    const q = new URLSearchParams({
      q: data.search,
      state: data.all ? "all" : "pending",
      page: String(page),
    });
    return `/stock/handoffs?${q}`;
  };
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-blue-100 bg-[var(--color-surface)] p-6 sm:p-8">
        <p className="flex items-center gap-2 text-xs font-semibold text-blue-600">
          <Factory size={17} /> Production → Warehouse
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Finished batches, ready to collect.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Production books finished goods into its holding area. Warehouse
          checks the batch, collects the actual quantity and books it into the
          destination yard or storage location.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
          <span className="rounded-full bg-blue-50 px-3 py-2 text-blue-700">
            1. Produced & held
          </span>
          <ArrowRight size={14} />
          <span className="rounded-full bg-blue-50 px-3 py-2 text-blue-700">
            2. Collected & booked
          </span>
          <ArrowRight size={14} />
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">
            3. Available in the yard
          </span>
        </div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <PackageCheck size={20} className="text-blue-600" />
          <strong className="text-xl text-slate-900">
            {data.pendingCount}
          </strong>{" "}
          batches awaiting full collection
        </p>
        <Link
          href="/guides/production-handoff"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-600"
        >
          How production handoff works →
        </Link>
      </div>
      <form className="grid items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_220px_auto]">
        <label className="text-sm">
          Find a batch
          <input
            className={field}
            type="search"
            name="q"
            defaultValue={data.search}
            maxLength={100}
            placeholder="Batch reference, product name or code"
          />
        </label>
        <label className="text-sm">
          Show
          <select
            className={field}
            name="state"
            defaultValue={data.all ? "all" : "pending"}
          >
            <option value="pending">Awaiting collection</option>
            <option value="all">All batches & history</option>
          </select>
        </label>
        <button className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white">
          Apply filters
        </button>
      </form>
      <section aria-label="Production batches" className="space-y-4">
        {data.rows.map((batch) => {
          const remaining = addQuantity(Number(batch.quantity),-Number(batch.collectedQuantity));
          return (
            <article
              key={batch.id}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-blue-600">
                    Batch {batch.lotCode} · {batch.product.code}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    {batch.product.name}
                  </h2>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    {batch.warehouse.name} · {batch.location.name} · Produced{" "}
                    {batch.createdAt.toLocaleString("en-GB", {
                      timeZone: "Europe/London",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${remaining ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                >
                  {remaining
                    ? Number(batch.collectedQuantity)
                      ? "Part collected"
                      : "Awaiting collection"
                    : "Collected"}
                </span>
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4">
                {[
                  ["Produced", Number(batch.quantity)],
                  ["Collected", Number(batch.collectedQuantity)],
                  ["To collect", remaining],
                ].map(([label, quantity]) => (
                  <div key={String(label)}>
                    <dt className="text-xs text-slate-500">{String(label)}</dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-900">
                      {Number(quantity).toLocaleString("en-GB",{maximumFractionDigits:6})}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        {batch.product.unitOfMeasure}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                {manage &&
                  remaining > 0 &&
                  (data.locations.length ? (
                    <CreateDialog
                      label="Collect & book into yard"
                      title={`Collect batch ${batch.lotCode}`}
                    >
                      <ActionForm action={collectBatch} className="space-y-4">
                        <input type="hidden" name="batchId" value={batch.id} />
                        <input
                          type="hidden"
                          name="version"
                          value={batch.version}
                        />
                        <input
                          type="hidden"
                          name="requestKey"
                          value={`collect:${randomUUID()}`}
                        />
                        <p className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-slate-600">
                          Check the physical batch before booking. Only the
                          quantity you collect becomes available at the
                          destination; the remainder stays in production
                          holding.
                        </p>
                        <label className="block text-sm">
                          Quantity collected
                          <input
                            name="quantity"
                            type="number"
                            min={0.000001}
                            max={remaining}
                            step={0.000001}
                            required
                            defaultValue={remaining}
                            className={field}
                          />
                        </label>
                        {batch.product.trackingMode === "SERIAL" && <label className="block text-sm">Serials collected<textarea name="serials" required placeholder="One serial per collected unit" className={field}/></label>}
                        <label className="block text-sm">
                          Destination yard or storage location
                          <select
                            name="locationId"
                            required
                            defaultValue=""
                            className={field}
                          >
                            <option value="">
                              Choose where the batch has arrived
                            </option>
                            {data.locations.map((location) => (
                              <option key={location.id} value={location.id}>
                                {location.warehouse.kind === "YARD"
                                  ? "Yard"
                                  : "Warehouse"}{" "}
                                {location.warehouse.code} ·{" "}
                                {location.warehouse.name} / {location.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm">
                          Collection / booking reference
                          <textarea
                            name="note"
                            required
                            minLength={3}
                            maxLength={1000}
                            rows={3}
                            placeholder="Collected by Warehouse; booked to the north yard bay"
                            className={field}
                          />
                        </label>
                        <button className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white">
                          Confirm collection & stock booking
                        </button>
                      </ActionForm>
                    </CreateDialog>
                  ) : (
                    <Link
                      href="/stock/warehouses"
                      className="text-sm font-semibold text-blue-600"
                    >
                      Set up a destination yard or warehouse →
                    </Link>
                  ))}
                {showOrder && (
                  <Link
                    href={`/manufacturing/produce/${batch.manufacturingOrderId}`}
                    className="text-sm font-semibold text-blue-600"
                  >
                    Source production order →
                  </Link>
                )}
              </div>
              {!!batch.collections.length && (
                <details className="mt-5 border-t border-slate-100 pt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-600">
                    Collection history ({batch.collections.length}
                    {batch.collections.length === 20 ? " most recent" : ""})
                  </summary>
                  <ul className="mt-3 space-y-3">
                    {batch.collections.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-xl bg-slate-50 p-4 text-sm"
                      >
                        <p className="font-semibold">
                          {Number(item.quantity).toLocaleString("en-GB",{maximumFractionDigits:6})}{" "}
                          {batch.product.unitOfMeasure} → {item.warehouse.name}{" "}
                          / {item.location.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.createdAt.toLocaleString("en-GB", {
                            timeZone: "Europe/London",
                          })}{" "}
                          · {item.note} · Booked by {data.actorNames[item.actorUserId] ?? "Former colleague"}
                        </p>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </article>
          );
        })}
        {!data.rows.length && (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-white p-10 text-center">
            <Boxes size={30} className="mx-auto text-blue-500" />
            <h2 className="mt-4 text-lg font-semibold">
              {data.search
                ? "No batch matches this search"
                : "The holding area is clear"}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-500">
              {data.search
                ? "Try the production reference or a product code."
                : "New production output appears here when its final operation completes. Earlier completed production keeps its existing stock booking and is not staged again."}
            </p>
          </div>
        )}
      </section>
      <nav
        aria-label="Batch pages"
        className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"
      >
        <p>
          {data.count
            ? `${data.page * 50 + 1}–${Math.min((data.page + 1) * 50, data.count)} of ${data.count}`
            : "0 batches"}
        </p>
        <div className="flex gap-5">
          {data.page > 0 && (
            <Link href={pageHref(data.page - 1)} className="text-blue-600">
              Previous
            </Link>
          )}
          {(data.page + 1) * 50 < data.count && (
            <Link href={pageHref(data.page + 1)} className="text-blue-600">
              Next →
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
