import { db } from "@/core/db/client";
import { normalizeTaxNumber } from "@/core/customers/tax";

export type DuplicateCandidate = {
  id: string;
  customerCode: string;
  name: string;
  matchedOn: string;
  location: string | null;
};

/**
 * Signals: legal/trading name, registration number, a tax registration number
 * (normalised), or an email domain shared with an existing contact (§8). Never
 * merges automatically — only surfaces candidates for the user to confirm.
 */
export async function findPossibleDuplicates(
  organisationId: string,
  input: { name: string; registrationNumber?: string; taxNumber?: string; email?: string },
): Promise<DuplicateCandidate[]> {
  const candidates = new Map<string, DuplicateCandidate>();

  const nameMatches = await db.party.findMany({
    where: {
      organisationId,
      OR: [
        { name: { equals: input.name, mode: "insensitive" } },
        { tradingName: { equals: input.name, mode: "insensitive" } },
      ],
    },
    include: { addresses: { where: { type: "BILLING" }, take: 1 } },
  });
  for (const party of nameMatches) {
    candidates.set(party.id, toCandidate(party, "Name"));
  }

  if (input.registrationNumber) {
    const regMatches = await db.party.findMany({
      where: { organisationId, registrationNumber: input.registrationNumber },
      include: { addresses: { where: { type: "BILLING" }, take: 1 } },
    });
    for (const party of regMatches) {
      candidates.set(party.id, toCandidate(party, "Company registration number"));
    }
  }

  if (input.taxNumber) {
    const normalized = normalizeTaxNumber(input.taxNumber);
    const taxMatches = await db.taxRegistration.findMany({
      where: { normalizedNumber: normalized, party: { organisationId } },
      include: { party: { include: { addresses: { where: { type: "BILLING" }, take: 1 } } } },
    });
    for (const registration of taxMatches) {
      candidates.set(registration.party.id, toCandidate(registration.party, "VAT/tax number"));
    }
  }

  if (input.email) {
    const domain = input.email.split("@")[1]?.toLowerCase();
    if (domain) {
      const contactMatches = await db.contact.findMany({
        where: { email: { endsWith: `@${domain}`, mode: "insensitive" }, party: { organisationId } },
        include: { party: { include: { addresses: { where: { type: "BILLING" }, take: 1 } } } },
      });
      for (const contact of contactMatches) {
        if (!candidates.has(contact.party.id)) {
          candidates.set(contact.party.id, toCandidate(contact.party, "Contact email domain"));
        }
      }
    }
  }

  return Array.from(candidates.values());
}

function toCandidate(
  party: { id: string; customerCode: string; name: string; addresses: { city: string | null; country: string | null }[] },
  matchedOn: string,
): DuplicateCandidate {
  const address = party.addresses[0];
  const location = address ? [address.city, address.country].filter(Boolean).join(", ") || null : null;
  return { id: party.id, customerCode: party.customerCode, name: party.name, matchedOn, location };
}
