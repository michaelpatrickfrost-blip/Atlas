'use server';

import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { forecastProductStock, ForecastInput } from './services/stock-forecasting';

export async function runStockForecast(
  productId: string,
  method: string = 'EXPONENTIAL_SMOOTHING'
) {
  const session = await requireSession();
  await assertCapability(session, 'inventory.write');

  const product = await db.product.findUniqueOrThrow({
    where: { id: productId },
    select: {
      organisationId: true,
      averageDailyDemand: true,
      leadTimeDays: true,
      safetyStockLevel: true,
    },
  });

  const input: ForecastInput = {
    productId,
    organisationId: product.organisationId,
    historicalDemand: [product.averageDailyDemand],
    safetyStockLevel: product.safetyStockLevel,
    leadTimeDays: product.leadTimeDays,
    averageDailyDemand: product.averageDailyDemand,
  };

  return forecastProductStock(db, input, method);
}

export async function updateProductForecastSettings(
  productId: string,
  data: {
    safetyStockLevel?: number;
    leadTimeDays?: number;
    averageDailyDemand?: number;
    forecastMethod?: string;
  }
) {
  const session = await requireSession();
  await assertCapability(session, 'inventory.write');

  return db.product.update({
    where: { id: productId },
    data,
  });
}

export async function getLatestForecast(productId: string) {
  const session = await requireSession();
  await assertCapability(session, 'inventory.read');

  return db.stockForecast.findFirst({
    where: { productId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getForecastHistory(productId: string, days: number = 90) {
  const session = await requireSession();
  await assertCapability(session, 'inventory.read');

  const since = new Date();
  since.setDate(since.getDate() - days);

  return db.stockForecast.findMany({
    where: {
      productId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
