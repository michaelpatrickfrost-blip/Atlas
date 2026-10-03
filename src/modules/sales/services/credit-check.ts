import { db } from "@/core/db/client";
import type { CreditProvider, CreditCheckResult } from "@/core/finance/types";
import { formatMoney } from "@/core/shared/money";

/**
 * The CreditProvider implementation available today — backed directly by
 * Customer Master's own CustomerCreditProfile (§28), not a Finance module
 * (none exists). Exposure is calculated honestly from Sales' own confirmed,
 * uninvoiced orders — exactly the same "confirmed orders not yet invoiced"
 * proxy Sales already contributes to Customer 360
 * (src/modules/sales/services/customer-overview.ts). When a real Finance
 * module exists, it should register a CreditProvider that also includes
 * unpaid invoices; this implementation is the honest placeholder until then.
 */
export const checkOrderCredit: CreditProvider = async (orderId: string): Promise<CreditCheckResult> => {
  const order = await db.salesOrder.findUniqueOrThrow({ where: { id: orderId } });

  const creditProfile = await db.customerCreditProfile.findUnique({ where: { partyId: order.partyId } });
  const creditLimitAmount = creditProfile?.creditLimitAmount ?? 0;
  const currency = creditProfile?.creditLimitCurrency ?? order.currency;

  const otherOrders = await db.salesOrder.findMany({
    where: {
      partyId: order.partyId,
      id: { not: orderId },
      commercialStatus: { in: ["CONFIRMED", "ON_HOLD"] },
    },
    select: { grossAmount: true,currency:true },
  });
  if(currency!==order.currency||otherOrders.some(o=>o.currency!==order.currency))return {status:'HOLD',creditLimitAmount:0,currentExposureAmount:0,thisOrderAmount:order.grossAmount,projectedExposureAmount:order.grossAmount,currency:order.currency,explanation:'Credit exposure uses different currencies. Credit Control must review it before confirmation.'};
  const existingExposure = otherOrders.reduce((sum, o) => sum + o.grossAmount, 0);
  const thisOrderAmount = order.grossAmount;
  const projectedExposureAmount = existingExposure + thisOrderAmount;

  let status: CreditCheckResult["status"] = "CLEAR";
  if (creditProfile?.onHold) {
    status = "HOLD";
  } else if (creditLimitAmount > 0 && projectedExposureAmount > creditLimitAmount) {
    status = "HOLD";
  } else if (creditLimitAmount > 0 && projectedExposureAmount > creditLimitAmount * 0.9) {
    status = "WARNING";
  }

  const explanation =
    status === "HOLD" && creditProfile?.onHold
      ? `Customer is on credit hold${creditProfile.holdReason ? ` — ${creditProfile.holdReason}` : ""}.`
      : status === "HOLD"
        ? `Projected exposure ${formatMoney(projectedExposureAmount, currency)} exceeds the limit of ${formatMoney(creditLimitAmount, currency)} by ${formatMoney(projectedExposureAmount - creditLimitAmount, currency)}.`
        : status === "WARNING"
          ? `Projected exposure is ${Math.round((projectedExposureAmount / creditLimitAmount) * 100)}% of the credit limit.`
          : "Within credit limit.";

  return { status, creditLimitAmount, currentExposureAmount: existingExposure, thisOrderAmount, projectedExposureAmount, currency, explanation };
};
