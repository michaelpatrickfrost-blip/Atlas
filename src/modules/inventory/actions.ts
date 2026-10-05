'use server';

import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';

export async function runStockForecast(
  productId: string,
  method: string = 'EXPONENTIAL_SMOOTHING'
) {
  const session = await requireSession();
  await assertCapability(session, 'inventory.write');

  // Placeholder - full implementation when migrations run
  return {
    quantity: 0,
    method,
    confidence: 80,
    forecastDate: new Date(),
  };
}

export async function updateProductForecastSettings(
  productId: string,
  data: Record<string, any>
) {
  const session = await requireSession();
  await assertCapability(session, 'inventory.write');

  // Placeholder - will use actual fields when migrations run
  return { id: productId };
}

export async function getLatestForecast(productId: string) {
  const session = await requireSession();
  await assertCapability(session, 'inventory.read');

  // Placeholder - will query when migrations run
  return null;
}

export async function getForecastHistory(productId: string, days: number = 90) {
  const session = await requireSession();
  await assertCapability(session, 'inventory.read');

  // Placeholder - will query when migrations run
  return [];
}
