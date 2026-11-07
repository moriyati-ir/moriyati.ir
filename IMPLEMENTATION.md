# Moriyati site update

The site remains a buildless static project served from dist/. Existing collection hash routes and specification framing are retained. Contact details are centralised in contact.html; other pages link there. All pages support fa/en, carrying the language through links and local storage.

## Content and assets

- collections-data.js contains the complete approved Persian narratives and English translations.
- assets/collections/media-manifest.json records the approved source references. collection-media.js is the browser-facing gallery data. Each collection has five views. Bespoke views demonstrate the shared Celestial packaging technology, as their captions state.
- The selected Celestial line-nebula card geometry, 1 g bar and radial CD reverse remain the masters. Original artwork is retained under reference-assets/.
- Hero entrance builds the coin relief in layers, brings in the carriage and crossfades to the exact original completed inner relief. Its ring rotates separately. Four SVG process drawings replace the former repeated coin.
- Contact geography uses real OSM roads and building footprints around Elahiyeh, with the mall coordinate cross-checked against the mall's published directions. Roof heights are artistic. Sources and attribution accompany the asset.

## Authenticity registry boundary

The camera scanner uses native BarcodeDetector when available and a vendored jsQR fallback. Camera frames stay on the device. Permissions are requested only when the visitor presses the camera button; tracks stop on close, backgrounding or navigation. HTTPS is required for camera access.

Only a prototype sample serial was supplied: AA0002008. auth-records.js therefore explicitly identifies the registry and its record as demonstration data. Unknown serials show lookup unavailable, never counterfeit. A QR URL is not proof of authenticity. The sample is never presented as authentication of a physical item.

A production release of genuine/counterfeit lookup requires an authoritative production serial registry and a server-side verification service. Do not change the demonstration result into a genuine-product result by changing a client-side flag. Connect a trusted verification service, return only public product fields, and retain the physical packaging checks.

## Verification

Run `node --test tests/*.test.mjs`. These checks cover dependency integrity, five-shot collection media, contact isolation, serial parsing, real QR decoding and self-contained HTML exports. Browser QA covers desktop and 390 px layouts, galleries, fa/en, process steps, map controls and scanner fallback. Live camera capture still depends on an actual camera and permission.

## Revision 7

The entry uses a genuine circular annulus with a fixed centre in every rotation. Complete registered pavilion reconstructions replace the earlier window/foliage subtraction masks. The original carriage gait is preserved. A faint round-field lion fades out on the first scroll.

Heritage adds the expressly corrected maternal family history and Ostad Javad Pourhang above Haj Hasan. The rest of the approved narrative stays exact. Connected Persian title lettering reveals right-to-left, followed by the subtitle; reduced motion shows both immediately.

Contact uses matching call/WhatsApp/Telegram controls on the physical left, smaller regular numbers, uniform addresses and a retailer directory. Collection galleries share the retailer entry. Eight locations are supplied: the known Elahiyeh centre plus seven explicitly labelled design samples with non-dialable phone placeholders and approximate city-centre pins. Geolocation runs only after the visitor's button press, stays in memory and ranks straight-line distance. Manual city selection works without permission.

The Persian navigation title is خبرنامه. Two complete dated archive issues are available at11:00/23:00 Tehran time, each with global/Iran coverage and public sources. No automation or live-price feed is connected. Six official reference marks occupy equal grid cells, including Tehran Chamber. Footer display lettering uses the exact paper colour with a shallow emboss.

Run `python3 -B scripts/revision-v7.py` for shared/content regeneration, then the two export scripts. Browser QA covers320/390portrait,844×390landscape, desktop, both languages, the tree, circular stages, gallery thumbnail wrapping, nested retailer dialog, manual city selection and both newsletter editions. Twelve automated checks additionally cover location refusal, ranking and preservation of the approved text.

## Final owner corrections

The homepage square product image remains a direct child of `.portal-art`, matching the original layout and its image rules. A separately positioned accessible link makes it clickable without changing image geometry or clipping. Do not wrap this image in a grid child or apply circular clipping to its packaging.

