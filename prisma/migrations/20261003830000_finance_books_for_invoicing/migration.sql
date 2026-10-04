-- Administrators and finance managers can create the first set of books and open a sales invoice.
UPDATE "roles"
SET "capabilities" = (
  SELECT ARRAY(SELECT DISTINCT unnest("capabilities" || ARRAY['finance.configure', 'finance.receivables.read']::text[]))
)
WHERE "key" IN ('admin', 'finance_manager')
  AND NOT ('finance.configure' = ANY("capabilities"));
