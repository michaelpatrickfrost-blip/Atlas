import { selectPriceRule, commercialPrice, ruleExplanation } from "./rules";
import { chooseAgreement } from "./agreements";
import { db } from "@/core/db/client";

export type ResolvedPrice = {
  unitPriceAmount: number;
  discountPercent: number;
  currency: string;
  source: string;
  validUntil: Date | null;
};

/** Walks parentPartyId up from a party, self first, stopping on a cycle or after 10 levels. */
async function ancestorChain(organisationId: string, partyId: string): Promise<string[]> {
  const chain: string[] = [];
  const seen = new Set<string>();
  let currentId: string | null = partyId;
  while (currentId && !seen.has(currentId) && chain.length < 10) {
    seen.add(currentId);
    chain.push(currentId);
    const current: { parentPartyId: string | null } | null = await db.party.findFirst({ where: { id: currentId, organisationId }, select: { parentPartyId: true } });
    currentId = current?.parentPartyId ?? null;
  }
  return chain;
}

export type AccountPricingAssignment = {
  /** The agreement setting this account's price list, own or inherited. Null if only a usual-list setting applies. */
  agreement: { id: string; name: string; priceListId: string | null; endsOn: Date | null } | null;
  /** The price list in effect for this account, from its own agreement/setting or inherited. */
  priceListId: string | null;
  /** Name of the ancestor account this assignment came from, when the account has none of its own. */
  inheritedFrom: string | null;
};

/**
 * What price list governs this account right now, for display — same precedence
 * as resolvePrice's own-agreement / own-usual-list / inherited-from-parent chain,
 * without the per-product special-price lookup.
 */
export async function resolveAccountPricing(organisationId: string, partyId: string, asOf = new Date()): Promise<AccountPricingAssignment> {
  const [party, agreements] = await Promise.all([
    db.party.findFirstOrThrow({ where: { id: partyId, organisationId }, include: { commercialSettings: { select: { priceList: true } } } }),
    db.commercialAgreement.findMany({
      where: { organisationId, partyId, status: "ACTIVE", startsOn: { lte: asOf }, OR: [{ endsOn: null }, { endsOn: { gte: asOf } }] },
      select: { id: true, name: true, priceListId: true, endsOn: true, startsOn: true, status: true },
    }),
  ]);

  const ownAgreement = chooseAgreement(agreements, asOf);
  if (ownAgreement) return { agreement: ownAgreement, priceListId: ownAgreement.priceListId, inheritedFrom: null };
  if (party.commercialSettings?.priceList) return { agreement: null, priceListId: party.commercialSettings.priceList, inheritedFrom: null };

  const chain = await ancestorChain(organisationId, partyId);
  for (const ancestorId of chain.slice(1)) {
    const [ancestorAgreements, ancestorParty] = await Promise.all([
      db.commercialAgreement.findMany({
        where: { organisationId, partyId: ancestorId, status: "ACTIVE", startsOn: { lte: asOf }, OR: [{ endsOn: null }, { endsOn: { gte: asOf } }] },
        select: { id: true, name: true, priceListId: true, endsOn: true, startsOn: true, status: true },
      }),
      db.party.findFirst({ where: { id: ancestorId, organisationId }, select: { name: true, commercialSettings: { select: { priceList: true } } } }),
    ]);
    const ancestorAgreement = chooseAgreement(ancestorAgreements, asOf);
    if (ancestorAgreement) return { agreement: ancestorAgreement, priceListId: ancestorAgreement.priceListId, inheritedFrom: ancestorParty?.name ?? "parent account" };
    if (ancestorParty?.commercialSettings?.priceList) return { agreement: null, priceListId: ancestorParty.commercialSettings.priceList, inheritedFrom: ancestorParty.name };
  }
  return { agreement: null, priceListId: null, inheritedFrom: null };
}

/**
 * Every price says where it came from.
 * An active agreement's special price, then a price saved on the customer
 * product, then the agreement's price list, the customer's usual list, or
 * the catalogue price. A document can still name a list, or pass null to
 * skip lists and use the catalogue after any special price.
 *
 * A branch with no agreement or price list of its own inherits the nearest
 * ancestor's (its parent group's, or further up) active agreement or usual
 * price list — see docs/CUSTOMER_MASTER.md. Setting either on the branch
 * itself overrides the inherited one.
 */
