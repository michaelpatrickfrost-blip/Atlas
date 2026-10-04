-- Company choice: dispatch can record the delivery, or delivery stays a later confirmation.
ALTER TABLE "logistics_policies" ADD COLUMN "dispatchConfirmsDelivery" BOOLEAN NOT NULL DEFAULT false;
