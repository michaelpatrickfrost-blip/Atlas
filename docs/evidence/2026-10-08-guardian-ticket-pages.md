# Guardian Tickets and rejected-save verification — 8 October 2026

Application revision: `3db6f4c`, live at https://atlassystem.online.

The pre-fix component regression failed and actual two-tab queue editing reproduced
lost draft input on `eabd457`. The server correctly rejected the stale write; React
reset the handled-error form. The shared ActionForm now prevents implicit reset,
keeps draft/error feedback and resets only after success. No business guard changed.

Verified against the deployed application using the explicit server-only
`scripts/guardian/check-ticket-pages.ts` fixture:

- Formerly blank queue workspace renders and Create queue saves the correct
  company and creator membership.
- Tab B saves a newer queue name. Tab A rejects its stale save, retains its entered
  draft and visible error, and leaves the newer database name intact.
- Refresh and retry save the intended name with Saved feedback.
- Create ticket navigates to the visible detail subject. The central record has
  the expected same-company queue, requester and response/resolution deadlines.
- Follow updates changes to Stop following and stores the fixture user as watcher.
- Add reply displays the exact synthetic reply and creates exactly one matching
  central entry. Tickets back link and the list subject open the same detail.
- No browser errors. All exact disposable Test companies are suspended, memberships
  inactive and fixture sessions revoked. Audit/history retained centrally.

The fixture never edits an existing company/profile or sends an external/customer
message. It holds the release lock; secrets stay in memory. Database/private Service
backup: `atlas-pre-deploy-20261008-115647` in the administrator server backups folder.

Validation: 34 focused tests, 715 full-suite passes, 22 integration skips; production
build, separate post-build TypeScript, focused lint and diff check passed. Server
build/restart and HTTPS login passed; 96 migrations with none pending.

Reports `cmuzhb3jm000016d5772a0h57`, `cmuxrrto60003sxd5l2iy32bl` and
`cmuxrrtnk0002sxd51b1kpakv` are FIXED with this original-reproduction evidence.
Four exact intentional concurrency/manufacturing guard reports were classified
through the staff UI; current downloaded private AI briefs preserve those notes.

Disabled/denied Tickets renders and a closed S&OP stream remain separate NEEDS_AI
reports with exact source/log category and next investigation. A passing enabled
fixture does not clear denied profiles or unknown interrupted requests. Worker and
timer remain healthy. This proves these tested paths, not all system controls.
