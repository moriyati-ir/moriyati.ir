# Moriyati workspace design preview

This is the current ERP UI design, published at the repository's GitHub Pages
`/erp/` path. It replaces the previous compiled factory review interface.

Buildless HTML, CSS and native JavaScript modules are the editable source. No
dependency installation is needed. `app.mjs` renders shared UI components;
`app.css` defines the two themes and responsive layouts; `data.mjs` contains
synthetic fixtures; `core.mjs` derives period totals and chart buckets.

The preview covers the task explorer (product/general), task profiles with
process highlights and manually paged reports, task/request creation including
Other with a required description, report entry, activity and mentions, a local
messenger, personal notes/reminders, and seven personal performance slides.
The design sheet changes day/night theme, type size, font candidate and sample
role across the interface. A new shared family of transparent product and process illustrations is used throughout.

All work records, financial amounts, dates, receipts, messages and task states
are illustrative fixtures. New records are local to this browser; nothing is
sent to staff. Voice recording uses the browser microphone only on an explicit
tap; calls are UI previews and do not establish a real call. The reminder UI
stores a personal note and time, without a background notification service.

This is not an authenticated ERP, payroll system, server-side access control,
inventory ledger or bank integration. The role selector is a design-review
control, not authentication. No real employee HR or banking data is included.

Checks: `node --check dist/erp/app.mjs`, `node --test tests/*.test.mjs`, and
interactive review through the managed browser preview. Publish through the
existing GitHub Pages workflow. The repository's explicit-only Liara policy
continues to apply.

Device/role policy: Alireza, Behnam and Haji share the social mobile interface
with manager operations, and receive an enterprise desktop layout. Mobile management tools are grouped
in Settings and Activity, while the normal mobile UI remains shared. Haji has no
HR, employee-work-record or payroll profile view. Nazanin has a full desktop
finance workspace and a full mobile finance view. Other staff
share the mobile interface with role-specific actions and have no enterprise
desktop layout; desktop design review displays their mobile frame.

The responsive review canvas is available at `review.html`. The new `visuals/` assets use consistent lighting, materials and neutral framing.
Product identities and the prompt set are documented in `docs/erp-design-review/product-visuals.md`.

Latest UI labels: product / general are shown in Persian as محصول / عمومی.
All four management accounts have full mobile capabilities within their existing
permissions. Management task browsing includes active, waiting, done and cancelled
work; ordinary staff see their own active work.

Review evidence: `docs/erp-design-review/mobile-settings.jpg` and
`docs/erp-design-review/mobile-management.jpg` show the shared mobile Settings
page and manager group. Reviewed at phone width 390, tablet width 820 and full
desktop. Verified task stage switching, report paging, image-only zoom, personal
chart periods, Other validation, employee request restrictions, local messaging
and notes, finance navigation, and role-dependent Settings visibility.


Notebook reconciliation (17 November 2026): the complete 784-block notebook was
reviewed against the delivered preview, with the latest decisions taking
precedence. The current design adds guarded local workflows for receiving,
partial admission, reservations and independent custody, request/invitation/
prerequisite control, task continuity, XRF, actual consumables/tool/solution use,
recovery, permanent product/package identities and QR, QC/exit/receipt, factory
finance, personal/HR records and an account-private messenger. There are seven
personal chart topics and seven time ranges. See
`docs/erp-design-review/requirements-audit.md` for the applied matrix, validation
and explicit server/device boundaries. These are local prototype workflows;
actual authentication, server authorization, durable messaging/media, hardware
and two-server connections remain integration work. No real financial action or
message to staff is performed.
