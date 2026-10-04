export const FINANCE_CAPABILITIES={
 read:'finance.overview.read',receivablesRead:'finance.receivables.read',receivablesManage:'finance.receivables.manage',
 payablesRead:'finance.payables.read',payablesManage:'finance.payables.manage',purchaseRead:'finance.purchase.read',purchaseManage:'finance.purchase.manage',
 request:'finance.request.create',spendRead:'finance.spend.read',expense:'finance.expense.create',approve:'finance.approval.decide',
 bankRead:'finance.bank.read',bankManage:'finance.bank.manage',bankVerify:'finance.bank.verify',bankReveal:'finance.bank.reveal',
 paymentCreate:'finance.payment.create',paymentApprove:'finance.payment.approve',
 ledgerRead:'finance.ledger.read',journalCreate:'finance.journal.create',journalPost:'finance.journal.post',periodManage:'finance.period.manage',
 assetRead:'finance.asset.read',assetManage:'finance.asset.manage',planningRead:'finance.planning.read',planningManage:'finance.planning.manage',
 taxRead:'finance.tax.read',reportRead:'finance.report.read',controlRead:'finance.control.read',configure:'finance.configure',
} as const;
