-- Administrators could open Finance but most of its menu was hidden: the admin role held only four
-- Finance capabilities. Grant the rest to existing admin roles (additive).
DO $$
DECLARE caps text[] := ARRAY['finance.overview.read','finance.receivables.read','finance.receivables.manage','finance.payables.read','finance.payables.manage','finance.purchase.read','finance.purchase.manage','finance.request.create','finance.spend.read','finance.expense.create','finance.approval.decide','finance.bank.read','finance.bank.manage','finance.bank.verify','finance.bank.reveal','finance.payment.create','finance.payment.approve','finance.ledger.read','finance.journal.create','finance.journal.post','finance.period.manage','finance.asset.read','finance.asset.manage','finance.planning.read','finance.planning.manage','finance.tax.read','finance.report.read','finance.control.read','finance.configure'];
DECLARE cap text;
BEGIN
  FOREACH cap IN ARRAY caps LOOP
    UPDATE roles SET capabilities = array_append(capabilities, cap) WHERE key = 'admin' AND NOT (cap = ANY(capabilities));
  END LOOP;
END $$;
