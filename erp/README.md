# Moriyati ERP — Factory review v0.3

Persian RTL factory operations preview built from the user's latest decisions. Sample numbers are not actual production, attendance or financial records. Staff profiles model the organisation; they are not login credentials.

- GitHub Pages: https://moriyati-ir.github.io/moriyati.ir/erp/?v=0.3#overview
- Source: https://github.com/moriyati-ir/moriyati.ir/tree/moriyati-erp/erp
- Private server-backed review: https://moriyati-erp.humble-deer-9355.chatgpt.site

## What changed

The revised model centres on numbered material identities, actual stock locations and modular tasks. Financial ownership, receivables, payables and counterparty settlement stay in Zarin. Legacy owner fields remain readable for compatibility, but the current UI never asks for or calculates owner accounts.

- Numbered intake with reference/invoice, optional supplier, gross/unpacked grams and explicitly unknown declared fineness; full/partial acceptance or full return.
- Ordered, repeatable process plans; independently split material portions; destination, target grade, finish and priority changes with audit history. Default 3 kg tasks can run concurrently. Pause with reason, explicit resume and individual worker sessions.
- Physical inventory across safe, R&D, melting, solutions, filters, chloride, precipitate, drying, polishing, packing and recovery. Free material, task allocations, residue, unallocated recovery output and ready products are counted once. Internal transfers close into their destination.
- Material grams separate from known/estimated/unknown contained fine metal. Intermediate XRF remains estimated after approval. Final recycled-material results require traced refining, drying and subsequent melting plus confirmed actual dry-metal weighing.
- Signed declared/factory grade differences and 999.9-equivalent grams. Final actual recovered yield uses actual final output weight and grade, rather than multiplying the original raw mass by refined grade. Incomplete, returned, mixed or uncertain lots cannot pretend to be definitive.
- Explicit material balance, additives, collected residue, carrier discharge and discrepancy follow-up. Partial residue returns preserve source-container quantities. Recovered groups return with new physical IDs; no invented division of joint yield among sources.
- Retained independent crucible/remelt counters, reusable-solution replacement intervals, source-linked recovery, product passports/photos, ten departments, twenty-profile permission model, independent attendance/market trips and master appearance settings.

The full reconciliation, including which earlier assumptions were superseded, is in `docs/FACTORY_REQUIREMENTS.md`.

## Storage and integration limits

Pages saves only in this browser under `moriyati-erp-github-demo-v3`. Existing v2 data is upgraded on load; v2/v1 keys remain untouched. It does not synchronise records between staff or devices. Browser photos are limited to 240 KB; quota failure is reported without a false saved confirmation.

The private app retains owner-authenticated APIs, owner-scoped D1 documents and R2 photos; revision leases prevent lost updates. The v3 JSON document needs no new D1 table migration. This review is not a normalised production ERP ledger or a guaranteed lifetime archive.

Staff authentication, administrator-issued five-minute codes, real hardware readers/scales, public cryptographic authenticity, the Zarin API, offline operation and independent backups remain unconnected. Role simulation is not staff security. No financial transaction or purchase is performed.

## Build and validation

Use Node 22.13+ (Node 24 recommended) with the locked dependencies.

```sh
npm run install:ci
npm run typecheck
npm test
npm run build:pages
npm run build
```

The suite has 40 domain tests: 15 for the active v3 flow and 25 compatibility tests for retained earlier domains. New tests cover unknown-grade intake, partial acceptance, actual refined output/XRF comparison, repeated process routes, independent splitting, solution fine-content estimates, paused tasks, transfer stock conservation, material differences and their resolution, partial residue returns and grouped recovery identities. Browser QA checks numbered intake, partial return, persistence after reload and independent replanning of a 200 g portion.

- Pages output: `work/github-preview/dist`, mirrored to main repository `dist/erp/`. Preserve existing Pages publishing. Never deploy to Liara without explicit user instruction.
- Private Worker: supplied Vinext/Cloudflare build and `.openai/hosting.json`.
- Existing D1 migration: `drizzle/0000_futuristic_mindworm.sql`.
- `tests/api.integration.mjs` requires an accessible authenticated local server and is not included in the domain-test count.

## Current code

- `lib/flow.ts`: active v3 commands, migration, material/provenance rules, stock and comparison calculations.
- `app/factory-app.tsx`, `app/flow-panels.tsx`, `app/factory.css`: current interface, forms, modular route builder, stock and comparison panels.
- `lib/factory.ts`: shared types and retained tool/solution/recovery/personnel commands. Direct legacy commands are not the current application entry point.
- `lib/erp.ts`: current workspace dispatch into the v3 flow, with prior records retained.
- `app/api/workspace/`, `app/api/photos/`: authenticated private persistence.
- `tests/flow.test.mjs`: active-flow regression tests.
- `scripts/build-github-preview.mjs`: reproducible static review build.
