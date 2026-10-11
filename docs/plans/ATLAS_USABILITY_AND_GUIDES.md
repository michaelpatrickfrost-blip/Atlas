# Atlas usability, guidance and private-access website

11 October 2026. Michael requests an architect-led system review, complete usable
controls, detailed Procurement/Maintenance/Quality, simpler S&OP, nicer visuals,
practical guides, test-data cleanup and live deployment. Ease of everyday work is
the primary acceptance criterion. He additionally requests an animated polished
Atlas website explaining the platform, with existing-user access only and no
signup, subscriptions or pricing.

## Baseline and delivery approach

Use exact live `ad9d5a430e2b92e6b08448a45d11f694f5ce2066`, preserving newer Studio,
My tasks, permissions and all central records. The canonical Desktop checkout is
concurrently dirty and must not be reset or deployed wholesale. This explicit Git
worktree is the editable source for the scoped release.

1. Inspect architecture, shared memory, owning services and actual app navigation.
   Audit routes and run the existing suite once; repair confirmed failures.
2. Add authenticated searchable Guides, discoverable from utilities, Apps and
   contextual help. Cover all available business apps and explain real workflows,
   required information, outcomes, common blockers and terminology. Links retain
   native permission and module-availability checks. Reuse existing specialist help.
3. Improve Maintenance asset selection, attention queues, filters, pagination and
   next steps. Clarify Procurement's canonical Finance ownership and connected
   Manufacturing proposals. Improve Quality's attention and containment journey.
4. Simplify S&OP around prepare → review → decide → release, preserving immutable
   versions, source lineage, review/approval and demand-publication guards.
5. Refine shared visual hierarchy and responsive layouts. Create an illustrative
   animated public introduction at `/`, describing verified capabilities and
   private access, without exposing records or platform-administration addresses.
6. Review final diff; run meaningful regression/type/build checks, actual browser
   flows and responsive visual QA. Back up and clean explicitly marked Test data
   using the existing atomic cleanup service, preserving ordinary/internal data,
   shared staff identities and durable cleanup history. Remove task-created local
   disposable data. Deploy under release locks; verify public revision and flows.

## Confirmed source findings

- Maintenance offers equipment and vehicle selectors together although its command
  requires exactly one. Its overview fetches at most 201 records, then slices to
  200; it cannot filter older work or show accurate full-register totals.
- Guides are fragmented between Manufacturing, Finance and S&OP; no shared guide
  library exists. Module navigation is already capability-filtered.
- `/` redirects to sign-in; there is no explanatory Atlas website.
- Procurement is Finance's `/finance/purchases` dynamic workspace, not a separate
  business entity. Source purchase/receipt/invoice controls must remain canonical.
- S&OP already has guided status-driven next steps; improve that implementation
  rather than duplicating its planning workflow.

Delivery evidence, discovered blockers and actual checks belong in
`.ai/CURRENT_STATE.md` and the dated release evidence. This plan is not a claim that
all ERP master-spec gaps or external-provider integrations are delivered.
