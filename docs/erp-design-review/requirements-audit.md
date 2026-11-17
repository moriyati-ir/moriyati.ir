# Moriyati ERP — notebook reconciliation

Reviewed 17 November 2026 against the complete decision notebook: **784 canonical blocks**, including every table row. Block IDs and available hashes were cross-checked against the same sequence-100 snapshot. Private notebook text and its review ledgers are not included in this public repository.

The latest decisions govern historical notes. This is the same `/erp/` preview, with synthetic data and local browser persistence. It is not an authenticated production ERP.

## Reconciled decisions

| Area | Applied design and local behavior | Relevant implementation |
| --- | --- | --- |
| Shared navigation | Common social mobile layout; full permitted management tools in Settings; four management desktops; staff phone layout | `app.mjs`, `policy.mjs`, `app.css` |
| Privacy | Haji has no HR/personnel profile/payroll routes; HR restricted to Alireza/Behnam; Nazanin sees minimal name/amount/receipt instructions; own profiles and message spaces isolated | `policy.mjs`, `factory-ui.mjs`, `messenger.mjs`, `personal.mjs` |
| Physical stock | Separate gross/net, tare, wet/dry basis, declared/measured/estimated/unknown fineness; measured, declared and estimated content not presented as one measured total; precision retained | `core.mjs`, `factory-model.mjs`, `factory-ui.mjs` |
| Admission | Numbered multi-item receipt with per-item photos and sender/factory readings; partial acceptance, unresolved balance and returns; no automatic work order | `factory-model.mjs`, `factory-ui.mjs` |
| Custody | Task reservation, release with reason, independent sender/receiver, pending transfer protection, receipt/discrepancy and single stock movement; limited Majid handover view | `factory-model.mjs`, `factory-ui.mjs` |
| Work planning | Product / General, presets / Other, mass or count target, multiple planned outputs, target fineness/finish, actual route and endpoint, named owner and task-local adjustment owner | `task-ui.mjs`, `factory-model.mjs` |
| Collaboration | Staff request, Alireza/Behnam decision, separate personal invitation response, real prerequisites and result receipt; role assignment does not imply acceptance | `policy.mjs`, `factory-model.mjs`, `factory-ui.mjs` |
| Continuity | Individual work start/end, task pause/resume, material location, reasoned running edits, preserved stages/reports, manager-only closed-task reopen | `app.mjs`, `factory-model.mjs` |
| Parallel work | Partial source batches, independent process reports/run IDs, split outputs and secondary metal, conditional lot isolation; completing one run does not automatically finish every run | `task-ui.mjs`, `factory-model.mjs` |
| Formal reports | Actual author/time, text and fields above photo albums; blank measurements remain unknown; process-specific reasons, optional R&D/experience, external-order responsibility evidence | `task-ui.mjs`, `app.mjs` |
| XRF | Current method only; daily operator activation; selected result with both sample and full-screen photos; own reasoned correction; mismatch warning rather than automatic operator stop | `factory-model.mjs`, `factory-ui.mjs` |
| Consumption | Actual per-task consumption, shortage warning, own correction, numbered tools, repeated-use gram workload and lifecycle; solution top-up versus new replacement cycle | `factory-model.mjs`, `factory-ui.mjs` |
| Recovery | Durable source/location/certainty card, follow-up evidence, partial actual outputs, once-only credits and source-position consumption; recoverable residue never automatically becomes final loss | `factory-model.mjs`, `factory-ui.mjs` |
| Final units | Permanent internal unit identity, optional printed serial shared by product/package, front/back evidence, separate actual weights/production time; independent packaging events and real event-specific QR encoding | `factory-model.mjs`, `factory-ui.mjs`, `product-qr.mjs` |
| Repackaging | Invalidate packaging only; preserve unit, serial and history; old event remains invalid; external invalidation never credits factory stock before actual return | `factory-model.mjs` |
| Quality and exit | Mehrab final QC, distinct Haji exit authority, absent-Haji substitutes and temporary authority, actual dispatch/arrival/destination receipt/discrepancy; related office manifest only | `factory-model.mjs`, `factory-ui.mjs` |
| Factory finance | Accounts/opening balances/journal, explicit unset Nazanin limit, manager approval outside limit; payment execution and receipt attachment separate and idempotent; no real banking action | `factory-model.mjs`, `factory-ui.mjs` |
| Purchasing | Buyer invoice lines/evidence or missing-receipt explanation; Nazanin correction/finalization; Behnam float approval, finance funding and buyer receipt distinct | `factory-model.mjs`, `factory-ui.mjs` |
| HR | Variable daily schedules, paid breaks, own reasoned attendance correction, Behnam leave/special-presence decision, determined bonus separate from paid, private manual assessments and financial records | `factory-model.mjs`, `factory-ui.mjs`, `personal.mjs` |
| Own performance | Day/week/month/quarter/half-year/year/all-history ranges; actual personal attendance, task participation, tool workload, missions and paid instructions enter own projections; private HR notes/scores excluded | `core.mjs`, `personal.mjs`, `app.mjs` |
| Messenger | Independent direct/peer-group conversations, image/video/audio/file albums, media and voice review/cancel, reply/forward/reaction/edit/delete, search, pin/mute/archive; truthful local status | `messenger.mjs` |
| Private notes | Selected-source editable excerpts, private notes, dated reminders, completion/reschedule/cancel; no fabricated AI summary or transcription and no automatic task creation | `messenger.mjs` |
| Retained archive | Message originals, revisions and attachments retained separately; protected archive and raw backup/restore visible only to Alireza | `messenger.mjs`, `factory-ui.mjs`, `app.mjs` |
| Notifications | Recipient/source checks, permitted report mentions and invitations; no access granted by a mention; push-first/SMS-on-push-failure policy retained | `policy.mjs`, `factory-model.mjs` |
| Trips/devices | Separate vehicle-device identity, self-start/end passenger participation, trip pickup/delivery/parking evidence, one-week local/selected-permanent video policy; configurable device viewer/controller design | `factory-model.mjs`, `factory-ui.mjs` |
| Appearance/help | Per-account light/dark, font and text size, Persian/English and direction/calendar, touch/keyboard field help, temporary labeled toman view; image-only zoom | `locale.mjs`, `core.mjs`, `app.mjs`, `app.css` |
| Connectivity/sign-in | Factory main and live office replica, outside-operation freeze and independent-messenger exception; normal owner-phone desktop approval distinct from restricted five-minute emergency access | `factory-model.mjs`, `factory-ui.mjs` |

