# Messages

Messages is a Core utility, opened from the business top bar or Home utility rail.
It opens a modern blue/white pop-out with conversations beside the timeline on
wide screens. Phone screens show the conversation list or active chat, with a
back button. Expand opens `/chat` in the same branded utility shell. The separate
Atlas Admin console has no chat instance. Notifications can open a specific chat.

A conversation can contain colleagues or customer contacts in the current company
(up to 12 participants including the sender). Contact conversations are stored in
Atlas; they do not email or send outside Atlas. Conversation details show actual
participants and shared records in the displayed message page. No online presence
or delivery/read receipt is inferred; the check beside an authored message means
it was saved/sent. Read-only access has no composer.

The composer supports multiline text, participant mentions and up to eight real
record references: Sales orders, quotations, Customer Master records, Projects and
Products. The grouped picker searches authorised records by name/reference.
Selected references appear above the composer and can be removed before sending;
a TEXT message may share references without a separate comment. Recipient read
permissions and source entitlements are checked again when presenting references;
inaccessible records show a generic placeholder without identity/link. Private
Projects retain native project scope; scrubbed/archived customers are not selectable.
File uploads and additional record categories are outside this initial record picker.

Tasks, follow-ups, requests, notes and meetings retain the existing central workflow.
Tasks and meetings are actual Projects records rather than a second chat task store.
Chat `core.chat.read`/`core.chat.write`, source licences/capabilities and tenant scope
remain server enforced. Company broadcasts remain disabled. Chat drafts are separate
per conversation in component memory and survive pop-out closure/switching. They
are not persistent across page navigation, reload or sign-out. While sending, the
composer is disabled; a failed send retains its draft and attachments for review.

Search in a conversation matches message text across central history, rather than
only the last screen. History pages use 80 messages plus one look-ahead record and
stable descending `(createdAt,id)` boundaries; the cursor is first checked against
the same tenant and participant-authorised conversation. Earlier messages/matches
and Latest buttons navigate pages. Search/history browsing does not mark newer
messages read. Polling runs every eight seconds while the page is visible and does
not force the reader to the bottom unless already near it; closed pop-outs poll
unread summaries without opening/marking the active chat read. This is polling,
not a WebSocket presence service. Search is text-only; attachment labels are not
indexed into historical message search.

Paths: `src/core/chat/policy.ts`, `src/app/(app)/chat/actions.ts`, `chat-dock.tsx`,
`page.tsx`, `src/app/api/chat/route.ts` and business shell components. Existing Chat
models are used without migration. Tests: `tests/chat-dock.test.ts`,
`chat-workspace.test.tsx`, `chat-tagging.test.ts`, `workspace-security.test.ts`.
`scripts/check-messages.ts` is an explicit Linux-only central acceptance check using
an existing Guardian identity and synthetic contact/chat. It attaches an existing
readable order without editing it, creates synthetic message history, exercises the
real browser composer/picker and retires the fixture contact/customer afterwards.
No real participant, credential or grant is added. See CURRENT_STATE for checks
actually run, exact deployment evidence and remaining blockers.
