ALTER TABLE finance_documents ADD COLUMN "salesOrderRevision" INTEGER;
ALTER TABLE finance_document_lines ADD COLUMN "salesOrderLineId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS sales_orders_id_organisationId_key ON sales_orders(id,"organisationId");
ALTER TABLE finance_documents ADD CONSTRAINT finance_documents_salesOrderId_organisationId_fkey FOREIGN KEY("salesOrderId","organisationId") REFERENCES sales_orders(id,"organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;
