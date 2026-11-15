# Moriyati ERP — Factory Operations Prototype

A Persian, RTL, mobile-friendly working prototype of Moriyati's factory ERP. All opening records are explicitly marked **sample data**. The live application is private to the owner's ChatGPT account; the GitHub source contains no live database, uploads, credentials, or employee records.

Live app: https://moriyati-erp.humble-deer-9355.chatgpt.site

GitHub source: https://github.com/moriyati-ir/moriyati.ir/tree/moriyati-erp/erp

## Working workflows

- Receive an external consignment with owner, origin, gross grams and fineness; create a traceable batch.
- Move through intake, assay, refining, melting/casting, quality control and completion.
- Record each operator's role in a batch, stage, start, end and self-confirmation. An open work session prevents stage advancement; an operator cannot hold two open sessions.
- Record inventory receipt, consumption and stock correction with reasons and optional batch links. Consumption beyond stock is accepted and recorded with a negative-stock warning.
- Assign organizational IDs to tools, track actual cycles and processed grams, retire worn tools with a reason, and link a replacement to its predecessor while preserving its history. Ordinary tools support a steel-plate/RFID identifier; heat-exposed tools use an identifier without a tag in the hot area. Thresholds are configurable review reminders, not predicted service life.
- Complete QC with measured output weight, fineness and recoverable fine grams. Reject impossible pure-metal balances and add completed output to inventory once.
- Register a unique product serial, packaging serial, optional tag ID and optional front/back photos, linked to a completed batch. Validate metal, fineness, collection weights and issued quantities. Move assigned weight from free metal inventory to serialized products.
- Show batch-level fine-metal balances, people in progress, traceability events, global search and CSV exports.

## Persistence and access

React 19 / Vinext on Cloudflare Workers, D1 for owner-scoped workspace records, and R2 for photos. Hosted access is controlled by Sites sign-in. Every read/write/upload checks request identity; photo paths are owner-scoped. Concurrent writes use a revision lease and return a conflict instead of overwriting another tab's change. The owner can use the same account on multiple devices.

The prototype uses one versioned workspace document per signed-in owner. It is not yet a normalized, multi-organization ERP ledger. There are no employee logins, enforced employee roles, external invitations, immutable accounting audit infrastructure, independent backup/restore, offline synchronization, or guaranteed lifetime-retention policy. Without authenticated API access, the UI explicitly enters a non-persistent preview mode; API/storage errors disable writes rather than pretending they were saved.

Accounting Zarin, scales, RFID readers, cryptographic NFC authentication, customer-facing verification and the public Moriyati website are **not connected**. The connection screen accurately labels their status. There is no automatic buying, trading, payment or order execution.

## Development

Use Node 22.13+ (Node 24 recommended).

```sh
npm run install:ci
npm run typecheck
npm test
npm run build
```

For development run `npm run dev`. For a built local preview use `npm start`. The build creates `dist/server/wrangler.json`.

Generate new schema migrations with `npm run db:generate`. Apply each pending migration once to the local database:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_futuristic_mindworm.sql
```

Hosted migrations are applied by Sites during publication. Keep `.openai/hosting.json`, SQL and Drizzle metadata tracked. Do not commit `.wrangler`, `.sites-runtime`, local environment files, uploaded images or production records. No secrets are needed in browser code.

## Important accounting boundaries

Weights are stored in grams; fineness is parts per thousand. Pure grams = gross grams × fineness / 1000. Gold and silver are always reported separately. A batch's unaccounted difference is flagged for review, not automatically declared a physical loss. Metal in work in progress, free inventory and serialized products are separate quantities. A newly received consignment enters work in progress directly and is not also added to free stock. Recovered material remains a reported batch quantity until separately received into inventory.

The current UI handles external consignment intake; split/merge genealogy, rework, issue from existing stock to a batch, commercial settlement and production scheduling remain later work. Early opening tool counters are sample baselines; new tool-use records have explicit batch/operator links.

## Source layout

- `app/erp-app.tsx`: operational interface and forms
- `app/globals.css`: responsive Persian design
- `lib/erp.ts`: typed domain commands, validation, sample records and mass balance
- `app/api/workspace/route.ts`: authenticated state API with optimistic concurrency
- `app/api/photos/`: authenticated photo upload and retrieval
- `db/schema.ts`, `drizzle/`: D1 schema and generated migration
- `tests/erp.test.mjs`: six meaningful workflow tests
- `worker/`, `scripts/`, `vite.config.ts`: supplied hosting/runtime integration

This is version 0.1 for reviewing real factory workflows. It is not ready to replace official production or accounting records.
