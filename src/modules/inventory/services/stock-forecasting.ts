import { PrismaClient } from '@/generated/prisma/client';

export interface ForecastInput {
  productId: string;
  organisationId: string;
  historicalDemand: number[]; // Last 12 months/periods
  safetyStockLevel: number;
  leadTimeDays: number;
  averageDailyDemand: number;
}

export interface ForecastOutput {
  quantity: number;
  method: string;
  confidence: number;
  forecastDate: Date;
}

export async function calculateExponentialSmoothingForecast(
  input: ForecastInput,
  alpha: number = 0.3
): Promise<ForecastOutput> {
  const { historicalDemand } = input;

  if (historicalDemand.length === 0) {
    return {
      quantity: input.averageDailyDemand * input.leadTimeDays + input.safetyStockLevel,
      method: 'EXPONENTIAL_SMOOTHING',
      confidence: 40,
      forecastDate: new Date(),
    };
  }

  let forecast = historicalDemand[0];
  for (let i = 1; i < historicalDemand.length; i++) {
    forecast = alpha * historicalDemand[i] + (1 - alpha) * forecast;
  }

  const forecastedDemand = Math.max(0, Math.round(forecast));
  const reorderPoint = forecastedDemand * input.leadTimeDays + input.safetyStockLevel;

  return {
    quantity: reorderPoint,
    method: 'EXPONENTIAL_SMOOTHING',
    confidence: Math.min(95, 50 + Math.floor(historicalDemand.length * 3)),
    forecastDate: new Date(),
  };
}

export async function calculateMovingAverageForecast(
  input: ForecastInput,
  period: number = 3
): Promise<ForecastOutput> {
  const { historicalDemand } = input;

  if (historicalDemand.length === 0) {
    return {
      quantity: input.averageDailyDemand * input.leadTimeDays + input.safetyStockLevel,
      method: 'MOVING_AVERAGE',
      confidence: 40,
      forecastDate: new Date(),
    };
  }

  const recentData = historicalDemand.slice(-period);
  const average = recentData.reduce((a, b) => a + b, 0) / recentData.length;
  const forecastedDemand = Math.max(0, Math.round(average));
  const reorderPoint = forecastedDemand * input.leadTimeDays + input.safetyStockLevel;

  return {
    quantity: reorderPoint,
    method: 'MOVING_AVERAGE',
    confidence: Math.min(90, 60 + Math.floor(recentData.length * 5)),
    forecastDate: new Date(),
  };
}

export async function forecastProductStock(
  db: PrismaClient,
  input: ForecastInput,
  method: string = 'EXPONENTIAL_SMOOTHING'
): Promise<ForecastOutput> {
  let forecast: ForecastOutput;

  if (method === 'MOVING_AVERAGE') {
    forecast = await calculateMovingAverageForecast(input);
  } else {
    forecast = await calculateExponentialSmoothingForecast(input);
  }

  await db.stockForecast.create({
    data: {
      organisationId: input.organisationId,
      productId: input.productId,
      forecastDate: forecast.forecastDate,
      quantity: forecast.quantity,
      method: forecast.method,
      confidence: forecast.confidence,
    },
  });

  await db.product.update({
    where: { id: input.productId },
    data: {
      lastForecastDate: new Date(),
      forecastMethod: method,
    },
  });

  return forecast;
}

export async function getBatchForecasts(
  db: PrismaClient,
  organisationId: string,
  productIds: string[]
): Promise<Map<string, ForecastOutput>> {
  const forecasts = new Map<string, ForecastOutput>();

  for (const productId of productIds) {
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        averageDailyDemand: true,
        leadTimeDays: true,
        safetyStockLevel: true,
        forecastMethod: true,
      },
    });

    if (!product) continue;

    const input: ForecastInput = {
      productId,
      organisationId,
      historicalDemand: [product.averageDailyDemand],
      safetyStockLevel: product.safetyStockLevel,
      leadTimeDays: product.leadTimeDays,
      averageDailyDemand: product.averageDailyDemand,
    };

    const forecast = await forecastProductStock(db, input, product.forecastMethod);
    forecasts.set(productId, forecast);
  }

  return forecasts;
}
