import type {Session} from '@/core/auth/session';
import type {Prisma} from '@/generated/prisma/client';
import {getModule} from '@/core/modules/registry';
import {assertModuleEnabled} from '@/core/modules/access';
export type SalesFinanceSource={id:string;revision:number;reference:string;partyId:string;currency:string;paymentDays:number;net:bigint;tax:bigint;gross:bigint;instructions:string|null;lines:Array<{id:string;productId:string|null;description:string;quantity:number;unitPrice:bigint;net:bigint;tax:bigint;taxCategory:string|null}>};
export type SalesFinanceProjection={documents:Array<{id:string;reference:string;kind:string;status:string;gross:bigint;settled:bigint;currency:string;documentDate:Date}>;entities:Array<{id:string;name:string;currency:string}>;};
export type StockReceiptInput={receiptId:string;receiptLineId:string;warehouseId:string;productId:string;quantity:number;reference:string};
export async function salesFinanceSource(session:Session,tx:Prisma.TransactionClient,id:string){await assertModuleEnabled(session,'sales');const provider=getModule('sales')?.salesFinanceSourceProvider;if(!provider)throw new Error('Sales invoicing source is unavailable.');return provider(session,tx,id);}
export async function stockReceipt(session:Session,tx:Prisma.TransactionClient,input:StockReceiptInput){await assertModuleEnabled(session,'stock');const provider=getModule('stock')?.financeReceiptConsumer;if(!provider)throw new Error('Inventory receipt connection is unavailable.');return provider(session,tx,input);}
export async function orderFinanceProjection(id:string):Promise<SalesFinanceProjection|null>{const provider=getModule('finance')?.salesFinanceProjectionProvider;return provider?provider(id):null;}

export async function guardFinancialCancellation(session:Session,tx:Prisma.TransactionClient,id:string){await getModule('finance')?.salesCancellationGuard?.(session,tx,id);}

export type SalesInvoiceChainEntry = { id: string; reference: string; status: string; documentDate: string; lines: Array<{salesOrderLineId: string | null; quantity: number}> };
export type SalesInvoiceChainProvider = (session: Session, orderId: string) => Promise<SalesInvoiceChainEntry[]>;
export async function readOrderInvoices(session: Session, orderId: string): Promise<SalesInvoiceChainEntry[]> {
 if (!session.capabilities.has('finance.receivables.read')) return [];
 await assertModuleEnabled(session, 'finance');
 return await getModule('finance')?.salesInvoiceChainProvider?.(session, orderId) ?? [];
}

export type SalesInvoiceQuantity = {productId: string; salesOrderLineId: string; quantity: number};
export type SalesInvoiceQuantitiesProvider = (session: Session, lineIds: string[]) => Promise<SalesInvoiceQuantity[]>;
export async function readInvoiceQuantities(session: Session, lineIds: string[]): Promise<SalesInvoiceQuantity[]> {
 if (!session.capabilities.has('finance.receivables.read') || !lineIds.length) return [];
 await assertModuleEnabled(session, 'finance');
 return await getModule('finance')?.salesInvoiceQuantitiesProvider?.(session, lineIds) ?? [];
}
