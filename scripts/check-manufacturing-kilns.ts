/** Central Test acceptance, called by the existing backed-up supply release gate. */
import assert from 'node:assert/strict';
import { expect, type BrowserContext, type Page } from '@playwright/test';
import { db } from '../src/core/db/client';
import { encodeWire, decodeWire } from '../src/core/desktop/wire';
import type { previewDemandForecast } from '../src/modules/manufacturing/services/demand-forecast';
import type { ScheduleImpact } from '../src/modules/manufacturing/services/scheduler';

export async function checkManufacturingKilns(input: { context: BrowserContext; page: Page; organisationId: string; userId: string; partyId: string; out: string; origin: string }) {
  const { context, page, organisationId, userId, partyId, out, origin } = input;
  const call = async <T>(service: string, action: string, args: unknown[], error?: RegExp): Promise<T> => {
    const response = await context.request.post('/api/desktop/action', { headers: { 'x-atlas-client': 'desktop', origin }, data: { action: `src/modules/manufacturing/services/${service}:${action}`, args: await encodeWire(args) } });
    const body = await response.json();
    if (error) { assert(response.status() >= 400, 'Rejected action must return an error'); assert.match(body.error, error); return undefined as T; }
    assert.equal(response.status(), 200, body.error ?? 'Authenticated action succeeded');
    return decodeWire(body.value) as T;
  };
  const mrpOrder = await db.manufacturingOrder.findFirstOrThrow({where:{organisationId,status:'PLANNED'},orderBy:{createdAt:'asc'}});
  assert(mrpOrder.plannedStart && mrpOrder.plannedStart > new Date(), 'Future forecast retains its reviewed production start');
  await call('commands','markOrderReady',[mrpOrder.id]); await call('commands','releaseOrder',[mrpOrder.id]);
  const futureWork = await db.manufacturingWorkOrder.findFirstOrThrow({where:{organisationId,productionOrderId:mrpOrder.id},orderBy:{sequence:'asc'}});
  assert(futureWork.scheduledStart && futureWork.scheduledStart >= mrpOrder.plannedStart, 'Release retains future MRP start instead of pulling forecast work into today');
  console.log('PASS actual forecast proposal → firming → release preserves future production timing.');
  await call('plant', 'saveWorkCentre', [{ code: 'FIRE', name: 'Firing hall', description: 'Isolated kiln acceptance' }]);
  await call('plant', 'saveWorkCentre', [{ code: 'PACK', name: 'Packing hall', description: 'Isolated shift acceptance' }]);
  const fire = await db.manufacturingWorkCentre.findFirstOrThrow({ where: { organisationId, code: 'FIRE' } });
  const pack = await db.manufacturingWorkCentre.findFirstOrThrow({ where: { organisationId, code: 'PACK' } });
  for (const name of ['Kiln A', 'Kiln B', 'Incompatible kiln']) await call('plant', 'saveMachine', [{ workCentreId: fire.id, name, type: 'MACHINE', processKind: 'BATCH_KILN', calendarMode: 'CONTINUOUS', timezone: 'Europe/London', nominalUnitsPerHour: null }]);
  await call('plant', 'saveMachine', [{ workCentreId: pack.id, name: 'Packing line', type: 'MACHINE', processKind: 'PACKING', calendarMode: 'SHIFTS', timezone: 'Europe/London', nominalUnitsPerHour: 60 }]);
  const machines = await db.manufacturingResource.findMany({ where: { organisationId } });
  const a = machines.find(m => m.name === 'Kiln A')!, b = machines.find(m => m.name === 'Kiln B')!, wrong = machines.find(m => m.name === 'Incompatible kiln')!, packing = machines.find(m => m.name === 'Packing line')!;
  await call('shifts', 'saveShift', [{ workCentreId: pack.id, resourceId: packing.id, label: 'Packing days', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], start: '08:00', end: '16:00', crewCount: 1 }]);
  const now = new Date(), later = new Date(now.getTime() + 7 * 86_400_000);
  await call('plant', 'saveDowntime', [{ resourceId: a.id, startsAt: now.toISOString(), endsAt: later.toISOString(), reason: 'Kiln lining maintenance · Test' }]);
  // A real id from another company must not be accepted by any new plant write.
  const foreign = await db.manufacturingResource.findFirst({ where: { organisationId: { not: organisationId } }, select: { id: true } });
  if (foreign) await call('plant', 'saveDowntime', [{ resourceId: foreign.id, startsAt: now.toISOString(), endsAt: later.toISOString(), reason: 'Must be refused' }], /this company/);
  const product = await db.product.create({ data: { organisationId, code: 'KILN-TEST', name: 'Fired product · Test', itemClass: 'FINISHED', sellable: true, basePriceAmount: 100, unitOfMeasure: 'each' } });
  const recipe = await db.productDefinition.create({ data: { organisationId, productId: product.id, version: 1, status: 'ACTIVE', supply: 'MAKE', batchQuantity: 100, yieldPercent: 100, createdByUserId: userId } });
  await db.productOperation.createMany({ data: [
    { organisationId, definitionId: recipe.id, position: 1, name: 'Fire and cool', workCentreId: fire.id, resourceId: a.id, eligibleResourceIds: [a.id, b.id], timingMode: 'BATCH', batchCapacity: 100, cycleMinutes: 60, coolingMinutes: 30, setupMinutes: 10, waitMinutes: 15, crewSize: 0 },
    { organisationId, definitionId: recipe.id, position: 2, name: 'Pack', workCentreId: pack.id, resourceId: packing.id, runMinutesPerUnit: 1 },
  ] });
  const create = async () => {
    const order = await call<{ id: string }>('commands', 'createProductionOrder', [{ productId: product.id, definitionId: recipe.id, quantity: 150 }]);
    await call('commands', 'markOrderReady', [order.id]); await call('commands', 'releaseOrder', [order.id]);
    return db.manufacturingWorkOrder.findMany({ where: { organisationId, productionOrderId: order.id }, orderBy: { sequence: 'asc' } });
  };
  const first = await create(), second = await create();
  assert.equal(first.length, 2); assert.equal(first[0].resourceId, b.id); assert.equal(first[0].plannedMinutes, 200);
  assert(first[0].scheduledStart && first[0].scheduledEnd && first[1].scheduledStart && first[1].scheduledEnd);
  assert(first[1].scheduledStart.getTime() >= first[0].scheduledEnd.getTime() + 15 * 60_000);
  assert(second[0].scheduledStart! >= first[0].scheduledEnd);
  const localHour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', hourCycle: 'h23' }).format(first[1].scheduledStart));
  assert(localHour >= 8 && localHour < 16);
  console.log('PASS actual finite release: two full firing/cooling loads, compatible alternative kiln, exclusive bookings, transfer wait and packing shifts.');
  await call('commands', 'startWorkOrder', [first[1].id, 'refuse-out-of-sequence'], /previous operation/);
  const move = new Date(later.getTime() + 86_400_000);
  await call('scheduler', 'schedulePreview', [first[0].id, move, wrong.id, fire.id], /not eligible/);
  await call('scheduler', 'setWorkOrderLock', [first[1].id, true]);
  await call('scheduler', 'schedulePreview', [first[0].id, move, b.id, fire.id], /locked, running or complete/);
  await call('scheduler', 'setWorkOrderLock', [first[1].id, false]);
  const preview = await call<ScheduleImpact>('scheduler', 'schedulePreview', [first[0].id, move, b.id, fire.id]);
  const original = await db.manufacturingWorkOrder.findMany({ where: { organisationId, productionOrderId: first[0].productionOrderId }, orderBy: { sequence: 'asc' } });
  await call('plant', 'saveDowntime', [{ resourceId: b.id, startsAt: move.toISOString(), endsAt: new Date(move.getTime() + 3_600_000).toISOString(), reason: 'Calendar changes after review · Test' }]);
  await call('scheduler', 'rescheduleWorkOrder', [first[0].id, move, b.id, fire.id, false, preview.previewKey], /changed since preview/);
  assert.deepEqual(await db.manufacturingWorkOrder.findMany({ where: { organisationId, productionOrderId: first[0].productionOrderId }, orderBy: { sequence: 'asc' } }), original);
  const fresh = await call<ScheduleImpact>('scheduler', 'schedulePreview', [first[0].id, move, b.id, fire.id]);
  await call('scheduler', 'rescheduleWorkOrder', [first[0].id, move, b.id, fire.id, false, fresh.previewKey]);
  const saved = await db.manufacturingWorkOrder.findMany({ where: { organisationId, productionOrderId: first[0].productionOrderId }, orderBy: { sequence: 'asc' } });
  assert.equal(saved[0].scheduledStart?.getTime(), fresh.proposedStart.getTime()); assert.equal(saved[1].scheduledStart?.getTime(), fresh.cascade[0].start.getTime());
  assert.equal(await db.auditEntry.count({ where: { organisationId, entityId: first[0].id, action: 'manufacturing.schedule.moved' } }), 1);
  console.log('PASS incompatible kiln and locked cascade refused; stale preview leaves both steps unchanged; fresh move commits both steps with one audit.');
  // Authoritative requested-demand history belongs to Sales, using the shared product and Party.
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let offset = -24; offset < 0; offset++) {
    const on = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + offset, 1));
    const quantity = (on.getUTCMonth() + 1) * 10;
    await db.salesOrder.create({ data: { organisationId, partyId, reference: `HISTORY-${on.toISOString().slice(0, 7)}`, ownerUserId: userId, commercialStatus: 'CLOSED', orderDate: on, requestedDeliveryDate: on, lines: { create: { lineNumber: 1, productId: product.id, descriptionSnapshot: product.name, orderedQuantity: quantity, unitOfMeasure: 'each', unitPriceAmount: 100, netAmount: quantity * 100 } } } });
  }
  type Projection = Awaited<ReturnType<typeof previewDemandForecast>>;
  const demand = await call<Projection>('demand-forecast', 'previewDemandForecast', [product.id]);
  assert.equal(demand.model.observations, 24); assert.equal(demand.model.method, 'Same month last year'); assert.equal(demand.model.wape, 0);
  const future = demand.months[1]; assert.equal(future.suggested, future.lastYear, 'Statistical suggestion uses the correct future calendar month');
  const workbench = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Demand intelligence', exact: true }) });
  await page.goto('/manufacturing/planning/forecast', { waitUntil: 'networkidle' });
  await workbench.getByLabel('Product', { exact: true }).selectOption(product.id);
  await workbench.getByRole('button', { name: 'Review demand', exact: true }).click();
  await expect(workbench.getByLabel('Starting point')).toBeVisible();
  await workbench.getByLabel('Starting point').selectOption('last-year');
  await workbench.getByLabel('Percentage adjustment').fill('10');
  await workbench.getByLabel('Add / subtract units per month').fill('5');
  const target = Math.round((future.lastYear! * 1.1 + 5) * 1e6) / 1e6;
  await expect(workbench.getByLabel(`Forecast ${future.period}`, { exact: true })).toHaveValue(String(target));
  await workbench.getByLabel(`Select ${future.period}`, { exact: true }).check();
  await workbench.getByRole('button', { name: 'Save 1 reviewed months', exact: true }).click();
  await expect(workbench.getByRole('status')).toContainText('Reviewed forecast saved');
  assert.equal(Number((await db.manufacturingDemandForecast.findFirstOrThrow({ where: { organisationId, productId: product.id, periodStart: new Date(`${future.period}-01T00:00:00Z`) } })).quantity), target);
  await call('demand-forecast', 'saveForecastProposal', [product.id, demand.fingerprint, [{ period: future.period, quantity: 1 }]], /changed/);
  await workbench.getByRole('button', { name: 'Review demand', exact: true }).click();
  await workbench.getByLabel('Starting point').selectOption('fixed');
  await workbench.getByLabel('Fixed monthly quantity').fill('100'); await workbench.getByLabel('Percentage adjustment').fill('0'); await workbench.getByLabel('Add / subtract units per month').fill('0');
  await expect(workbench.getByLabel(`Forecast ${future.period}`, { exact: true })).toHaveValue('100');
  await workbench.getByLabel(`Forecast ${future.period}`, { exact: true }).fill('125');
  await expect(workbench.getByLabel(`Forecast ${future.period}`, { exact: true })).toHaveValue('125');
  console.log('PASS actual Sales seasonal backtest, last-year +10% +5 UI save, exact central quantity, stale review rejection, fixed target and individual override.');
  for (const [name, width, height] of [['desktop', 1448, 1086], ['tablet', 820, 1180], ['phone', 390, 844]] as const) {
    await page.setViewportSize({ width, height });
    for (const path of ['/manufacturing/plant', '/manufacturing/schedule', '/manufacturing/planning/forecast', `/products/${product.id}`]) {
      assert.equal((await page.goto(path, { waitUntil: 'networkidle' }))?.status(), 200);
      if (path.endsWith('/plant')) { await expect(page.getByRole('heading', { name: 'Plant & kilns', exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Configure Kiln B', exact: true }).click(); await expect(page.getByRole('region', { name: 'Machine configuration' })).toBeVisible(); }
      if (path.endsWith('/forecast')) { await workbench.getByLabel('Product', { exact: true }).selectOption(product.id); await workbench.getByRole('button', { name: 'Review demand', exact: true }).click(); await expect(workbench.getByLabel('Starting point')).toBeVisible(); }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} fits ${name}`);
      await page.screenshot({ path: `${out}/kilns-${path.endsWith('/plant') ? 'plant' : path.endsWith('/schedule') ? 'schedule' : path.endsWith('/forecast') ? 'forecast' : 'recipe'}-${name}.png`, fullPage: false });
    }
  }
  await page.setViewportSize({ width: 1448, height: 1086 });
  console.log('PASS plant configuration, finite schedule, editable forecast and recipe at desktop/tablet/phone widths without root overflow.');
}
