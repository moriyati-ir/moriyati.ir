# Moriyati ERP — Factory review v0.2

Persian, RTL, responsive ERP review built from the user's actual factory decisions. All quantities and operating statuses in the opening dataset are samples. Staff names/roles are an organisational model, not login credentials or real attendance records.

- Working public preview: https://moriyati-ir.github.io/moriyati.ir/erp/
- Source: https://github.com/moriyati-ir/moriyati.ir/tree/moriyati-erp/erp
- Private server-backed review: https://moriyati-erp.humble-deer-9355.chatgpt.site

## Factory workflows

1. Receive consignments with company/customer ownership, conditional acceptance, independent conditional acid-work flag, input form, photo, gross/net gram weights and declared fineness. Utensils must be prepared for assay. Conditional acceptance/return acts on the whole consignment, including its recorded residue containers.
2. Record sample, method, result, purpose, assayer and approval. A superseding result retains the prior approved version. Production and product records keep their own fineness snapshots.
3. Allocate partial runs (3 kg default), leaving the rest of the consignment available upstream. Multiple runs and stages can operate concurrently. Every participant records their role and individual start/end; only the current run's open sessions prevent its completion.
4. Track cutting, melting/remelting, riegeh, flaking, acid work, filtering, precipitation, drying, electrorefining, copper alloying, granulation, casting, rolling, blanking, minting, polishing, QC and packing. Intermediate output becomes available to the next operation independently of unfinished upstream portions. No final gold granule product is released.
5. Pool identical confirmed-fineness silver across owners while preserving each weight share and full parent relationships. Different fineness, conditional consignments and independent acid work cannot be mixed. Independent vessels/residues/recovery remain separate.
6. Register consumable acids, powders and solutions against each job in **grams**. Allow actual consumption below available stock and emit a correction warning. Keep reusable solution campaigns separate from consumable stock.
7. Distinguish ingot, granulation and 5 kg melting crucibles; engrave heat-exposed serials and record ordinary equipment's steel-plate/RFID identifiers. Add new usable tools without automatically retiring old ones. Count every remelt independently from unique material input or final output.
8. Track 990.0/999.9 (and configured other-grade) granulation solution campaigns from installation to replacement. Calculate work since that campaign's installation from its linked cycles. Replacement closes the old campaign, queues its source serial for recovery and creates a zero-count campaign.
9. Trace residue by source, station and container, including granulation, centrifuge bags, polishing, crucible residue, riegeh tables, filters and acid spills. Retired crucibles/solutions enter the same recovery queue.
10. Recover chosen sources as a measured group, retaining every source serial. Never invent per-source yield or owner allocations. Explicit owner weights must equal the actual recovered weight before material returns to the assay/QC workflow.
11. Issue unique product/packaging/tag identities and front/back photos from approved final material, preserving all source-owner shares. Validate collection metal, fineness and weights. Record physical delivery separately from financial settlement.
12. Summarise each full consignment only after its open runs and unfinished material are clear. Show final product grams, pure grams, unaccounted differences and unresolved recovery separately; an unaccounted difference is not automatically declared physical loss.
13. Keep attendance and the chairman/market runner's market trips in separate registers. Provide the ten factory departments and internal service requests.
14. Model CEO/superadmin, operational chairman and individual department permissions, with a maximum of twenty profiles. Master settings can edit profile permissions, accent, background and font. The public role selector is explicitly a simulation.

The exact reconciled requirements are in `docs/FACTORY_REQUIREMENTS.md`. The interface's capability map separates executable workflows from remaining integrations.

## What is not connected

Real employee logins, administrator-issued five-minute access codes, individual server sessions and real invitations are not implemented. The private app has an owner-level Sites identity boundary; it is not a deployed twenty-user authentication system. The role simulator is not an access-control boundary.

Accounting Zarin, financial settlement/fees, actual RFID/NFC readers, scales, customer-facing cryptographic tag verification, production offline sync and independent backup/restore are not connected. No automatic purchase, trading, payment or financial transaction runs.

## Persistence

GitHub Pages stores only in this browser (`moriyati-erp-github-demo-v2`). The previous v1 key is preserved separately. It does not synchronise factory records between people or devices. Optional preview photos have a small file limit; quota errors prevent a false saved confirmation.

The private app uses authenticated APIs, owner-scoped D1 workspace documents and R2 photos. Revision leases reject concurrent lost updates. The existing D1 table requires no schema migration for the v2 payload. This prototype is not a normalised ERP ledger, immutable accounting audit system or lifetime-retention service.

## Build and verification

Use Node 22.13+ (Node 24 recommended).

```sh
npm run install:ci
npm run typecheck
npm test
npm run build:pages
npm run build
```

The 25 meaningful workflow tests include eighteen factory invariants plus the complete granulation→QC→serialised-product route and six legacy compatibility tests. Browser QA exercises solution replacement/reload persistence and a two-owner pool followed by a partial 3 kg allocation. The Pages build has relative assets and bundled Persian fonts.

- Pages output: `work/github-preview/dist`; publish these files to `dist/erp/` of the main website repo. Preserve its existing Pages workflow; do not deploy to Liara without the user's explicit instruction.
- Server build: supplied Vinext/Cloudflare integration and `.openai/hosting.json`.
- Local D1 migration: apply `drizzle/0000_futuristic_mindworm.sql` once using the supplied Wrangler configuration and `.wrangler/state` persistence.
- Optional `tests/api.integration.mjs` checks an accessible local server. It was not run successfully in the managed preview network and is not included in the claimed 25 passing domain tests.

## Code

- `app/factory-app.tsx`, `app/factory.css`: current factory interface and typed form plans
- `lib/factory.ts`: factory domain, genealogy, ownership, campaigns, recovery and role model
- `docs/FACTORY_REQUIREMENTS.md`: user-decision reconciliation
- `scripts/build-github-preview.mjs`: reproducible browser-storage build
- `app/api/workspace/`, `app/api/photos/`: authenticated persistence/upload APIs
- `tests/factory.test.mjs`: factory invariants and complete route
- `lib/erp.ts`, `app/erp-app.tsx`: previous review's records/domain kept for compatibility; the current page renders `FactoryApp`

This is a reviewable implementation of factory workflows, not a claim of completed production rollout.
