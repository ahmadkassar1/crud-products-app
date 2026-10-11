# Product Manager

A small product-management app built with HTML, CSS and vanilla JavaScript. Create and edit products, calculate unit totals, search by title or category, and save records in the current browser.

[Try the live demo](https://crud-products-app-eta.vercel.app/)

## Run locally

Use Node.js 24 (also specified in `.nvmrc`). There are no third-party runtime or development dependencies, so no install step is required.

```sh
npm run dev
```

Open [localhost:3400](http://127.0.0.1:3400). The development server binds to loopback and serves only application files. Use an HTTP server rather than opening `index.html` directly: the app uses native ES modules.

Optional port override:

```sh
# macOS / Linux
PORT=3401 npm run dev

# PowerShell
$env:PORT = "3401"
npm run dev
```

## Use the app

1. Enter a title, price and category. Taxes, advertising and discount are optional.
2. Choose a whole-number quantity from 1 to 99. Each item receives its own stable ID.
3. Create products, search the list, or edit a single record.
4. Deletion requires confirmation. Undo restores the last deletion until another successful change, a cross-tab update, or a page refresh.
5. On narrow screens, scroll the table inside its labelled container. It also accepts keyboard arrow keys.

Amounts are stored as integer cents, displayed to two decimal places and capped at 9,999,999.99 per field. No currency is assumed. A discount cannot make the total negative. Titles and categories are rendered as text, including characters that resemble HTML.

## Structure

```text
index.html             Accessible form, table, feedback and confirmation dialog
css/styles.css         Responsive layout, focus states and reduced-motion support
js/main.js             Events, edit state, confirmation and undo
js/products.js         Validation, calculations, stable-ID updates and search
js/storage.js          Versioned persistence and legacy migration
js/ui.js               Safe DOM rendering and associated field errors
scripts/serve.js       Dependency-free local HTTP server
scripts/build.js       Static deployment artifact
tests/products.test.js Product and storage regressions
.github/workflows/     Read-only CI checks
```

## Verify and build

```sh
npm run check
npm test
npm run build
```

`check` performs JavaScript syntax checks; it is not a full lint or accessibility audit. The Node test suite covers invalid input, decimal math, independent IDs, editing after deletion, search, legacy migration, unrelated storage keys, malformed data and denied/quota-limited storage.

`build` recreates only this project's `dist/` directory and copies the static application files. Host that directory on a static hosting service; no server, environment variables or backend are needed. `vercel.json` selects the Other framework preset, `npm run build` and `dist` output; Node 24 is specified in `package.json`. Vercel deploys the linked repository's main branch. CI runs syntax checks, tests and build on pull requests and pushes to main.

## Browser storage and recovery

Records use the `products_data` localStorage key. Only that key is written, including when all products are deleted; unrelated keys remain untouched.

Valid older array records are validated and assigned IDs in memory. The first successful change saves version 1 data. Stored totals are recalculated from prices and charges. Reading does not rewrite the original data.

Malformed or invalid saved data, unknown schema versions, or unavailable storage do not crash startup. Saving is paused rather than overwriting unreadable records. When the original text is readable, **Download saved data for recovery** exports it unchanged. Keep that copy and repair the data before restoring it; the app does not automatically discard invalid records.

A failed write keeps the displayed products and form entries unchanged and explains the problem. Changes from another tab refresh the list, cancel an active edit and invalidate Undo. Simultaneous writes still use localStorage's last-writer-wins behavior; this is not a multi-user inventory system.

Products are specific to the browser and origin. Moving to a different deployment URL, switching browser, or clearing site data can make them unavailable. There is no account, server sync or cloud backup.

## Verification scope

The repair was checked locally on 11 October 2026: create/edit/search, input errors, literal HTML-like text, deletion cancellation/undo, reload, cross-tab changes and stable IDs. Page bounds were checked at 320, 375, 768 and 1440 pixels; the table scrolls internally on narrow viewports. Earlier invalid test data displayed the recovery warning and could be exported.

The production demo was checked on 11 October 2026 for validation, decimal totals, Enter-key creation, editing through another row's deletion, cancellation, undo, reload persistence, category search and literal HTML-like text. Page bounds passed at 320, 375, 768 and 1440 pixels; narrow tables scroll within their container. No browser console errors were captured during these checks.

Storage-denial, quota-failure, malformed JSON and legacy migration have automated tests. Physical devices and full screen-reader workflows have not yet been verified. No license has been added; existing repository licensing remains unchanged.
