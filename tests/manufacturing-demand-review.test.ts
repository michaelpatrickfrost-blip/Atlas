import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  session: { organisationId: 'tenant', userId: 'planner', capabilities: new Set<string>() },
  forecasts: [] as Array<{ id: string; productId: string; periodStart: Date; quantity: number; sourceSopVersionId: string | null }>,
  enabled: vi.fn(), provider: vi.fn(), upsert: vi.fn(), audit: vi.fn(), product: vi.fn(), forecastsRead: vi.fn(),
}));
vi.mock('@/core/auth/session', () => ({ requireSession: async () => state.session }));
vi.mock('@/core/modules/access', () => ({ assertModuleEnabled: state.enabled }));
vi.mock('@/core/modules/registry', () => ({ getModule: () => ({ businessPlanningProvider: state.provider }) }));
vi.mock('@/core/audit/log', () => ({ writeAudit: state.audit }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/core/db/client', () => {
  const client = { product: { findFirst: state.product }, manufacturingDemandForecast: { findMany: state.forecastsRead, upsert: state.upsert } };
  return { db: { ...client, $transaction: async (fn: (tx: typeof client) => Promise<unknown>) => fn(client) } };
});
import { previewDemandForecast, saveForecastProposal } from '@/modules/manufacturing/services/demand-forecast';
beforeEach(() => {
  vi.clearAllMocks(); state.forecasts = [];
  state.session.capabilities = new Set(['manufacturing.plan.read', 'manufacturing.plan.manage', 'sales.order.read', 'customers.read', 'core.products.read']);
  state.enabled.mockResolvedValue(undefined); state.product.mockResolvedValue({ id: 'product', name: 'Pipe', unitOfMeasure: 'each' });
  state.forecastsRead.mockImplementation(async () => state.forecasts); state.upsert.mockResolvedValue({ id: 'saved' });
  const month = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  state.provider.mockResolvedValue({ orders: Array.from({ length: 24 }, (_, i) => { const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 24 + i, 1)); return { id: String(i), lineId: String(i), requestedOn: date.toISOString().slice(0, 10), quantity: (date.getUTCMonth() + 1) * 10, closed: true }; }), warnings: [] });
});
it('uses the company-scoped product and owner provider in the same review transaction, with correct future month', async () => {
  const result = await previewDemandForecast('product');
  expect(state.product).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'product', organisationId: 'tenant', active: true }) }));
  expect(state.provider).toHaveBeenCalledWith(state.session, expect.objectContaining({ productIds: ['product'], purpose: 'forecast' }), expect.objectContaining({ product: expect.anything() }));
  expect(result.model.observations).toBe(24); expect(result.months[1].suggested).toBe(result.months[1].lastYear);
});
it.each(['sales.order.read', 'customers.read', 'manufacturing.plan.read'])('refuses missing %s before reading history', async capability => {
  state.session.capabilities.delete(capability); await expect(previewDemandForecast('product')).rejects.toThrow('FORBIDDEN'); expect(state.provider).not.toHaveBeenCalled();
});
it('refuses a read-only write before reading or changing any forecast', async () => {
  state.session.capabilities.delete('manufacturing.plan.manage'); await expect(saveForecastProposal('product', 'key', [])).rejects.toThrow('FORBIDDEN'); expect(state.upsert).not.toHaveBeenCalled(); expect(state.provider).not.toHaveBeenCalled();
});
it('preserves approved S&OP demand even with a fresh fingerprint', async () => {
  const first = await previewDemandForecast('product'); const period = first.months[1].period;
  state.forecasts = [{ id: 'approved', productId: 'product', periodStart: new Date(`${period}-01T00:00:00Z`), quantity: 100, sourceSopVersionId: 'version' }];
  const review = await previewDemandForecast('product'); await expect(saveForecastProposal('product', review.fingerprint, [{ period, quantity: 110 }])).rejects.toThrow('S&OP'); expect(state.upsert).not.toHaveBeenCalled();
});
it('rejects stale source review and invalid adjustments without any write', async () => {
  const review = await previewDemandForecast('product'), period = review.months[1].period;
  state.forecasts = [{ id: 'changed', productId: 'product', periodStart: new Date(`${period}-01T00:00:00Z`), quantity: 20, sourceSopVersionId: null }];
  await expect(saveForecastProposal('product', review.fingerprint, [{ period, quantity: 100 }])).rejects.toThrow('changed');
  const fresh = await previewDemandForecast('product'); await expect(saveForecastProposal('product', fresh.fingerprint, [{ period, quantity: 100 }], { basis: 'last-year', percent: -101, add: 0, fixed: 0 })).rejects.toThrow('assumptions'); expect(state.upsert).not.toHaveBeenCalled();
});
it('records the reviewed individual quantity and assumptions, including a valid zero forecast', async () => {
  const review = await previewDemandForecast('product'), period = review.months[1].period;
  await saveForecastProposal('product', review.fingerprint, [{ period, quantity: 0 }], { basis: 'last-year', percent: 10, add: 5, fixed: 0 });
  expect(state.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ organisationId: 'tenant', productId: 'product', quantity: 0, createdByUserId: 'planner' }) }));
  expect(state.audit).toHaveBeenCalledWith(expect.objectContaining({ after: expect.objectContaining({ quantity: 0, assumptions: { basis: 'last-year', percent: 10, add: 5, fixed: 0 } }) }), expect.anything());
});
