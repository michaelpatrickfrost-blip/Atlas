import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { DemandLine } from '@/modules/manufacturing/domain/mrp-types';

const state = vi.hoisted(() => ({ inventory: new Map<string,{available:number;restricted?:number;qualityHeld:number}>(), demand: [] as DemandLine[], db: Object.fromEntries(
  ['salesOrder', 'fulfilmentLine', 'manufacturingDemandForecast', 'product', 'inventoryBalance', 'warehouse', 'stockReservation', 'stockPosition', 'qualityHold', 'productDefinition', 'manufacturingOrder', 'manufacturingPlanningRun', 'manufacturingSupplySuggestion'].map(name => [name, { findMany: vi.fn(), create: vi.fn() }]),
) }));
vi.mock('@/core/db/client', () => ({ db: state.db }));
vi.mock('@/modules/manufacturing/domain/mrp-engine', () => ({ MrpEngine: class {
  constructor(context: { demand: DemandLine[];inventory:typeof state.inventory }) { state.demand = context.demand; state.inventory=context.inventory; }
  async run() { return { plannedOrders: [], shortages: [], capacityIssues: [], warnings: [], peggingMap: new Map(), startedAt: new Date(), finishedAt: new Date(), runId: 'test' }; }
} }));
import { runMrp } from '@/modules/manufacturing/services/mrp-calculation';

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-06-15T12:00:00Z')); vi.clearAllMocks(); state.demand = [];
  for (const model of Object.values(state.db)) { model.findMany.mockResolvedValue([]); model.create.mockResolvedValue({ id: 'run' }); }
  state.db.manufacturingDemandForecast.findMany.mockResolvedValue([{ id: 'forecast', productId: 'p', periodStart: new Date('2026-06-01'), quantity: 100000, sourceSopVersionId: 'approved' }]);
});
afterEach(() => vi.useRealTimers());
const order = (status: string, quantity: number) => ({ id: 'order', reference: 'SO-1', commercialStatus: status, requestedDeliveryDate: new Date('2026-06-20'), promisedDeliveryDate: null,
  lines: [{ id: 'line', productId: 'p', orderedQuantity: quantity, cancelledQuantity: 0, requestedDeliveryDate: null, promisedDeliveryDate: null }] });

describe('approved S&OP demand entering MRP', () => {
  it('uses the header due date and nets part-shipped bookings from the retained whole-period total', async () => {
    state.db.salesOrder.findMany.mockResolvedValue([order('CONFIRMED', 40000)]);
    state.db.fulfilmentLine.findMany.mockResolvedValue([{ salesOrderLineId: 'line', shippedQuantity: 20000 }]);
    await runMrp('org', 'planner');
    expect(state.demand.find(row => row.sourceId === 'order')?.quantity).toBe(20000);
    expect(state.demand.find(row => row.id === 'forecast')).toMatchObject({ quantity: 60000, forecastIsResidual: true });
    expect(state.demand.reduce((sum, row) => sum + row.quantity, 0)).toBe(80000);
    expect(state.db.salesOrder.findMany.mock.calls[0][0].where.organisationId).toBe('org');
  });
  it('consumes closed bookings without manufacturing them a second time', async () => {
    state.db.salesOrder.findMany.mockResolvedValue([order('CLOSED', 40000)]);
    await runMrp('org', 'planner');
    expect(state.demand).toHaveLength(1); expect(state.demand[0].quantity).toBe(60000);
  });
  it('keeps excess firm orders when they exceed the published forecast', async () => {
    state.db.salesOrder.findMany.mockResolvedValue([order('CONFIRMED', 120000)]);
    await runMrp('org', 'planner');
    expect(state.demand.find(row => row.id === 'forecast')?.quantity).toBe(0);
    expect(state.demand.reduce((sum, row) => sum + row.quantity, 0)).toBe(120000);
  });
});

it("nets blocked production, transit and quality from actual MRP supply without double-counting quarantine",async()=>{state.db.inventoryBalance.findMany.mockResolvedValue([{productId:"p",quantity:30}]);state.db.stockReservation.findMany.mockResolvedValue([{productId:"p",quantity:2}]);state.db.qualityHold.findMany.mockResolvedValue([{productId:"p",quantity:4}]);state.db.stockPosition.findMany.mockResolvedValue([{productId:"p",status:"QUARANTINE",quantity:4},{productId:"p",status:"BLOCKED",quantity:10},{productId:"p",status:"IN_TRANSIT",quantity:2}]);await runMrp("org","planner");expect(state.inventory.get("p")).toMatchObject({available:12,restricted:12,qualityHeld:4});});