export async function resolvePrice(params: {
  organisationId: string;
  productId: string;
  partyId: string;
  quantity: number;
  priceListId?: string | null;
  asOf?: Date;
}): Promise<ResolvedPrice> {
  const asOf = params.asOf ?? new Date();
  const [product, party, customerProduct, agreements] = await Promise.all([
    db.product.findFirstOrThrow({ where: { id: params.productId, organisationId: params.organisationId } }),
    db.party.findFirstOrThrow({ where: { id: params.partyId, organisationId: params.organisationId }, include: { commercialSettings: true } }),
    db.customerProduct.findUnique({ where: { partyId_productId: { partyId: params.partyId, productId: params.productId } } }),
    db.commercialAgreement.findMany({
      where: {
        organisationId: params.organisationId,
        partyId: params.partyId,
        status: "ACTIVE",
        startsOn: { lte: asOf },
        OR: [{ endsOn: null }, { endsOn: { gte: asOf } }],
      },
      include: {
        priceList: { select: { currency: true } },
        prices: { where: { productId: params.productId, minimumQuantity: { lte: params.quantity } } },
      },
    }),
  ]);

  let agreement = chooseAgreement(agreements, asOf);
  let inheritedPriceListId: string | null = null;
  let inheritedFrom: string | null = null;

  if (!agreement && !party.commercialSettings?.priceList) {
    const chain = await ancestorChain(params.organisationId, params.partyId);
    for (const ancestorId of chain.slice(1)) {
      const [ancestorAgreements, ancestorParty] = await Promise.all([
        db.commercialAgreement.findMany({
          where: {
            organisationId: params.organisationId,
            partyId: ancestorId,
            status: "ACTIVE",
            startsOn: { lte: asOf },
            OR: [{ endsOn: null }, { endsOn: { gte: asOf } }],
          },
          include: {
            priceList: { select: { currency: true } },
            prices: { where: { productId: params.productId, minimumQuantity: { lte: params.quantity } } },
          },
        }),
        db.party.findFirst({ where: { id: ancestorId, organisationId: params.organisationId }, select: { name: true, commercialSettings: { select: { priceList: true } } } }),
      ]);
      const ancestorAgreement = chooseAgreement(ancestorAgreements, asOf);
      if (ancestorAgreement) {
        agreement = ancestorAgreement;
        inheritedFrom = ancestorParty?.name ?? "parent account";
        break;
      }
      if (ancestorParty?.commercialSettings?.priceList) {
        inheritedPriceListId = ancestorParty.commercialSettings.priceList;
        inheritedFrom = ancestorParty.name;
        break;
      }
    }
  }

  const special = agreement?.prices.slice().sort((a, b) => b.minimumQuantity - a.minimumQuantity || a.id.localeCompare(b.id))[0];
  if (special && agreement) {
    return {
      unitPriceAmount: special.unitPriceAmount,
      discountPercent: 0,
      currency: agreement.priceList?.currency ?? product.baseCurrency,
      source: `${agreement.name} · special price${inheritedFrom ? ` · inherited from ${inheritedFrom}` : ""}`,
      validUntil: agreement.endsOn,
    };
  }

  if (customerProduct?.contractedPriceAmount != null) {
    return {
      unitPriceAmount: customerProduct.contractedPriceAmount,
      discountPercent: 0,
      currency: customerProduct.contractedPriceCurrency ?? product.baseCurrency,
      source: "Customer contract price",
      validUntil: null,
    };
  }

  const priceListId = params.priceListId === undefined ? agreement?.priceListId ?? party.commercialSettings?.priceList ?? inheritedPriceListId ?? null : params.priceListId;
  if (priceListId) {
    const priceList = await db.priceList.findFirstOrThrow({ where: { id: priceListId, organisationId: params.organisationId } });
    const entries = await db.priceListEntry.findMany({
      where: {
        priceListId,
        active: true,
        minimumQuantity: { lte: params.quantity },
        AND: [
          { OR: [{ scope: "PRODUCT", productId: params.productId }, { scope: "CATEGORY", categoryCode: product.categoryCode ?? "" }, { scope: "ALL" }] },
          { OR: [{ validFrom: null }, { validFrom: { lte: asOf } }] },
          { OR: [{ validTo: null }, { validTo: { gte: asOf } }] },
        ],
      },
    });
    const entry = selectPriceRule(
      entries.map((item) => ({ ...item, validFrom: item.validFrom?.toISOString() ?? null, validTo: item.validTo?.toISOString() ?? null })),
      product,
      params.quantity,
      asOf,
    );
    if (entry) {
      const fromAgreement = params.priceListId === undefined && agreement?.priceListId === priceListId;
      const offer = commercialPrice(entry, priceList, product);
      return {
        unitPriceAmount: offer.unitPriceAmount,
        discountPercent: offer.discountPercent,
        currency: priceList.currency,
        source: `${priceList.name} price list · ${ruleExplanation(entry, priceList.currency)}${fromAgreement ? ` · ${agreement?.name}` : ""}${inheritedFrom ? ` · inherited from ${inheritedFrom}` : ""}`,
        validUntil: entry.validTo ? new Date(entry.validTo) : agreement && fromAgreement ? agreement.endsOn : null,
      };
    }
  }

  return {
    unitPriceAmount: product.basePriceAmount,
    discountPercent: 0,
    currency: product.baseCurrency,
    source: "Standard price",
    validUntil: null,
  };
}
