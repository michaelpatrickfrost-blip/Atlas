import type { ProjectBase } from "@/modules/crm/domain/sales-project";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { formatMoney } from "@/core/shared/money";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { CreateDialog } from "@/components/ui/create-dialog";
import { StatusPill } from "@/components/ui/status-pill";
import { getSalesProject } from "@/modules/crm/services/sales-projects-queries";
import { ORGANISATION_ROLES, STAGES, STAKEHOLDER_ROLES, stageLabel, stageTone } from "@/modules/crm/domain/sales-project";
import { addProjectOrganisationAction, addProjectStakeholderAction, deleteSalesProjectAction, makePrimaryOrganisationAction, removeProjectOrganisationAction, removeProjectStakeholderAction, saveNextActionAction, saveSalesProjectAction, setDocumentSalesProjectAction } from "@/modules/crm/services/sales-projects-commands";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";
const panel = "rounded-2xl border border-slate-200 bg-white p-5";
const small = "rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900";
const day = (value: Date | null) => (value ? value.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const iso = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : "");
const pounds = (value: number | null) => (value == null ? "" : (value / 100).toFixed(2));

function Roles({ options }: { options: readonly string[] }) {
  return <fieldset><legend className="text-xs font-medium">Roles on this project</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{options.map((role) => <label key={role} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="roles" value={role} className="size-4 rounded border-slate-300" />{stageLabel(role)}</label>)}</div></fieldset>;
}

