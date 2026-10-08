# Guardian Tickets access verification — 8 October 2026

Application `7a7f005` deployed at https://atlassystem.online.

Pre-fix: missing Tickets read access produced a generic production error instead
of an access explanation. Disabled/unentitled layouts showed a disabled view, but
parallel child rendering still threw the module guard and there was no explicit
Home recovery link. Browser fixtures reproduced both; the unit permission-screen
regression failed before repair. Source/private journal matched the original reports.

The Tickets layout and individual record-reading views now render restrictions from
server capability/module checks. Layouts alone do not prevent child rendering or
protect an RSC payload. Existing actions retain permission, enabled/entitled, tenant
and concurrency checks. Unexpected query failures propagate; they are not relabelled
as restrictions. Shared Service views preserve their respective capabilities.

On the deployed release, `scripts/guardian/check-ticket-access.ts` passed:

- 24 direct requests: list, detail, create, queues, catalogue, knowledge, reports and
  legacy queue redirect for missing-read, disabled and unentitled fixtures.
- Exact visible permission/app restriction and actual Home link navigation.
- 390px main-content fit and zero browser errors.
- Synthetic private queue/ticket markers absent from HTML/RSC response payloads.
- No increase in Tickets server-render diagnostics across the checks.
- Direct create actions still reject. Each exact central fixture retains one seeded
  record, its original version/subject, original queue name and no work entries.

The enabled `scripts/guardian/check-ticket-pages.ts` also passed actual queue create,
stale save/draft retention/newer record protection, retry, ticket create and correct
queue/requester/deadlines, following, exact reply and list/detail links. All matching
central-state assertions passed, with zero browser errors.

Only newly created Test companies/profiles were used. Cleanup suspended each exact
company, revoked sessions and retained central history; existing customer data and
permissions were untouched. No customer messages sent or local business store made.

Validation: 30 focused tests; 781 full-suite passes / 22 integration skips; separate
TypeScript, focused ESLint, production build and diff check passed. VPS build/restart,
96 current migrations and public HTTPS login passed. Guardian timer/heartbeat healthy.
Private database and Service evidence backups retained in administrator backups:
`atlas-pre-guardian-access-20261008-125227` and `atlas-pre-deploy-20261008-125900`.

FIXED original Ticket reports: `cmuzhgq89000im6d5ilt7pxkq`,
`cmuzh9azi0005pvd54gkrzs6u` and reproduced duplicate `cmuzjdsri0006a8d54lmjb9ro`.
The exact disabled direct-action guard remains expected. Original S&OP interruptions,
unknown older actions and non-atomic deployment remain separate NEEDS_AI reports.
This verifies these workflows and access cases, not every system control or role.
