import { db } from "@/core/db/client";

/** Customers' contacts become marketing profiles, so Marketing can see who Sales sells to and attribute
 * orders to campaigns. A profile is not consent: nobody is emailed until a marketing permission is recorded. */
export async function syncCustomerProfiles(organisationId: string, limit = 500) {
  const contacts = await db.contact.findMany({ where: { party: { organisationId }, email: { not: null }, marketingProfile: null }, select: { id: true, partyId: true, party: { select: { countryOfRegistration: true } } }, take: limit });
  if (!contacts.length) return 0;
  const created = await db.marketingProfile.createMany({ skipDuplicates: true, data: contacts.map((contact) => ({ organisationId, contactId: contact.id, partyId: contact.partyId, source: "Customer record", country: contact.party.countryOfRegistration ?? "", brand: "DEFAULT" })) });
  return created.count;
}

/** Scheduler: keep every company that uses Marketing in step with its customer records. */
export async function syncAllCustomerProfiles() {
  const companies = await db.moduleState.findMany({ where: { moduleId: "marketing", enabled: true, entitled: true }, select: { organisationId: true } });
  let total = 0;
  for (const company of companies) total += await syncCustomerProfiles(company.organisationId, 200);
  return total;
}
