import { db } from '@/core/db/client';

export async function adjustStock(organisationId: string, productId: string, locationId: string, quantityChange: number) {
  const stock = await db.stock.findUnique({
    where: { productId_locationId: { productId, locationId } },
  });

  if (!stock) throw new Error('Stock not found');
  if (stock.quantity + quantityChange < 0) throw new Error('Insufficient stock');

  return db.stock.update({
    where: { productId_locationId: { productId, locationId } },
    data: { quantity: stock.quantity + quantityChange },
  });
}

export async function forecastStock(organisationId: string, productId: string, weeksAhead: number = 4) {
  const currentStock = await db.stock.aggregate({
    where: { productId },
    _sum: { quantity: true },
  });

  return {
    current: currentStock._sum.quantity || 0,
    projected: Math.max(0, (currentStock._sum.quantity || 0) - (10 * weeksAhead)),
  };
}
