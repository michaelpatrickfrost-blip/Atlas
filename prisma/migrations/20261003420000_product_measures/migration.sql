-- Physical and customs facts logistics needs from the shared product.
ALTER TABLE "products" ADD COLUMN "netWeightGrams" INTEGER,
ADD COLUMN "grossWeightGrams" INTEGER,
ADD COLUMN "lengthMm" INTEGER,
ADD COLUMN "widthMm" INTEGER,
ADD COLUMN "heightMm" INTEGER,
ADD COLUMN "volumeMl" INTEGER,
ADD COLUMN "unitsPerPack" INTEGER,
ADD COLUMN "packsPerLayer" INTEGER,
ADD COLUMN "layersPerPallet" INTEGER,
ADD COLUMN "stackable" BOOLEAN,
ADD COLUMN "originCountry" TEXT,
ADD COLUMN "commodityCode" TEXT,
ADD COLUMN "customsDescription" TEXT,
ADD COLUMN "hazardClass" TEXT,
ADD COLUMN "unNumber" TEXT;

ALTER TABLE "products" ADD CONSTRAINT "products_weight_check" CHECK (("netWeightGrams" IS NULL OR "netWeightGrams" >= 0) AND ("grossWeightGrams" IS NULL OR "grossWeightGrams" >= 0) AND ("grossWeightGrams" IS NULL OR "netWeightGrams" IS NULL OR "grossWeightGrams" >= "netWeightGrams"));
ALTER TABLE "products" ADD CONSTRAINT "products_size_check" CHECK (("lengthMm" IS NULL OR "lengthMm" > 0) AND ("widthMm" IS NULL OR "widthMm" > 0) AND ("heightMm" IS NULL OR "heightMm" > 0) AND ("volumeMl" IS NULL OR "volumeMl" >= 0));
ALTER TABLE "products" ADD CONSTRAINT "products_pack_check" CHECK (("unitsPerPack" IS NULL OR "unitsPerPack" > 0) AND ("packsPerLayer" IS NULL OR "packsPerLayer" > 0) AND ("layersPerPallet" IS NULL OR "layersPerPallet" > 0));
