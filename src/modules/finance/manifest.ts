import { prepareCustomerServiceCredit } from "./services/service-credit";
import {generateSalesInvoice} from './services/commands';
import {invoiceDeliveredShipment} from './services/delivery-invoice';
import {guardSalesCancellation} from './services/sales-guard';
import {getFinanceCustomerContribution,searchFinance,getSalesFinanceProjection} from './services/queries';
import {money} from './domain/money';
import {Wallet} from 'lucide-react';
import type {ModuleManifest} from '@/core/modules/types';
import {FINANCE_CAPABILITIES as C} from './capabilities';
import { financeAnalytics } from "./services/analytics";
export const financeManifest:ModuleManifest={
 serviceCreditProvider:prepareCustomerServiceCredit,analyticsProvider:financeAnalytics,deliveryInvoiceConsumer:invoiceDeliveredShipment,salesInvoiceGenerator:generateSalesInvoice,salesCancellationGuard:guardSalesCancellation,salesFinanceProjectionProvider:getSalesFinanceProjection,id:'finance',name:'Finance',description:'Financial control, purchasing, receivables, banking and connected accounting.',icon:Wallet,version:'0.1.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:Object.values(C),rootPath:'/finance',accessCapability:C.read,status:'available',searchProvider:async({session,query})=>session.capabilities.has(C.read)?searchFinance(query):[],customerOverviewProvider:async({session,partyId})=>{if(!session.capabilities.has(C.receivablesRead)||!session.capabilities.has('customers.read'))return null;const values=await getFinanceCustomerContribution(partyId);return {moduleId:'finance',metrics:values.flatMap(v=>[{label:'Receivables',value:money(v.outstanding,v.currency),href:`/finance/receivables?party=${partyId}`},{label:'Overdue receivables',value:money(v.overdue,v.currency),href:`/finance/receivables?party=${partyId}&overdue=1`}]),actions:[],...(values.length===1&&values[0].outstanding<=BigInt(Number.MAX_SAFE_INTEGER)?{creditExposure:{amountMinorUnits:Number(values[0].outstanding),currency:values[0].currency}}:{})};},navigation:[
 {label:'Overview',href:'/finance',capability:C.read},
 {label:'Sales & Receivables',href:'/finance/receivables',capability:C.receivablesRead,group:'Trading'},
 {label:'Credits & adjustments',href:'/finance/credits',capability:C.receivablesRead,group:'Trading'},
 {label:'Purchases & Payables',href:'/finance/payables',capability:C.payablesRead,group:'Trading'},
 {label:'Purchase orders',href:'/finance/purchases',capability:C.payablesRead,group:'Trading'},
 {label:'Suppliers',href:'/finance/suppliers',capability:C.payablesRead,group:'Trading'},
 {label:'Spend',href:'/finance/spend',capability:C.read,group:'Trading'},
 {label:'Banking',href:'/finance/banking',capability:C.bankRead,group:'Money'},
 {label:'Accounting',href:'/finance/accounting',capability:C.ledgerRead,group:'Money'},
 {label:'Assets',href:'/finance/assets',capability:C.assetRead,group:'Money'},
 {label:'Budgets',href:'/finance/planning',capability:C.planningRead,group:'Money'},
 {label:'Tax',href:'/finance/tax',capability:C.taxRead,group:'Money'},
 {label:'Reporting',href:'/finance/reporting',capability:C.reportRead,group:'Insights'},
 {label:'Control Centre',href:'/finance/control',capability:C.controlRead,group:'Insights'},
]};
