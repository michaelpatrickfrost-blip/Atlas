import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, TrendingUp, Network, Users } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { getCustomer } from "@/core/customers/queries";
import { db } from "@/core/db/client";
import { formatMoney } from "@/core/shared/money";
import { APPOINTMENT_TYPES } from "@/modules/crm/domain/appointments";
import { ownerRestriction } from "@/modules/crm/services/visibility";
import { AccountNotes } from "@/components/customers/account-notes";
import { WorkspaceHeading, WorkspaceLinks } from "@/components/ui/workspace";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ partyId: string }>;
}) {
  const session = await requireSession();
  assertCapability(session, "customers.read");
  await assertModuleEnabled(session, "crm");
  const { partyId } = await params,
    customer = await getCustomer(session.organisationId, partyId);
  if (!customer) notFound();
  const scope = {
    organisationId: session.organisationId,
    partyId,
    ...(ownerRestriction(session) ? { ownerUserId: session.userId } : {}),
  };
  const [deals, appointments] = await Promise.all([
    can(session, "sales.opportunity.read")
      ? db.opportunity.findMany({
          where: { ...scope, status: "OPEN" },
          include: { stage: { select: { name: true } } },
          orderBy: { nextActionAt: "asc" },
          take: 20,
        })
      : [],
    can(session, "sales.opportunity.read")
      ? db.salesActivity.findMany({
          where: {
            ...scope,
            type: { in: [...APPOINTMENT_TYPES] },
            completedAt: null,
            cancelledAt: null,
            dueAt: { not: null },
          },
          orderBy: { dueAt: "asc" },
          take: 10,
        })
      : [],
  ]);
  const links = [
    {
      title: "Customer record",
      description: "Contacts, addresses and commercial details",
      href: `/customers/${partyId}`,
      icon: Users,
    },
    {
      title: "Customer hierarchy",
      description: "This account’s group, branches and people",
      href: `/customers/${partyId}?tab=relationships`,
      icon: Network,
    },
    ...(can(session, "sales.opportunity.read")
      ? [
          {
            title: "Appointments",
            description: "Plan the next customer conversation",
            href: `/crm/appointments?party=${partyId}`,
            icon: CalendarDays,
          },
          {
            title: "Pipeline",
            description: "Develop the next sales opportunity",
            href: "/crm/pipeline",
            icon: TrendingUp,
          },
        ]
      : []),
  ];
  return (
    <div className="min-w-0 space-y-5">
      <Link href="/crm/accounts" className="text-xs font-medium text-slate-500">
        ← CRM accounts
      </Link>
      <WorkspaceHeading
        eyebrow={`${customer.customerCode} · ${customer.status.toLowerCase().replaceAll("_", " ")}`}
        title={customer.name}
        description={
          customer.tradingName
            ? `Trading as ${customer.tradingName}`
            : "Your account workspace. Keep the conversation, people and opportunities together."
        }
        actions={
          <Link
            href={`/customers/${partyId}`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-600"
          >
            Full customer details
          </Link>
        }
      />
      <WorkspaceLinks items={links} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <AccountNotes
          partyId={partyId}
          notes={customer.notes}
          session={session}
        />
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold">Key people</h3>
            <div className="mt-4 space-y-3">
              {customer.contacts
                .filter((contact) => contact.status === "ACTIVE")
                .slice(0, 5)
                .map((contact) => (
                  <article
                    key={contact.id}
                    className="rounded-xl bg-slate-50 p-3"
                  >
                    <p className="text-sm font-semibold">
                      {contact.firstName} {contact.surname}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {contact.jobTitle || "Contact"}
                      {contact.isPrimary ? " · Primary contact" : ""}
                    </p>
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="mt-2 block break-all text-xs text-blue-600"
                      >
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="mt-1 block text-xs text-slate-500"
                      >
                        {contact.phone}
                      </a>
                    )}
                  </article>
                ))}
              {!customer.contacts.length && (
                <Link
                  href={`/customers/${partyId}?tab=contacts`}
                  className="text-sm text-blue-600"
                >
                  Add the first contact →
                </Link>
              )}
            </div>
          </section>
          {can(session, "sales.opportunity.read") && (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold">Open deals</h3>
                {deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/crm/opportunities/${deal.id}`}
                    className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {deal.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {deal.stage.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-blue-600">
                      {formatMoney(deal.valueAmount, deal.valueCurrency)}
                    </span>
                  </Link>
                ))}
                {!deals.length && (
                  <p className="mt-3 text-sm text-slate-400">
                    No visible open deals for this account.
                  </p>
                )}
              </section>
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold">
                  Next conversations & activities
                </h3>
                {appointments.map((appointment) => (
                  <Link
                    key={appointment.id}
                    href={`/crm/appointments?focus=${appointment.id}`}
                    className="mt-3 block rounded-xl bg-blue-50/60 p-3"
                  >
                    <p className="text-sm font-semibold">
                      {appointment.subject}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {appointment.dueAt?.toLocaleString("en-GB", {
                        timeZone: "Europe/London",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · London time
                    </p>
                  </Link>
                ))}
                {!appointments.length && (
                  <p className="mt-3 text-sm text-slate-400">
                    No scheduled activity. Plan the next conversation in
                    Appointments.
                  </p>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
