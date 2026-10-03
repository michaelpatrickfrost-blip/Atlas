-- Company brand mark. Nullable so existing organisations keep working unchanged.
ALTER TABLE "organisations" ADD COLUMN "logoDataUrl" TEXT;
