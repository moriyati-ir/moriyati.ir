# Moriyati factory requirements — reconciliation, 16 November 2026

Source: the user's conversation «راهکار آنلاین‌سازی موریاتی», including messages of 14–15 November, and the latest supplied conversation context. These are operational requirements, not chemical operating instructions.

1. Phase one covers the factory: warehouse, laboratory, melting, acid work, mint, packing, kitchen/café, rest/games, changing room, and metalworking. About 20 accounts maximum.
2. Superadmin/CEO may edit users, permissions, data, settings, colours and fonts. Chairman has full operational access but cannot edit ERP configuration. Department access differs. Actual staff authentication must not be confused with a public demo's role simulator.
3. Use phones, tablets and computers, including off-site. Desired access mechanism includes an administrator-issued code for one account with a five-minute expiry, rather than email OTP. This requires server authentication; do not present local codes as secure logins.
4. Record metal, claimed fineness, form (melted, minted/cast bar, granules, tablet, utensils or miscellaneous), description/photo, gross and unpacked gram weights, and company/customer ownership.
5. Conditional consignments are assayed and accepted or returned as a whole. Utensils require preparation/melting/riegeh before assay; record melting difference. Tablets may be cut, melted, assayed and alloyed with copper for requested 990/991/992/993/995 fineness.
6. Operations remain open and parallel: a roughly 3 kg sub-batch can advance while the rest of the consignment remains upstream. Summarise consignment weight/difference only when its entire processing is complete.
7. Silver of identical confirmed fineness may be pooled across owners, preserving each owner's weight share and genealogy. Different fineness cannot be pooled. Conditional acid work remains isolated by owner, batches, vessels, residues and history, even if fineness matches.
8. Track residue and unaccounted material by location/device: granulation, centrifuge bag, polishing, crucible residue, riegeh table, filters and acid-work spills. Register material/residue quantities in grams.
9. Record each operator's role and individual start/end in each batch. Operators confirm their own work. Do not invent a requirement that a person can only supervise one concurrent process.
10. Record consumable acid/powder/solution against the processing job. Permit a consumption that makes stock negative and warn that stock needs correction.
11. Identify ordinary equipment/tools with a steel plate plus RFID ID. Engrave a serial on heat-exposed crucibles; a tag in the hot area would burn.
12. Distinguish ingot crucibles, granulation crucibles and 5 kg melting crucibles. A new tool does not imply that an existing usable tool is retired.
13. Count every actual melting/remelting cycle. Crucible processed weight differs from unique consignment weight and final workshop output; do not equate or double-count them.
14. Track each granulation solution campaign (including 990.0 and 999.9) from installation to replacement. On replacement report the work since the previous change automatically from linked cycles.
15. Retired crucibles/solutions/residues enter a recycling queue. Recovery records retain all source serials and measured recovered metal. For a jointly recovered group, report the measured group yield, not an invented individual split.
16. Record beginning/end of market trips for the chairman/market runner separately from attendance.
17. Product identity links the final product to production, packaging serial, tag ID, and front/back photos. There is no final gold-granule product. Actual reader integration and cryptographic authenticity verification are separate deliverables.

## Verification rule

A feature is present only when its workflow can be exercised, its state changes are saved, and its significant invariants are tested. Public Pages storage is local to the browser. Server identities, staff login, invitation and hardware integrations are not implied by a working frontend.
