# Verification — 2026-11-09

Completed against the actual project files using Node.js v26.13.0 and headless Microsoft Edge through Playwright.

## Results

- npm test: **6 passed, 0 failed**.
- npx playwright test: **10 passed, 0 failed**.
- Bible: **66 books, 1,189 chapters, 31,103 numbered records** validated.
- Desktop (1440px) and mobile (375px) screenshots reviewed.
- No horizontal overflow in Home, Bible, editor, history or settings at **320, 375, 390, 768, 1024, 1440, 1920px**.

## Functional coverage

1. Create, save, reload, edit, preview and export; preserve multiline reflections.
2. Multiple devotions on one date, history content search and filter reset.
3. Cancel and confirm deletion.
4. Bible reference lookup, selected Scripture handoff and remembered reading position.
5. Restore changed entry as separate copy; repeat import skips duplicate content.
6. Malformed backup rejection, valid dates and field types, duplicate-ID rejection.
7. Display imported markup as text without creating scriptable elements.
8. Draft autosave survives refresh.
9. Simulated write quota failure reports not saved, preserves text, blocks unsafe navigation and permits Markdown export.
10. Browser storage unavailable: explicit notice and export still works.
11. Cache all 66 books; disconnect; reload journal, edit/save prayer, open Revelation offline.
12. GitHub Pages-style /selah/ asset paths and offline refresh.
13. Keyboard focus and responsive overflow checks.
14. Corpus order, numbering, known text, footnote-only verses, source files, manifest icons and safe rendering conventions.

## Issues found and resolved during tests

- Source verses with only text-critical notes required preserving notes without inventing main text.
- USFM closing-marker whitespace initially joined adjacent words; conversion now preserves that whitespace.
- Offline hash navigation needed an explicit cached app-shell response.
- Bible catalog fetches now fall back to the app-shell cache offline.
- Selected comma-separated verses can be reopened by the reference parser.

## Reproduce

Run npm test, then npm run test:browser. Existing Microsoft Edge is used; no separate browser download is needed. If development dependencies are missing, npm ci requires an external download.

Browser tests run their own loopback server and close it afterward. Contexts are isolated from your everyday browser profile. Generated screenshots appear in test-results/selah-desktop.png and test-results/selah-mobile.png.

## Not verified

The initial release was deployed and verified at https://robdojo88science.github.io/selah/, including save/reload, Scripture selection, full offline Bible access and 320px layout. Physical iPhones, Android devices, iPad Safari, screen readers, OS installation prompts and long-term browser cache eviction were not tested. Browser viewport testing is not equivalent to testing actual devices. Multi-tab concurrent editing uses latest-write behavior; avoid editing the same entry in multiple tabs.

All runtime assets are local. Complete offline Bible reading requires Settings → Download / verify offline Bible to finish successfully. Private entries have no cloud sync or encryption. Export backups regularly.


## Glass interface release

The redesigned interface includes midnight/daylight glass themes, a custom SVG mark with matching PNG install icons, floating mobile navigation, local line icons, and calmer reading/editor surfaces. All 6 data tests and 10 browser tests passed after implementation.

Additional checks cover theme persistence and text colors, long unbroken titles/references at 320px, save-control hit testing, dock clearance for notices and Bible actions, and 44px minimum navigation touch targets. Both themes support reduced motion, an opaque fallback for browsers without blur, and reduced transparency where the browser supports that preference.

The shell cache is now v2; Bible cache and journal storage are preserved. Existing installations receive an update notice and activate the new shell after all old Selah tabs close.
