-- AlterTable
ALTER TABLE "products" 
ADD COLUMN     "safetyStockLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "leadTimeDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "averageDailyDemand" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "forecastMethod" TEXT NOT NULL DEFAULT 'EXPONENTIAL_SMOOTHING',
ADD COLUMN     "lastForecastDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "stock_forecasts" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 80,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_forecasts_organisationId_productId_forecastDate_idx" ON "stock_forecasts"("organisationId", "productId", "forecastDate");

-- AddForeignKey
ALTER TABLE "stock_forecasts" ADD CONSTRAINT "stock_forecasts_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_forecasts" ADD CONSTRAINT "stock_forecasts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;
