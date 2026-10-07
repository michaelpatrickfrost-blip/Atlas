# Finance ERP live acceptance — 7 October 2026

Finance implementation commit: `6e1743a`. Server HEAD at acceptance: `3c8980b`
(contains Finance plus the reviewed finished Service profile-override fix).
Central backup: `/home/administrator/backups/atlas-pre-deploy-20261007-073332.dump`.
Migration `20261007220000_finance_erp_controls` applied successfully. Server
production build/restart succeeded; public `/login` returned HTTP 200.

Executed the current `scripts/check-finance-erp.ts` through its disposable server
execution copy with `ATLAS_FINANCE_LIVE_TEST=1`. Normal password sign-in and deployed
Next Server Actions were used. All 41 assertions passed, including repeated
independent-approval checks. Both synthetic Test companies were suspended and all
temporary memberships/password credentials revoked. Posted journals, settlements,
timelines and audit evidence remain protected and retained; no real company's
records or permissions were changed.

## Passed live assertions

- Supplier requester cannot approve own onboarding.
- Document creator cannot approve own request (8 documents checked).
- £10,000 plus VAT posts balanced AR, revenue and output tax.
- Document, accounting, tax dates and original rate retained.
- Invoice posting retry produces one journal.
- Statement import replay leaves one identical row.
- Conflicting statement ID cannot replace evidence.
- Bank allocation and replay settle AR exactly once.
- EUR bill settles at retained £8,600 carrying value with £150 realised loss.
- Settlement preserves original invoice exchange rate.
- Partial receipt leaves £70 outstanding.
- Collections retain promise and reject read-only writes.
- Promise cannot exceed outstanding balance.
- Over-allocation rolls back bank and document mutations.
- Cross-tenant Party cannot enter Finance.
- Goods receipt retry retains one source, GRNI posting and quantity.
- Bill for 100 cannot post against 80 accepted units.
- Repeated PO line cannot bypass cumulative receipt quantity limit.
- Accepted bill clears PO cost from GRNI and posts tolerated price variance separately.
- Missing required account dimension prevents journal creation.
- Independent journal approval and linked reversal preserve dimensions.
- Database rejects alteration of posted journal.
- Database blocks unbalanced posting and rolls back draft and lines.
- Reconciliation retry remains safe after closing period.
- Closed-period posting leaves approval and ledger unchanged.
- Period requester cannot approve reopening.
- Independent versioned approval reopens period.
- Authenticated live page /finance/ledger.
- Authenticated live page /finance/settings.
- Authenticated live page /finance/reconcile.
- Authenticated live page /finance/collections.
- Authenticated live page /finance/help.
- Authenticated live page /finance/journals/cmuxsoky6001op0d5w3i013p3.
- AR/AP control reconciliation returns zero difference.

## UI and release checks

The live in-app browser opened Finance Help, expanded the collections guidance,
followed its link and rendered Collections with entity/queue/search controls.
Visual inspection found readable layout and the existing capability-filtered
navigation. The HTTP acceptance additionally rendered Settings, Ledger, Reconcile,
Collections, Help and a real posted-journal distribution with the full test profile.

Compatible local release checks: Prisma validate/generate, separate TypeScript,
focused ESLint (zero errors/warnings), production build, whitespace checks and
full Vitest suite passed. After integrating finished main updates the suite was
586 passed / 22 skipped (97 passing test files / 3 skipped). Skipped integration
tests are not claimed verified. The 59 Finance-focused tests also passed.

This evidence covers the implemented accounting continuation, not all 223 ERP
requirements. Read `FINANCE_ERP_DELIVERY.md` for actual capabilities and remaining
costing, treasury, group, statutory and other gaps.