export async function SalesProjectDetail({ base, params }: { base: ProjectBase; params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityRead);
  const organisationId = session.organisationId;
  const project = await getSalesProject(projectId, organisationId);
  if (!project) notFound();
  const manage = can(session, SALES_CAPABILITIES.opportunityManage);
  const seeQuotes = can(session, SALES_CAPABILITIES.quoteRead), seeOrders = can(session, SALES_CAPABILITIES.orderRead);
  const partyIds = project.organisations.map((row) => row.partyId);
  const [parties, contacts, quotes, orders, industries, owner] = await Promise.all([
    manage ? db.party.findMany({ where: { organisationId }, select: { id: true, name: true, customerCode: true }, orderBy: { name: "asc" } }) : [],
    manage && partyIds.length ? db.contact.findMany({ where: { partyId: { in: partyIds }, party: { organisationId } }, select: { id: true, firstName: true, surname: true, jobTitle: true, party: { select: { name: true } } }, orderBy: { surname: "asc" } }) : [],
    manage && seeQuotes ? db.quote.findMany({ where: { organisationId, salesProjectId: null }, select: { id: true, reference: true, partyId: true, totalAmount: true, totalCurrency: true, party: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 300 }) : [],
    manage && seeOrders ? db.salesOrder.findMany({ where: { organisationId, salesProjectId: null }, select: { id: true, reference: true, partyId: true, grossAmount: true, currency: true, party: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 300 }) : [],
    manage ? db.crmIndustry.findMany({ where: { organisationId }, select: { id: true, name: true }, orderBy: { name: "asc" } }) : [],
    db.user.findUnique({ where: { id: project.ownerUserId }, select: { name: true } }),
  ]);
  const primary = project.organisations.find((row) => row.isPrimary) ?? project.organisations[0];
  const mine = <T extends { partyId: string }>(rows: T[]) => [...rows].sort((a, b) => Number(partyIds.includes(b.partyId)) - Number(partyIds.includes(a.partyId)));
  const currency = project.potentialValueCurrency;
  const quoted = project.quotes.filter((quote) => quote.status !== "DECLINED").reduce((sum, quote) => sum + quote.totalAmount, 0);
  const ordered = project.orders.filter((order) => order.commercialStatus !== "CANCELLED").reduce((sum, order) => sum + order.grossAmount, 0);
  const potential = project.potentialValueAmount ?? 0;
  const figures: [string, string, string][] = [
    ["Potential", project.potentialValueAmount == null ? "—" : formatMoney(potential, currency), project.probability == null ? "No probability set" : `${project.probability}% likely · ${formatMoney(Math.round((potential * project.probability) / 100), currency)} weighted`],
    ["Quoted", formatMoney(quoted, currency), `${project.quotes.length} quotation${project.quotes.length === 1 ? "" : "s"}`],
    ["Awarded", project.awardedValueAmount == null ? "—" : formatMoney(project.awardedValueAmount, currency), "Set when the job is awarded"],
    ["Ordered", formatMoney(ordered, currency), `${project.orders.length} order${project.orders.length === 1 ? "" : "s"}`],
    ["Still to convert", formatMoney(Math.max(0, potential - ordered), currency), "Potential less ordered"],
  ];
  const hidden = <><input type="hidden" name="projectId" value={project.id} /><input type="hidden" name="base" value={base} /></>;

  return <div className="space-y-5">
    <Link href={base} className="text-xs text-slate-500">← All projects</Link>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{project.reference}{primary ? ` · ${primary.party.name}` : ""}{project.industry ? ` · ${project.industry.name}` : ""}</p>
        <h2 className="mt-2 flex flex-wrap items-center gap-3 text-2xl font-semibold tracking-tight">{project.name}<StatusPill label={stageLabel(project.stage)} tone={stageTone(project.stage)} /></h2>
        <p className="mt-2 text-sm text-slate-500">Owner {owner?.name ?? "—"} · in this stage since {day(project.stageEnteredAt)}</p>
        {project.description && <p className="mt-2 max-w-2xl text-sm text-slate-600">{project.description}</p>}
      </div>
      {manage && <div className="flex flex-wrap gap-2">
        {seeQuotes && can(session, SALES_CAPABILITIES.quoteCreate) && <Link href={`/sales/quotes/new?salesProject=${project.id}${primary ? `&customer=${primary.partyId}` : ""}`} className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700">New quotation</Link>}
        {seeOrders && can(session, SALES_CAPABILITIES.orderCreate) && <Link href={`/sales/orders/new?salesProject=${project.id}${primary ? `&customer=${primary.partyId}` : ""}`} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">New order</Link>}
        <CreateDialog label="Edit project" title="Edit project" variant="secondary"><ActionForm action={saveSalesProjectAction}><div className="space-y-4">
          {hidden}
          <label className="block text-xs font-medium">Project name<input name="name" required maxLength={200} defaultValue={project.name} className={field} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium">Stage<select name="stage" defaultValue={project.stage} className={field}>{STAGES.map((stage) => <option key={stage} value={stage}>{stageLabel(stage)}</option>)}</select></label>
            <label className="block text-xs font-medium">Industry<select name="industryId" defaultValue={project.industryId ?? ""} className={field}><option value="">Not set</option>{industries.map((industry) => <option key={industry.id} value={industry.id}>{industry.name}</option>)}</select></label>
            <label className="block text-xs font-medium">Potential value ({currency})<input name="potentialValue" type="number" min={0} step="0.01" defaultValue={pounds(project.potentialValueAmount)} className={field} /></label>
            <label className="block text-xs font-medium">Probability (%)<input name="probability" type="number" min={0} max={100} step={1} defaultValue={project.probability ?? ""} className={field} /></label>
            <label className="block text-xs font-medium">Awarded value ({currency})<input name="awardedValue" type="number" min={0} step="0.01" defaultValue={pounds(project.awardedValueAmount)} className={field} /></label>
            <label className="block text-xs font-medium">Target award date<input name="targetAwardDate" type="date" defaultValue={iso(project.targetAwardDate)} className={field} /></label>
            <label className="block text-xs font-medium">Expected start<input name="expectedStartDate" type="date" defaultValue={iso(project.expectedStartDate)} className={field} /></label>
            <label className="block text-xs font-medium">Expected completion<input name="expectedCompletionDate" type="date" defaultValue={iso(project.expectedCompletionDate)} className={field} /></label>
          </div>
          <label className="block text-xs font-medium">Description<textarea name="description" rows={3} maxLength={2000} defaultValue={project.description ?? ""} className={field} /></label>
          <label className="block text-xs font-medium">Notes<textarea name="notes" rows={3} maxLength={5000} defaultValue={project.notes ?? ""} className={field} /></label>
          <Button type="submit" variant="primary">Save project</Button>
        </div></ActionForm></CreateDialog>
      </div>}
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{figures.map(([label, value, note]) => <figure key={label} className={panel}><figcaption className="text-xs text-slate-500">{label}</figcaption><p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p><p className="mt-2 text-xs text-slate-500">{note}</p></figure>)}</div>

    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-5">
        <section className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Organisations</h3><p className="mt-1 text-xs text-slate-500">Everyone involved in the job: client, contractor, specifier, merchant.</p></div>
            {manage && <CreateDialog label="Add organisation" title="Add an organisation" variant="secondary"><ActionForm action={addProjectOrganisationAction}><div className="space-y-4">
              {hidden}
              <label className="block text-xs font-medium">Organisation<select name="partyId" required className={field}><option value="">Choose from customer records</option>{parties.map((party) => <option key={party.id} value={party.id}>{party.customerCode} · {party.name}{partyIds.includes(party.id) ? " · already on project" : ""}</option>)}</select></label>
              <Roles options={ORGANISATION_ROLES} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPrimary" className="size-4 rounded border-slate-300" />Main commercial customer for this project</label>
              <label className="block text-xs font-medium">Note (optional)<input name="notes" maxLength={500} className={field} /></label>
              <div className="flex items-center gap-4"><Button type="submit" variant="primary">Add organisation</Button><Link href="/customers/new" className="text-xs font-medium text-blue-600">Not listed? Create a customer →</Link></div>
            </div></ActionForm></CreateDialog>}
          </div>
          {!project.organisations.length ? <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No organisations yet. Add the customer this project is for.</p> : <ul className="mt-4 divide-y divide-slate-100">{project.organisations.map((row) => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div><Link href={`/customers/${row.partyId}`} className="text-sm font-medium text-blue-700">{row.party.name}</Link><p className="mt-1 text-xs text-slate-500">{row.roles.length ? row.roles.map(stageLabel).join(" · ") : "No role set"}{row.notes ? ` · ${row.notes}` : ""}</p></div>
            <div className="flex items-center gap-1">{row.isPrimary && <StatusPill label="Main customer" tone="success" />}
              {manage && !row.isPrimary && <ActionForm action={makePrimaryOrganisationAction}>{hidden}<input type="hidden" name="linkId" value={row.id} /><button className={small}>Make main</button></ActionForm>}
              {manage && <ActionForm action={removeProjectOrganisationAction}>{hidden}<input type="hidden" name="linkId" value={row.id} /><button className={small}>Remove</button></ActionForm>}
            </div>
          </li>)}</ul>}
        </section>

        <section className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">People</h3><p className="mt-1 text-xs text-slate-500">Contacts at those organisations, and how they stand on this job.</p></div>
            {manage && (contacts.length ? <CreateDialog label="Add person" title="Add a person" variant="secondary"><ActionForm action={addProjectStakeholderAction}><div className="space-y-4">
              {hidden}
              <label className="block text-xs font-medium">Contact<select name="contactId" required className={field}><option value="">Choose a contact</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.firstName} {contact.surname} · {contact.party.name}{contact.jobTitle ? ` · ${contact.jobTitle}` : ""}</option>)}</select></label>
              <Roles options={STAKEHOLDER_ROLES} />
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-xs font-medium">Influence<select name="influence" className={field}><option value="">Not set</option><option value="STRONG">Strong</option><option value="MODERATE">Moderate</option><option value="WEAK">Weak</option></select></label>
                <label className="block text-xs font-medium">Relationship<select name="relationshipStrength" className={field}><option value="">Not set</option><option value="STRONG">Strong</option><option value="MODERATE">Moderate</option><option value="WEAK">Weak</option></select></label>
                <label className="block text-xs font-medium">Sentiment<select name="sentiment" className={field}><option value="">Not set</option><option value="POSITIVE">Positive</option><option value="NEUTRAL">Neutral</option><option value="NEGATIVE">Negative</option></select></label>
              </div>
              <label className="block text-xs font-medium">Note (optional)<input name="notes" maxLength={500} className={field} /></label>
              <Button type="submit" variant="primary">Add person</Button>
            </div></ActionForm></CreateDialog> : <p className="text-xs text-slate-500">{partyIds.length ? "These organisations have no contacts yet. Add contacts on the customer record." : "Add an organisation first."}</p>)}
          </div>
          {!project.stakeholders.length ? <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No people on this project yet.</p> : <ul className="mt-4 divide-y divide-slate-100">{project.stakeholders.map((row) => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div><p className="text-sm font-medium">{row.contact.firstName} {row.contact.surname}<span className="ml-2 text-xs font-normal text-slate-400">{[row.contact.jobTitle, row.contact.party?.name].filter(Boolean).join(" · ")}</span></p><p className="mt-1 text-xs text-slate-500">{[row.roles.map(stageLabel).join(" · "), row.influence && `${stageLabel(row.influence)} influence`, row.relationshipStrength && `${stageLabel(row.relationshipStrength)} relationship`, row.sentiment && stageLabel(row.sentiment), row.notes].filter(Boolean).join(" · ") || "No role set"}</p></div>
            {manage && <ActionForm action={removeProjectStakeholderAction}>{hidden}<input type="hidden" name="linkId" value={row.id} /><button className={small}>Remove</button></ActionForm>}
          </li>)}</ul>}
        </section>

        {seeQuotes && <section className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Quotations</h3><p className="mt-1 text-xs text-slate-500">{formatMoney(quoted, currency)} quoted on this project.</p></div>
            {manage && <CreateDialog label="Add existing quotation" title="Add an existing quotation" variant="secondary"><ActionForm action={setDocumentSalesProjectAction}><div className="space-y-4">
              <input type="hidden" name="kind" value="quote" /><input type="hidden" name="salesProjectId" value={project.id} />
              <label className="block text-xs font-medium">Quotation<select name="documentId" required className={field}><option value="">{quotes.length ? "Choose a quotation" : "Every quotation is already on a project"}</option>{mine(quotes).map((quote) => <option key={quote.id} value={quote.id}>{quote.reference} · {quote.party.name} · {formatMoney(quote.totalAmount, quote.totalCurrency)}</option>)}</select></label>
              <p className="text-xs text-slate-500">Quotations for this project&apos;s organisations are listed first. If the customer is not on the project yet, it is added.</p>
              <Button type="submit" variant="primary">Add to project</Button>
            </div></ActionForm></CreateDialog>}
          </div>
          {!project.quotes.length ? <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No quotations on this project yet.</p> : <ul className="mt-4 divide-y divide-slate-100">{project.quotes.map((quote) => <li key={quote.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <Link href={`/sales/quotes/${quote.id}`} className="text-sm font-medium text-blue-700">{quote.reference}</Link>
            <div className="flex items-center gap-3"><StatusPill label={stageLabel(quote.status)} tone={quote.status === "ACCEPTED" ? "success" : quote.status === "DECLINED" ? "danger" : "neutral"} /><span className="text-sm font-semibold tabular-nums">{formatMoney(quote.totalAmount, quote.totalCurrency)}</span>
              {manage && <ActionForm action={setDocumentSalesProjectAction}><input type="hidden" name="kind" value="quote" /><input type="hidden" name="documentId" value={quote.id} /><input type="hidden" name="salesProjectId" value="" /><button className={small}>Remove</button></ActionForm>}</div>
          </li>)}</ul>}
        </section>}

        {seeOrders && <section className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Sales orders</h3><p className="mt-1 text-xs text-slate-500">{formatMoney(ordered, currency)} ordered on this project. An order made from a project quotation is added automatically.</p></div>
            {manage && <CreateDialog label="Add existing order" title="Add an existing sales order" variant="secondary"><ActionForm action={setDocumentSalesProjectAction}><div className="space-y-4">
              <input type="hidden" name="kind" value="order" /><input type="hidden" name="salesProjectId" value={project.id} />
              <label className="block text-xs font-medium">Sales order<select name="documentId" required className={field}><option value="">{orders.length ? "Choose an order" : "Every order is already on a project"}</option>{mine(orders).map((order) => <option key={order.id} value={order.id}>{order.reference} · {order.party.name} · {formatMoney(order.grossAmount, order.currency)}</option>)}</select></label>
              <Button type="submit" variant="primary">Add to project</Button>
            </div></ActionForm></CreateDialog>}
          </div>
          {!project.orders.length ? <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No orders on this project yet.</p> : <ul className="mt-4 divide-y divide-slate-100">{project.orders.map((order) => <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <Link href={`/sales/orders/${order.id}`} className="text-sm font-medium text-blue-700">{order.reference}</Link>
            <div className="flex items-center gap-3"><StatusPill label={stageLabel(order.commercialStatus)} tone={order.commercialStatus === "CONFIRMED" ? "success" : order.commercialStatus === "CANCELLED" ? "danger" : "neutral"} /><span className="text-sm font-semibold tabular-nums">{formatMoney(order.grossAmount, order.currency)}</span>
              {manage && <ActionForm action={setDocumentSalesProjectAction}><input type="hidden" name="kind" value="order" /><input type="hidden" name="documentId" value={order.id} /><input type="hidden" name="salesProjectId" value="" /><button className={small}>Remove</button></ActionForm>}</div>
          </li>)}</ul>}
        </section>}
      </div>

      <div className="space-y-5">
        <section className={panel}>
          <h3 className="text-sm font-semibold">Next action</h3>
          {manage ? <ActionForm action={saveNextActionAction}><div className="mt-3 space-y-3">
            {hidden}
            <label className="block text-xs font-medium">What happens next<textarea name="nextActionNote" rows={3} maxLength={500} defaultValue={project.nextActionNote ?? ""} placeholder="Call the estimator about the revised drawings" className={field} /></label>
            <label className="block text-xs font-medium">Due<input name="nextActionAt" type="date" defaultValue={iso(project.nextActionAt)} className={field} /></label>
            <Button type="submit" variant="primary">Save next action</Button>
          </div></ActionForm> : <p className="mt-3 text-sm text-slate-600">{project.nextActionNote || "No next action set."}{project.nextActionAt ? ` · due ${day(project.nextActionAt)}` : ""}</p>}
        </section>
        <section className={panel}>
          <h3 className="text-sm font-semibold">Key dates</h3>
          <dl className="mt-3 space-y-2 text-sm">{([["Target award", project.targetAwardDate], ["Expected start", project.expectedStartDate], ["Expected completion", project.expectedCompletionDate], ["Created", project.createdAt], ["Last activity", project.lastActivityAt]] as [string, Date | null][]).map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-slate-500">{label}</dt><dd className="font-medium">{day(value)}</dd></div>)}</dl>
        </section>
        {project.notes && <section className={panel}><h3 className="text-sm font-semibold">Notes</h3><p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{project.notes}</p></section>}
        {manage && <section className={panel}><h3 className="text-sm font-semibold">Delete project</h3><p className="mt-2 text-xs text-slate-500">Quotations and orders are kept; they are only detached from this project.</p><ActionForm action={deleteSalesProjectAction}>{hidden}<Button type="submit" variant="danger" className="mt-3">Delete project</Button></ActionForm></section>}
      </div>
    </div>
  </div>;
}
