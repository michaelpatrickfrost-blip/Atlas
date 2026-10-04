import {db} from '@/core/db/client';
export async function assertSalesTradingLink(organisationId:string,invoiceAccountId:string,pricingAccountId:string|null){
 if(!pricingAccountId||pricingAccountId===invoiceAccountId)return;
 if(!await db.customerTradingLink.count({where:{organisationId,accountId:pricingAccountId,tradingAccountId:invoiceAccountId,active:true,account:{organisationId},tradingAccount:{organisationId}}}))throw new Error('The pricing account is no longer linked to this invoice account. Review the trading relationship in Customers.');
}
