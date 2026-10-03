import { selectPriceRule,calculateRulePrice,ruleExplanation } from "./rules";
import { db } from "@/core/db/client";

export type ResolvedPrice = {
  unitPriceAmount: number;
  currency: string;
  source: string;
  validUntil: Date | null;
};

/**
 * Atlas's pricing engine (§16). Every result states its source — never a
 * mystery number. Resolution order: customer-contracted price, then the
 * order's price list (if any) honouring quantity breaks and date validity,
 * then the product's standard price. Promotions, customer groups and manual
 * overrides beyond this are deferred — see
 * docs/modules/SALES_ORDER_PROCESSING.md §Pricing.
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

  const product = await db.product.findFirstOrThrow({ where: { id: params.productId, organisationId: params.organisationId } });

  const party = await db.party.findFirstOrThrow({where:{id:params.partyId,organisationId:params.organisationId},include:{commercialSettings:true}});
  const priceListId = params.priceListId === undefined ? party.commercialSettings?.priceList : params.priceListId;
  const customerProduct = await db.customerProduct.findUnique({
    where: { partyId_productId: { partyId: params.partyId, productId: params.productId } },
  });
  if (customerProduct?.contractedPriceAmount != null) {
    return {
      unitPriceAmount: customerProduct.contractedPriceAmount,
      currency: customerProduct.contractedPriceCurrency ?? product.baseCurrency,
      source: "Customer contract price",
      validUntil: null,
    };
  }

  if (priceListId) {
    const priceList = await db.priceList.findFirstOrThrow({where:{id:priceListId,organisationId:params.organisationId}});
    const entries = await db.priceListEntry.findMany({
      where: {priceListId,active:true,minimumQuantity:{lte:params.quantity},AND:[{OR:[{scope:"PRODUCT",productId:params.productId},{scope:"CATEGORY",categoryCode:product.categoryCode??""},{scope:"ALL"}]},{OR:[{validFrom:null},{validFrom:{lte:asOf}}]},{OR:[{validTo:null},{validTo:{gte:asOf}}]}]},
    });
    const entry=selectPriceRule(entries.map(e=>({...e,validFrom:e.validFrom?.toISOString()??null,validTo:e.validTo?.toISOString()??null})),product,params.quantity,asOf);
    if(entry)return {unitPriceAmount:calculateRulePrice(entry,priceList,product),currency:priceList.currency,source:`${priceList.name} price list · ${ruleExplanation(entry,priceList.currency)}`,validUntil:entry.validTo?new Date(entry.validTo):null};
  }

  return {
    unitPriceAmount: product.basePriceAmount,
    currency: product.baseCurrency,
    source: "Standard price",
    validUntil: null,
  };
}
