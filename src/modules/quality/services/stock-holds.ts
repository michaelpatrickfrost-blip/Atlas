import type { Session } from '@/core/auth/session';
import type { Prisma, QualityHold } from '@/generated/prisma/client';
import { addQuantity } from '@/core/shared/quantity';
import { stockProvider } from '@/modules/stock/services/provider';

/** Record real location/batch changes with the inspection; the hold itself also protects unlocated stock. */
export async function quarantineInspectionStock(tx: Prisma.TransactionClient, session: Session, hold: QualityHold) {
  if (!hold.warehouseId) return;
  const product = await tx.product.findFirstOrThrow({ where: { organisationId: session.organisationId, id: hold.productId } });
  const lots = await tx.stockLot.findMany({ where: { organisationId: session.organisationId, productId: hold.productId } });
  const positions = await tx.stockPosition.findMany({ where: { organisationId: session.organisationId, productId: hold.productId, warehouseId: hold.warehouseId, status: 'AVAILABLE', quantity: { gt: 0 }, ...(hold.locationId ? { locationId: hold.locationId } : {}), ...(hold.lotCode ? { lotId: { in: lots.filter(lot => lot.code === hold.lotCode).map(lot => lot.id) } } : {}) }, orderBy: { id: 'asc' } });
  let left = Number(hold.quantity);
  for (const position of positions) {
    if (!left) break;
    const quantity = Math.min(left, Number(position.quantity));
    const serials = product.trackingMode === 'SERIAL' ? await tx.stockSerial.findMany({ where: { organisationId: session.organisationId, productId: hold.productId, warehouseId: position.warehouseId, locationId: position.locationId, lotId: position.lotId || null, status: 'ON_HAND' }, orderBy: { serial: 'asc' }, take: quantity }) : [];
    await stockProvider.executeMovement(session, { productId: hold.productId, warehouseId: position.warehouseId, locationId: position.locationId, toLocationId: position.locationId, lotCode: lots.find(lot => lot.id === position.lotId)?.code, serials: serials.map(row => row.serial), quantity, status: 'AVAILABLE', toStatus: 'QUARANTINE', requestKey: `quality-hold:${hold.id}:${position.id}`, reference: `quality-hold:${hold.id}`, reason: 'Quality hold · failed inspection' }, tx);
    left = addQuantity(left, -quantity);
  }
}

/** Release only quarantine with recorded Quality ownership, and retain overlapping active holds. */
export async function releaseInspectionStock(tx: Prisma.TransactionClient, session: Session, hold: QualityHold) {
  const [released, active, product, lots] = await Promise.all([
    tx.qualityHold.findMany({ where: { organisationId: session.organisationId, productId: hold.productId, status: 'RELEASED' } }),
    tx.qualityHold.findMany({ where: { organisationId: session.organisationId, productId: hold.productId, status: 'ACTIVE' } }),
    tx.product.findFirstOrThrow({ where: { organisationId: session.organisationId, id: hold.productId } }),
    tx.stockLot.findMany({ where: { organisationId: session.organisationId, productId: hold.productId } }),
  ]);
  const allocations = await tx.stockMovementAllocation.findMany({ where: { organisationId: session.organisationId, productId: hold.productId, direction: 'IN', status: 'QUARANTINE', movement: { OR: released.map(row => ({ reference: `quality-hold:${row.id}` })) } }, orderBy: { id: 'asc' } });
  for (const allocation of allocations) {
    const lotCode = lots.find(lot => lot.id === allocation.lotId)?.code;
    if (active.some(row => (!row.warehouseId || row.warehouseId === allocation.warehouseId) && (!row.locationId || row.locationId === allocation.locationId) && (!row.lotCode || row.lotCode === lotCode))) continue;
    const key = `quality-release:${allocation.id}`;
    if (await tx.inventoryMovement.findFirst({ where: { organisationId: session.organisationId, requestKey: key } })) continue;
    const position = await tx.stockPosition.findFirst({ where: { organisationId: session.organisationId, productId: hold.productId, warehouseId: allocation.warehouseId, locationId: allocation.locationId, lotId: allocation.lotId, status: 'QUARANTINE' } });
    const quantity = Math.min(Number(allocation.quantity), Number(position?.quantity ?? 0));
    if (!quantity) continue;
    const serials = product.trackingMode === 'SERIAL' ? await tx.stockSerial.findMany({ where: { organisationId: session.organisationId, productId: hold.productId, warehouseId: allocation.warehouseId, locationId: allocation.locationId, lotId: allocation.lotId || null, serial: { in: allocation.serials }, status: 'ON_HAND' }, orderBy: { serial: 'asc' }, take: quantity }) : [];
    await stockProvider.executeMovement(session, { productId: hold.productId, warehouseId: allocation.warehouseId, locationId: allocation.locationId, toLocationId: allocation.locationId, lotCode, serials: serials.map(row => row.serial), quantity, status: 'QUARANTINE', toStatus: 'AVAILABLE', requestKey: key, reference: `quality-release:${hold.id}`, reason: 'Quality hold released · ' + hold.releaseNote }, tx);
  }
}