Foliage reveals in three spatially scattered groups during the original .33–.45 scroll phase. The trees parent must have inline opacity 1: the shared `.coin-relief-layer` rule otherwise hides every animated child. The original ground phase (.47–.55), carriage arrival (.57–.79), gait and final crossfade (.81–.87) remain intact. A regression test exercises the actual draw function across these phases.

The original Isfahan painting is reused on both pages. Eleven feathered canopy regions have independent sway and bounded displacement, while the base city remains fixed. Animation pauses outside the viewport and respects the site's motion toggle. No window, new scene or decorative frame is added.

The capabilities introduction uses one regular font style and a small paragraph break in both languages. The company is presented as Future Residency Solutions LLC, a Mehraban Enterprises subsidiary responsible for real estate, construction, property development and building materials. The headquarters address is Iran, Tehran, Shemiranat, Elahiyeh.

Final browser QA covers 320/390 px and desktop layouts, both languages, the restored product click target, foliage before carriage, wind on both pages and reduced motion. Portable homepage and capabilities exports are regenerated before publication.

## Country navigation and jar removal

The family heading uses a smaller title, fine rules around its English label and a centred stem branching into the two family names. The connectors share the genealogy's width and column gap, including on mobile.

Country tabs follow Oman, UAE, Tanzania, China, Switzerland, Canada, United States. Seven equal grid cells put each flag above its country name and fit the full row on a phone. The selected panel, map marker, pagination and keyboard navigation use the DOM order. Cities belong only in the country descriptions: Muscat, Dubai, Dar es Salaam, Shenzhen, Geneva, Toronto and Delaware (a state).

The interactive granule jar is removed entirely, including its script, sensor permission, drag simulation, controls, instructions and styles. The granule production heading and description remain in a compact text layout; the existing refining process illustration is unaffected. `scripts/editorial-v12.py` reapplies the content/order/removal corrections after any earlier content generation. The revision 8 generator no longer inserts the jar.

## Approved two-sided homepage coin

The user-supplied silver lion coin is now the homepage obverse. Its JPEG is retained byte for byte. An inline SVG registers the photographed outline onto the reverse's exact 1254-unit viewBox, 627/627 centre and 610-unit radius. The original faint lion layer is removed from the architectural reverse.

`coin-flip.js` and `coin-flip.css` add two backface-hidden faces and a thin, segmented metal edge. The existing homepage frame drives the 180-degree turn; the front is explicitly hidden after it turns away. No extra animation loop, sensor, drag handler or scroll interception is introduced. The original position/zoom remains in `app.js`.

The flip occupies the first .012–.19 of entrance progress. Only after the complete turn is the remaining scroll mapped onto the original reverse construction: pavilion, windows, three spatially scattered foliage groups, ground, carriage and final registered artwork. The carriage rig, tree memberships and reverse phase boundaries remain unchanged. Reverse scrolling restores the front. Reduced-motion mode shows the approved front as a static image.

Regenerate the homepage portable export after changes. Run `node --test tests/*.test.mjs`; the coin checks cover artwork identity, common circular registration, waiting through the flip, foliage before carriage, and reversible scroll mapping.

## Continuous reeded edge and matched silver

The latest owner-supplied bright silver front is retained byte for byte under `assets/motion/v14/`. The architectural reverse keeps all original geometry, images, registration and construction timing. A native SVG luminance curve removes its previous beige cast and matches the new front's neutral warm silver highlights, midtones and shadows.

Both faces have the same 192-reed shoulder around the original 610-unit circular boundary. The sidewall has 96 tangent panels with two grooves each, aligned to those shoulders. Its thickness uses a 2.4/40 visual ratio (2.4 mm against a 40 mm reference diameter), rather than fixed screen pixels. This is a display model, not a new product specification. A ResizeObserver updates the local thickness on resize; existing parent transforms scale the entire coin together during scroll. The shoulders use two compound paths per face to keep the added SVG node count small.

The flip phase, scattered foliage groups, carriage gait, homepage position and zoom remain unchanged. Checks cover reeding on both sides, common registration, scalable thickness, source-image identity and the existing reverse sequence.

## Scroll rendering and ambient light

The homepage now samples native scroll once per animation frame, without the previous trailing interpolation loop. Vertical coin travel uses the same room-relative distance in a transform, rather than changing `top` on every frame. Entrance and capability ranges use their pinned sections' stable heights, avoiding progress changes when mobile browser chrome resizes the visible viewport.

