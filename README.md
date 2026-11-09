# Selah — Pause. Read. Reflect.

A buildless Bible reader and private SOAP devotion journal. HTML, CSS, ES modules, IndexedDB and a service worker. No backend, account, tracking, runtime dependencies, or external fonts.

## Run in VS Code

1. Open this Selah folder in VS Code.
2. With Live Server installed, right-click index.html → Open with Live Server.
3. Alternatively, with Node installed, run **npm start** and open http://127.0.0.1:4173.
4. Use localhost or 127.0.0.1; opening with file:// does not support module fetches or service workers.

No installation or build is needed to use the application. npm dependencies are development-only tests.

## Deploy to GitHub Pages

Requested repository: https://github.com/robdojo88science/selah

The application is prepared for this repository. The instructions below describe how to publish or update it using GitHub Pages.

1. Upload the project to its main branch, preserving relative paths. Include index.html, css/, js/, data/, assets/, manifest.webmanifest, service-worker.js and .nojekyll.
2. Exclude node_modules/, source-downloads/ and test-results/; .gitignore handles these with Git.
3. In GitHub, open Settings → Pages.
4. Choose Deploy from a branch → main → /(root), then save.
5. After deployment, the expected address is https://robdojo88science.github.io/selah/ (not a claim of current deployment).
6. Friends can use the link independently. Each browser stores its own journal.

All asset paths and service worker scope are relative to the application directory. Hash navigation supports refreshes without a server router. GitHub Pages provides HTTPS for service workers.

## Features

- Local-time greeting, actual daily Scripture, recent devotions and encouragement.
- All 66 Protestant Bible books, 1,189 chapters, reference lookup, previous/next chapters across books, selection, copy, text-size control, remembered position and journal handoff.
- References accept full book names or three-letter IDs, chapters, verse ranges and comma-separated verses. Examples: John 3:16-18; 1 John 2:3; JHN 3:16,18. Cross-chapter ranges and general Scripture text search are not supported.
- SOAP editor: date, title, reference, selected Scripture, reflection, application, prayer, optional gratitude, automatic drafts, manual completion, reading preview, Markdown export and multiple entries per day.
- History: full-content search, exact date filter, sorting, month groups, view, edit and confirmed deletion.
- JSON backup and transactional restore with validation, duplicate skipping and preserved conflicting versions.
- Warm cream/quiet paper themes and installable PWA where supported.

## Storage and privacy

Entries are records in the selah-journal IndexedDB database with stable random IDs, date, content, timestamps and draft status. Saves are acknowledged only after transaction completion. Autosave runs after 500 ms of inactivity; navigation flushes pending edits. Unloading with unpersisted writing triggers the browser's standard warning.

The editor exports current writing as Markdown even when storage fails. A failure message appears instead of a successful save. Navigation away from unsaved writing is blocked; export before closing. Theme, text size and last reading position use lightweight localStorage keys.

Data belongs to a browser profile and origin (protocol, host and port). Switching from localhost to GitHub Pages requires export/import. There is no automatic sync or journal transmission. Shared browser profiles are shared access; data is not encrypted or password protected. Clearing browser data, private browsing, eviction or device loss may remove entries.

### Backup and restore

Open Settings → Export Backup. Save the JSON file securely; it contains readable private text. Export regularly and before clearing browser data.

On another device, open Settings, select the JSON, then Review and restore backup. Read the counts and confirm. Existing entries are never overwritten. Identical content is skipped, including repeat imports of conflict copies. Changed entries with matching IDs receive new IDs. Entire files are validated before an atomic import. Malformed fields/dates/timestamps, duplicate IDs within a file and files over 100 MB are rejected.

## Offline and updates

An online visit caches the app shell. Go to Settings → Download / verify offline Bible to cache all 66 bundled books. Wait for the all-66-ready status before relying on complete offline reading. Books opened online also cache individually.

