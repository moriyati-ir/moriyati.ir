# Moriyati — Mint & Treasury

A buildless Persian-first website based on the approved walnut treasury rendering.

## Source

- `dist/index.html`: semantic page structure, fixed header, narrative chapters and native dialogs.
- `dist/styles.css`: typography, responsive layout, layered architecture, hover details and reduced-motion styling.
- `dist/app.js`: native-scroll animation, capability stages, language switching, accessible collection views and motion preference.
- `dist/assets`: local artwork and locally hosted open-source fonts.

The homepage contains no product listings. The collection index and individual specifications have separate hash routes (`#/works/celestial`, etc.). Contact content uses the supplied location, Tehran, Iran; no contact details or precise address were invented.

## Portable HTML

Run `python3 scripts/package-html.py` to regenerate `exports/Moriyati.html`. This is a standalone file containing the images, fonts, CSS and JavaScript and can be opened directly without an installation or network connection. The footer download points to this file.

## Motion

Scrolling remains native. A requestAnimationFrame loop interpolates layer transforms only when needed. The entrance brings the silver relief into focus, the capability chapter progresses through four production stages, and the heritage chapter has restrained typography parallax. The footer motion button and the operating system's reduced-motion preference provide a calmer layout.

## Preview

The static root is `dist`. No package installation or framework build is required.

## Expertise prototype

`dist/expertise.html` is the approved Persian expertise page, linked from the homepage navigation. It retains the cream stone, walnut and silver palette and adds a conceptual silver campaign image, scroll-driven particle morphs, an animated engineering illustration, advanced-material studies, expandable credentials, and a keyboard-accessible seven-country atlas. The international structure remains legally separate from the Iranian company.

The credentials are prototype assumptions, as explicitly requested, and the page explicitly labels this context. The document title and footer also identify the design as a prototype. Do not present the certificate inventory as independently verified. Preserve the Site's existing audience. Contact details use the four approved `0990 45 000 56–59` lines and Saturday–Wednesday hours.

`dist/expertise.css` and `dist/expertise.js` implement the responsive page with native scrolling, a motion preference, mobile navigation, native disclosure controls, and a reduced-motion reading layout. No framework or external runtime dependencies are required.

Run `python3 scripts/package-expertise.py` to generate `exports/Moriyati-Expertise.html` with embedded images and fonts. Other-page navigation in this portable edition links to the existing live homepage; all expertise interactions run within the file.

The silver still-life in `dist/assets/expertise-silver.png` is a generated conceptual studio image, not a photograph of a company facility or product. Its brief was a brushed silver ribbon with granules and powder, on cream limestone beside walnut, with warm architectural light and no branding or text.

## Expertise motion revision

The production study now renders dimensional silver and gold granules with reflective sprite shading and sparse specular highlights. Granules resolve into the user-supplied 1 g, 995.0 Moriyati bar, with a keyboard-accessible front/reverse control and scroll-driven turning. The reverse is a continuous radial diffraction material inspired by a CD, with no fish-scale pattern.

The engineering drawing is built from sequential strokes with live pen tracking, timed drafting phases, an automatic in-view cycle and a replay button. Reduced-motion mode shows the complete drawing and all production copy without running the animation.

International contact numbers retain their original tel targets and use tabular sans-serif digits in the exact `+98 990 45 000 56–59` format. Four sourced institution marks plus the ISO reference mark replace the decorative Moriyati seal. Sources are recorded in `ASSET-SOURCES.md`. Approved paragraph copy is unchanged.

## Publishing size

Standalone HTML exports live under `exports/`, outside the hosted static directory. Hosted download links use `dist/download-html.js` to assemble the current page, local fonts, images, scripts and attribution into the same single-file format when requested. This avoids shipping duplicate embedded-image copies in the deployment archive. Portable files include the same helper and can download themselves without a network connection.


## GitHub import

This repository contains the complete source and assets of the published Moriyati version 17, imported on 2026-11-07. The original page code, copy, images, fonts and motion assets are preserved. The source revision is `830a89c567e8722a39d24967601b89c120a1f018`.

### Run locally

From this repository, run `python3 -m http.server 8080 --directory dist` and open `http://localhost:8080/?lang=fa`.

### Validate

Use Node.js 22 or later and Python 3. No npm dependencies are required. Generate the portable downloads before running the existing tests:

```sh
python3 scripts/package-html.py
python3 scripts/package-expertise.py
node --test tests/*.test.mjs
```

### Publish with GitHub Pages

The included `.github/workflows/pages.yml` validates the site and publishes `dist/` after pushes to `main`. GitHub Pages must use **GitHub Actions** as its publishing source in the repository's Settings > Pages.

The import does not change domain DNS or the existing hosted Site. Sample authenticity and dealer records remain demonstration data, as labeled in the original site.
