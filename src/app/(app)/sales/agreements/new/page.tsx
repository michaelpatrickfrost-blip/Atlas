import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { CallOffOrderForm } from "@/modules/sales/components/call-off-order-form";

export default async function NewCallOffOrder({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  const session = await requireSession();
  assertCapability(session, "sales.order.create");
  const { customer } = await searchParams;
  const [customers, products] = await Promise.all([
    db.party.findMany({ where: { organisationId: session.organisationId, status: { notIn: ["INACTIVE", "CLOSED"] } }, select: { id: true, name: true, customerCode: true }, orderBy: { name: "asc" } }),
    db.product.findMany({ where: { organisationId: session.organisationId, active: true }, select: { id: true, code: true, name: true, unitOfMeasure: true }, orderBy: { code: "asc" } }),
  ]);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/sales/agreements" className="text-sm text-slate-500">← Call-offs</Link>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">New call-off order</h2>
        <p className="mt-2 text-sm text-slate-500">Add the full quantity now. Deliveries and invoices later take only the items the customer wants that time.</p>
      </div>
      {customers.length && products.length ? <CallOffOrderForm initialCustomer={customer} customers={customers.map((row) => ({ id: row.id, name: row.name, code: row.customerCode }))} products={products.map((product) => ({ id: product.id, code: product.code, name: product.name, unit: product.unitOfMeasure }))} /> : <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Add a customer and a product before opening a call-off order.</p>}
    </div>
  );
}
