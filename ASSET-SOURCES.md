# Expertise revision assets

- `dist/assets/moriyati-goldbar-front.png`: transparent cutout edit of the user-supplied front design `5721155D-D6F6-40D6-B762-776457CC562B.jpeg`, using built-in image generation. The exact lion front, 1 G and 995.0 specification are retained. The reverse is a native CSS radial diffraction material based on the supplied holographic technical reference; it has no fish-scale pattern.
- `dist/assets/authorities/tehran-gold-union.png`: https://www.estjt.ir/wp-content/themes/newstheme/assets/img/logo.png — official union website.
- `dist/assets/authorities/ntsw.png`: official application publisher listing, https://cafebazaar.ir/app/ir.ntsw , image https://s.cafebazaar.ir/images/icons/ir.ntsw_512x512.png?x-img=v1%2Fresize%2Ch_256%2Cw_256%2Clossless_false%2Foptimize .
- `dist/assets/authorities/inso.jpg`: INSO / Standardvanak, https://commons.wikimedia.org/wiki/File:Iran_National_Standards_Organization_logo.jpg . Original bytes retained. Source and license details are recorded on that page; structured metadata identifies CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/ .
- `dist/assets/authorities/mimt.svg`: national government emblem extracted as vector geometry from the Ministry flag source by SpinnerLaserz, https://commons.wikimedia.org/wiki/File:Flag_of_the_Ministry_of_Industry,_Mine_and_Trade_(Iran).svg . Original retained at `reference-assets/mimt-flag-source.svg`. The flag field is excluded; the emblem uses a neutral presentation color.
- ISO is identified as the standards body, not an issuing certification body. The illustrative prototype assumption remains visible. ISO usage source: https://www.iso.org/iso-name-and-logo.html .

Institution marks retain their owners' identities. These reference marks do not replace actual certificate documents.

## Revision 7

- `assets/authorities/tehran-chamber.svg` presents the exact official Tehran Chamber alpha mark in the site's neutral ink; original bytes at `tehran-chamber.png`. Source: https://www.tccim.ir/images/logo.png . Provenance is retained in `tehran-chamber-source.json`. No membership claim is inferred from the mark.
- `assets/motion/v7/` contains full, aligned generative reconstructions of the approved pavilion: continuous solid-panel facade, detailed facade without foliage, and complete foliage scene without carriage. The subtle standalone lion uses the user-supplied Moriyati head reference. Prompts and registration are in `asset-notes.json`.
- The circular annulus is native SVG, inlined in `coin-geometry.js` to preserve paint and mask registration while rotating. Centre627,627; outer radius610; inner radius468. Raster scene stages and original carriage share the same uniform translation1,-8.
- `content/newsletter-2026-11-05.json` stores the public-source-backed, bilingual archived morning/evening editions. Source links are visible in each issue; publication remains manual.

## November refinements

- `assets/v8/annulus-engraved.svg`: native circular guilloche reconstruction with recessed channels and offset bevel lighting. The registered centre and radii remain 627,627 / 610 / 468. Source curves and geometric provenance are retained beside the asset.
- `assets/v8/future-residency-sketch.webp`: generated architectural study inspired by the Royal Opera House Muscat's colonnades and pale stone. The facade reads “Future Residency Solutions”. Prompt and official architectural references are retained in its adjacent text file.
- `assets/v8/newsletter-morning.webp` and `newsletter-evening.webp`: generated editorial still lifes. All issue dates and times are live HTML text, not baked into the imagery. Archived report content derives from the owner's November 5 email editions; public source URLs remain attached to each item.
- `assets/v8/argentum-cast-detail.webp`: generated detail using the approved cast-silver range as reference, with 250 g / 500 g / 1 kg and 999.9 markings. Prompt is retained beside the image.
- WhatsApp and Telegram paths: unmodified Simple Icons brand vectors, downloaded from https://github.com/simple-icons/simple-icons/tree/develop/icons . Marks retain their original identities in the site's muted bronze.
- Country flags: local SVGs from https://flagcdn.com/ for AE, OM, US, CA, TZ, CN and CH. The original colors, proportions and emblems are retained.
- Transparent jar and granular motion are native canvas geometry and physics; no external sensor service, telemetry or stored location is used.

# Homepage coin front, revision 13

`dist/assets/motion/v13/moriyati-lion-front.jpeg` is the user's approved uploaded silver lion coin, used without regenerating its artwork or lettering. Original upload: `DCFDBC06-310A-470E-96B7-ECC614E09025.jpeg`. SHA-256: `2bf90aa1ae11244e1bd54d27ceb7997d04cf5450cbf9cb7ceb82b1df90ead026`. Native inline SVG provides circular clipping and shared registration with the existing architectural reverse.

## Homepage coin finish, revision 14

`dist/assets/motion/v14/moriyati-lion-front.jpeg` is the latest owner-uploaded bright silver reference, `7FDE26F3-F673-4007-9E5C-37F5D78E1B09.jpeg`, retained without raster edits. SHA-256: `46492742674183a96aa05beab70b12ca464e0f583b66f30dacd67736092d20c4`. Both reeded shoulders and the proportional sidewall are native geometry. A native SVG colour curve harmonises the existing reverse with this front; no relief artwork is regenerated.
