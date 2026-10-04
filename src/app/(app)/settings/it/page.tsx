import Link from "next/link";
import { Mail, Share2, LayoutTemplate } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";

function sevenDaysAgo() { return new Date(Date.now() - 7 * 86400000); }

export default async function ItOverview() {
  const session = await requireSession();
  const admin = can(session, CORE_CAPABILITIES.itManage);
  const [mail, mine, social, templates, queued, failed] = await Promise.all([
    db.emailAccount.count({ where: { organisationId: session.organisationId, scope: "COMPANY", active: true } }),
    db.emailAccount.count({ where: { organisationId: session.organisationId, scope: "PERSONAL", ownerUserId: session.userId, active: true } }),
    db.socialAccount.count({ where: { organisationId: session.organisationId, active: true } }),
    db.emailTemplate.count({ where: { organisationId: session.organisationId } }),
    db.emailMessage.count({ where: { organisationId: session.organisationId, status: "QUEUED" } }),
    db.emailMessage.count({ where: { organisationId: session.organisationId, status: "FAILED", createdAt: { gte: sevenDaysAgo() } } }),
  ]);
  const cards = [
    { href: "/settings/it/email", icon: Mail, title: "Email accounts", body: `${mail} company mailbox${mail === 1 ? "" : "es"}, ${mine} of yours. Send from your own address or the company's.` },
    { href: "/settings/it/templates", icon: LayoutTemplate, title: "Email templates", body: `${templates} branded template${templates === 1 ? "" : "s"}. Used by Sales, Automations, surveys and Marketing.` },
    ...(admin ? [{ href: "/settings/it/social", icon: Share2, title: "Social accounts", body: `${social} connected. Marketing's scheduler publishes through these.` }] : []),
  ];
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">IT</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">Mailboxes, social accounts and branded templates. Automations, Sales, CRM and Marketing all send through what you set up here.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300">
            <c.icon className="mb-4 text-blue-500" size={22} />
            <h3 className="text-base font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{c.body}</p>
          </Link>
        ))}
      </div>
      <p className="text-xs text-slate-500">Outbound queue: {queued} waiting, {failed} failed in the last 7 days.</p>
    </div>
  );
}