## Deployment boundaries

The preview exercises local state transitions, forms and role guards. Real authentication and server authorization, immutable storage, durable cross-device messaging/media, live presence/calls, push/SMS delivery, two-server replication, camera/scale/NFC/biometric validation, DVR/IoT commands and vehicle background GPS/video remain server or device integration work. Disabled connection controls are intentional and do not claim working hardware. Browser role selection is a design-review aid, not authentication.

Future head-office CRM, customer financial ownership/credit/settlement and Zarin integration remain separate from current physical factory inventory and factory cash accounting. Technical connection values, real accounts, thresholds, device models and pre-launch migration details are not fabricated.

## Validation

Behavioral tests cover access boundaries, explicit unknowns and precision, receipts/partial admission, reservations and two-party stock conservation, invitations/dependencies, running edits/reopen, report/work-start separation, XRF, consumables/tool workload/solution cycles, recovery idempotency, package invalidation and no-tag identities, payment limit/receipt separation, HR projections, message retention/privacy, self-declared trip participation, and an encoder-to-independent-decoder QR round trip.

Browser review covers phone forms, actual start/report, message edit/delete, account switching, Haji settings, staff request and authorized tools, and desktop/tablet layouts. Connected hardware and actual staff devices are not certified by these checks. GitHub Pages remains the working publication; Liara is unchanged.

QR encoder: Project Nayuki, MIT. Vendored source at `reference-assets/qrcodegen.ts`, upstream blob `c4191ac0b5f8a24d87fd9340ceaa2d3b07d0231a`; generated ES module retains the license and has no runtime CDN dependency.

Final verification: all 76 repository tests passed. The browser receiving test attached a real sample product image, preserved 100.0000 / 101.2550 gram readings, and admitted 60 grams, returned 10 grams and retained 30 grams pending without creating a task. Pending/external material bypasses are explicitly rejected.