Use Install Selah, the browser's install menu or Add to Home Screen. Availability varies by browser. First use needs an HTTP connection to local serving or hosting. Cache eviction may require redownloading. Backups remain essential.

Updates wait until old tabs close; no forced reload interrupts writing. IndexedDB is never deleted. For future releases, bump the shell cache version in service-worker.js when static assets change and the Bible cache version when its dataset changes. Old Bible caches are retained intentionally. Close all tabs and reopen to activate an update.

## Bible provenance and import process

Translation: World English Bible, Protestant Edition, 66 books.
Source ZIP: https://ebible.org/Scriptures/engwebp_usfm.zip
Edition: https://ebible.org/engwebp/
Public-domain notice: https://ebible.org/engwebp/copyright.htm

The publisher permits redistribution. World English Bible is eBible.org's trademark. No Scripture was generated or paraphrased.

data/bible/provenance.json records archive SHA-256 and download date. Conversion preserves verse text, numbering and footnotes; strips USFM formatting, Strong's annotations, headings and cross-reference metadata. Footnotes appear in smaller text. Verses containing only text-critical notes retain empty main text and the source note. Poetry displays verse by verse without original indentation.

To rebuild:
1. Download the ZIP above into source-downloads/engwebp_usfm.zip (internet permission needed).
2. Extract into source-downloads/usfm/ without changing its contents.
3. Run **npm run import-bible**.
4. Run tests, review differences and update cache versions before shipping.

The corpus has 66 books, 1,189 chapters and 31,103 numbered records, including footnote-only verses. Tests verify structure, ordering, clean text and known passages. This is deterministic conversion from the publisher source, not independent manuscript verification.

## Tests and functional checklist

**npm test** runs built-in Node tests without downloads.
**npm run test:browser** runs Playwright against installed Microsoft Edge.
If dependencies are missing, **npm ci** downloads test tools; obtain permission first.

Browser tests start and stop their own loopback server on port 4173, using isolated profiles. They do not touch your normal browser journal. Screenshots are generated in test-results/.

Manual checks:
- [ ] Refresh all sections at the deployed HTTPS repository subpath.
- [ ] Select and copy several verses and send them to a devotion.
- [ ] Save, reload, edit, preview and export a journal entry.
- [ ] Restore a backup twice; confirm duplicates are skipped and changes preserved.
- [ ] Cancel a deletion, then confirm another deletion.
- [ ] Download all books; go offline, reopen, read another book and save a prayer.
- [ ] Test keyboard access, screen reader labels, mobile zoom, rotation and installation on actual devices.

See TESTING.md for actual verification results. Viewport checks do not replace physical-device testing. iOS Safari, Android Chrome, screen readers and live GitHub deployment require their own manual checks.

## Complete folder structure

    Selah/
      .gitignore
      .nojekyll
      README.md
      TESTING.md
      selah.txt
      index.html
      manifest.webmanifest
      service-worker.js
      package.json
      package-lock.json
      playwright.config.js
      css/style.css
      js/
        app.js
        bible.js
        core.js
        devotions.js
        settings.js
        storage.js
        ui.js
      data/bible/
        catalog.json
        provenance.json
        GEN.json ... REV.json (66 individual book files)
      assets/icons/
        icon.svg
        icon-192.png
        icon-512.png
        icon-maskable.png
      scripts/
        import-bible.mjs
        serve.mjs
      tests/
        core.test.mjs
        browser/app.spec.js
      source-downloads/ (local only, ignored)
        repository.json
        engwebp_usfm.zip
        usfm/ (publisher originals)
      node_modules/ (development only, ignored)
      test-results/ (generated, ignored)

## Limits

No cloud sync, login, encryption, automatic remote backup or reminders. Clipboard and install behavior depends on browser permissions. Avoid editing an entry simultaneously in multiple tabs; the latest write wins. Export files for long-term preservation rather than relying only on browser storage.

