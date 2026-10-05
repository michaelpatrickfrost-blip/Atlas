-- Additive: uploaded contract PDFs, quotation approval by link, fuller signing record.
ALTER TABLE "contract_documents"
  ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'CONTRACT',
  ADD COLUMN IF NOT EXISTS "message" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "fileName" TEXT,
  ADD COLUMN IF NOT EXISTS "fileType" TEXT,
  ADD COLUMN IF NOT EXISTS "fileSize" INTEGER,
  ADD COLUMN IF NOT EXISTS "fileContent" BYTEA,
  ADD COLUMN IF NOT EXISTS "signerUserAgent" TEXT,
  ADD COLUMN IF NOT EXISTS "signatureImage" TEXT;
