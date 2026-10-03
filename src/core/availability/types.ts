/**
 * Contract for a future Stock/Logistics module to supply product
 * availability. No implementation exists yet — Sales must never query
 * warehouse tables directly or invent an availability figure (§19, §54).
 * Until a real provider is registered, callers treat availability as
 * "unknown" and the UI omits it rather than showing a fabricated number.
 * See docs/modules/SALES_ORDER_PROCESSING.md §Availability contract.
 */
export type AvailabilityQuery = {
  productId: string;
  quantity: number;
  locationId?: string;
  requestedDate?: Date;
  organisationId: string;
};

export type AvailabilityResult = {
  availableNow: number;
  incoming: Array<{ quantity: number; expectedDate: Date }>;
  earliestFullAvailability: Date | null;
};

export type AvailabilityProvider = (query: AvailabilityQuery) => Promise<AvailabilityResult>;