The exact existing annulus is serialized into a self-contained SVG image and rotated as a separate cached HTML image layer. The reverse SVG omits that annulus. Its live whole-scene SVG colour filter and animated layer blurs are removed; fixed compositor colour adjustments and a shared warm directional overlay integrate both faces with the room. The outer scaling element uses automatic layer allocation so the engraving stays sharp when enlarged. A cached shadow replaces the filtered 3D subtree and follows the projected width during the turn; side panels are hidden at the two face-on endpoints. Reeding, the 2.4/40 thickness ratio, flip phase, architecture, three scattered foliage groups and carriage gait retain their existing geometry and timing.

Relief nodes and paths are cached. Opacity, pose and phase attributes update only when their values change. Completed coin scenes receive no additional mutations while later chapters scroll; inactive production diagrams also stop receiving path updates. The homepage's almost opaque header no longer samples a blurred backdrop during scroll.

In a controlled browser comparison over 240 `MoriMotion.draw` samples, attribute mutations inside the coin fell from 4,560 to zero for a held completed scene, and from 5,372 to 1,211 over the entrance sweep (about 77.5% fewer). This measures DOM work, not end-device frame rate. The cloud browser's frame scheduling was inconsistent, so its observed FPS is not used as a performance claim. Physical-phone FPS remains unverified. Browser checks cover the 320/390 layouts, both faces, edge, original foliage-before-carriage order and room lighting. Temporary profiling pages are removed before publication.

## ISFAHAN inscription correction

The owner corrected the coin inscription to `ISFAHAN`. Built-in image editing replaced the initial E in `ESFAHAN` with I while preserving the square 1254 × 1254 registration, lion, remaining inscriptions and silver finish. The result is encoded as a 447 KiB WebP under `assets/motion/v16/`, smaller than the earlier 661 KiB JPEG. Both the initial fallback image and the animated front use this asset. The previous original remains archived; no geometry, lighting, layout or animation code changed in this revision.

## Cached coin rendering (revision 17)

The original reverse artwork, masks and v16 material adjustments are baked into 30 tightly cropped transparent sprites in one 2368 × 2368 WebP atlas. `scripts/bake-coin-atlas.html` and its companion script reproduce this through native browser SVG/canvas rendering; `assets/motion/v17/atlas.json` records the crops and registration. The corrected ISFAHAN front remains byte-for-byte unchanged.

`coin-renderer.js` draws the reverse and cylindrical edge into two canvas surfaces, driven by the existing homepage scroll frame. The reverse retains the exact pavilion, windows, three scattered foliage groups, ground, articulated carriage and final-art phases. The ring rotates within the same annulus. The edge projects the same 2.4/40 thickness ratio and 192 reeds, with the existing shoulder on each face. No extra animation loop or scroll handler is added. Resolution is bounded for mobile memory use; completed scenes do not repaint during later chapters. Canvas-unavailable and atlas-load-error paths restore the original SVG implementation.

Style writes are deduplicated. Mobile browser-toolbar height changes no longer trigger a full scene measurement unless the actual pinned section size changes; real width/orientation changes retain the existing progress behavior. Capabilities drawing animation pauses offscreen, and homepage rendering pauses while the page is hidden or a modal is open.

The active mobile-view comparison reduced live coin elements from 321 to 40, mask/clip definitions from 35 to one static clip, and edge panels from 96 to zero. A seven-second forward/back scroll in foreground Chrome at a 390 px viewport produced 420 frame samples with 16.7 ms median and p95 intervals, no intervals above 50 ms and no long tasks. The v16 comparison had 412 samples, a 16.8 ms p95 and one interval above 50 ms. These are desktop-browser measurements at a mobile viewport, not physical iPhone/WebKit results.

Automated checks cover atlas bounds and size, exact staged reveal order, articulated gait, completed-scene draw caching, cylindrical projection, retina-resolution bounds and SVG recovery on atlas failure, alongside the existing regression suite. Browser QA compares both renderers at 320/390 px, front/turn/edge/carriage/completed poses, menu and collection interactions, and visible capabilities animation. Temporary comparison and baking routes are removed before packaging; the portable homepage export is regenerated.
