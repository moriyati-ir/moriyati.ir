# GitHub Pages ERP preview

This directory is a static review build with sample data and device-local browser storage. It is separate from the private, server-backed ERP. Do not enter real factory data into this public demo.

Source: https://github.com/moriyati-ir/moriyati.ir/tree/moriyati-erp/erp
Source revision: d332ae05fddd490694e2248b8d47bcf4f640a297

To reproduce: check out that source, enter its `erp` directory, install the locked dependencies, then run this directory's `build-preview.mjs` from the ERP project root. It derives a browser-storage adapter from the existing UI and builds the same interface with Vite. Output: `work/github-preview/dist`. The root website workflow copies the committed `dist/erp` directory into the GitHub Pages artifact.

The initial records are marked as samples. Changes persist in `localStorage` only on this browser/origin. Photo upload, staff accounts, accounting and device readers are unavailable in this preview.
