import { assertCapability } from "@/core/permissions/check";
import type { ServiceCreditProvider } from "@/core/service-work/connections";
import { workNumber } from "@/core/service-work/engine";
import { minor, roundRatio, decimalUnits } from "../domain/money";
export const prepareCustomerServiceCredit: ServiceCreditProvider = async (tx, session, input) => {
  assertCapability(session, "service.case.update");
  const organisationId = session.organisationId;
  const existing = await tx.financeDocument.findFirst({ where: { organisationId, duplicateKey: `service-credit:${input.requestKey}` }, include: { lines: true } });
  if (existing) {
    const creditedLine = existing.lines[0];
    if (existing.sourceId !== input.invoiceId || existing.partyId !== input.partyId || existing.reason !== `${input.caseNumber}: ${input.reason}`.slice(0,4000) || creditedLine?.sourceLineId !== input.lineId || (input.quantity !== null ? creditedLine.quantity.toString() !== String(input.quantity) : creditedLine.net !== minor(input.net || "0",existing.currency))) throw new Error("This request reference was already used for different source data.");
    return { id: existing.id, reference: existing.reference, requestReference: existing.externalReference ?? existing.reference };
  }
  const invoice = await tx.financeDocument.findFirst({ where: { organisationId, id: input.invoiceId, partyId: input.partyId, kind: "AR_INVOICE", status: "POSTED" }, include: { lines: true } });
  if (!invoice) throw new Error("Choose a posted invoice for this customer.");
  const line = invoice.lines.find(line => line.id === input.lineId);
  if (!line || line.net <= 0n || (input.productId && line.productId !== input.productId) || (input.salesOrderLineId && line.salesOrderLineId !== input.salesOrderLineId)) throw new Error("Choose the affected invoice line.");
  const previous = await tx.financeDocument.findMany({ where: { organisationId, sourceId: invoice.id, kind: "AR_CREDIT", status: { notIn: ["CANCELLED", "REJECTED"] } }, include: { lines: true } });
  const alreadyNet = previous.flatMap(credit => credit.lines).filter(credit => credit.sourceLineId === line.id).reduce((sum, credit) => sum + credit.net, 0n);
  let net = minor(input.net || "0", invoice.currency);
  if (input.quantity !== null) {
    if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) throw new Error("Enter a positive whole quantity to credit.");
    const quantity = decimalUnits(line.quantity.toString(), 6);
    if (BigInt(input.quantity) * 1000000n > quantity) throw new Error("Credit quantity exceeds the source invoice line.");
    net = roundRatio(line.net * BigInt(input.quantity) * 1000000n, quantity);
  }
  if(input.affectedQuantity){
    const quantity=decimalUnits(line.quantity.toString(),6);
    const limit=roundRatio(line.net*BigInt(input.affectedQuantity)*1000000n,quantity);
    const caseLinks=await tx.serviceLink.findMany({where:{organisationId,caseId:input.caseId,entityType:"FinanceDocument"},select:{entityId:true}});
    const ids=new Set(caseLinks.map(link=>link.entityId));
    const caseNet=previous.filter(credit=>ids.has(credit.id)).flatMap(credit=>credit.lines).filter(credit=>credit.sourceLineId===line.id).reduce((sum,credit)=>sum+credit.net,0n);
    if(net+caseNet>limit)throw new Error("Credit exceeds the case's affected quantity after previous requests.");
  }
  if (net <= 0n || net + alreadyNet > line.net) throw new Error("Credit exceeds the invoice line after existing and pending credits.");
  const tax = roundRatio(net * line.tax, line.net), gross = net + tax;
  const reserved = previous.filter(credit => credit.status !== "POSTED").reduce((sum, credit) => sum + credit.gross, 0n);
  if (gross + reserved > invoice.gross - invoice.settled) throw new Error("This invoice has insufficient uncredited outstanding value. Paid-invoice refunds or goodwill need a separate Finance review.");
  const requestReference = await workNumber(tx, organisationId, "CR");
  const credit = await tx.financeDocument.create({ data: {
    organisationId, entityId: invoice.entityId, kind: "AR_CREDIT", category: "SERVICE_CREDIT", department: "Customer Service", reference: await workNumber(tx, organisationId, "CN"), externalReference: requestReference,
    title: `${requestReference} · ${input.caseNumber}`, status: "DRAFT", creatorUserId: session.userId, partyId: input.partyId, sourceId: invoice.id,
    salesOrderId: invoice.salesOrderId, salesOrderRevision: invoice.salesOrderRevision, duplicateKey: `service-credit:${input.requestKey}`, currency: invoice.currency, exchangeRate: invoice.exchangeRate,
    documentDate: new Date(), dueAt: invoice.dueAt, net, tax, gross, reason: `${input.caseNumber}: ${input.reason}`.slice(0, 4000),
    lines: { create: [{ number: 1, description: `Service credit: ${line.description}`.slice(0, 500), quantity: input.quantity?.toString() ?? "1", unitPrice: input.quantity ? roundRatio(net, BigInt(input.quantity)) : net, net, tax, taxCode: line.taxCode, taxRateBps: line.taxRateBps, sourceLineId: line.id, productId: line.productId, salesOrderLineId: line.salesOrderLineId, accountId: line.accountId }] },
  } });
  await tx.financeTimeline.create({ data: { organisationId, documentId: credit.id, actorUserId: session.userId, action: "SERVICE_CREDIT_REQUESTED", detail: `${requestReference} from ${input.caseNumber}, ${invoice.reference} line ${line.number}. Separate approval and manual Finance posting required. No customer balance changed.` } });
  return { id: credit.id, reference: credit.reference, requestReference };
};
