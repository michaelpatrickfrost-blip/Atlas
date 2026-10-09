import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { SETUP_CATALOGUE } from "@/core/setup/catalogue";
import { readCompanyProfile } from "@/core/setup/company-profile";
import { ConsoleNav } from "../../console-nav";
import { SetupPortal } from "../../setup-portal";
import { SetupBrand } from "../../setup-brand";

export default async function CompanySetupPage({ params }: { params: Promise<{ organisationId: string }> }) {
  const session = await requireSession();
  assertCapability(session, "atlas.companies.manage");
  const { organisationId } = await params;
  const org = await db.organisation.findUnique({
    where: { id: organisationId, kind: "CUSTOMER", archivedAt: null },
    select: {
      id: true,
      name: true,
      logoDataUrl: true,
      companyProfile: true,
      _count: { select: { parties: true, products: true, priceLists: true, warehouses: true, employees: true } },
    },
  });
  if (!org) notFound();

  const profile = readCompanyProfile(org.companyProfile);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <ConsoleNav organisationId={org.id} current="setup" />

      {/* Brand setup first — customers should personalise before importing data */}
      <section>
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-blue-600">Step 1 · White-label</p>
          <h2 className="text-2xl font-semibold tracking-tight">Company identity</h2>
        </div>
        <SetupBrand organisationId={org.id} name={org.name} logoDataUrl={org.logoDataUrl} profile={profile} />
      </section>

      {/* Data import portal */}
      <section>
        <div className="rounded-3xl bg-[#12213c] p-8 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-blue-300">Step 2 · Data setup</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Import your business data</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Download a template, fill it in, check it, then import. Files load into this company only. {org._count.parties} customers,{" "}
            {org._count.products} products, {org._count.priceLists} price lists, {org._count.warehouses} warehouses and {org._count.employees} people are already
            here.
          </p>
        </div>
        <div className="mt-6">
          <SetupPortal organisationId={org.id} templates={SETUP_CATALOGUE.map(({ id, group, title, summary, columns, notes }) => ({ id, group, title, summary, columns, notes }))} />
        </div>
      </section>
    </div>
  );
}
