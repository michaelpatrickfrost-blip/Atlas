-- §20/§48 plan-vs-actual on the shop floor: freeze the routing step's expected
-- duration when the order is released and record the elapsed time on completion.
ALTER TABLE "manufacturing_work_orders"
  ADD COLUMN "plannedMinutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "setupMinutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "runMinutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "actualMinutes" INTEGER NOT NULL DEFAULT 0;
