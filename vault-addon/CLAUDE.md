# Vault Links — Project Context

Google Apps Script Editor Add-on for Google Docs. Part of the terra-prime monorepo,
unrelated to `../google-sheets/` (a different, separate Apps Script project).

## Architecture

- No bundler/module system — Apps Script's V8 runtime only supports global function
  declarations in `.gs`/`.js` files under `src/` (clasp's `rootDir`). Files with pure
  logic export via a guarded `if (typeof module !== 'undefined') module.exports = {...}`
  at the bottom, inert under Apps Script, picked up by `node --test` locally.
- Functions ending in `_` (e.g. `listVaultDocs_`) are private — not directly callable
  from client-side `google.script.run`.
- Keep all `DriveApp`/`DocumentApp`/`Docs` (Advanced Service)/`PropertiesService`/
  `CacheService` calls at the edges of each file; keep the actual transformation logic
  (graph building, trigger detection, tag parsing, link-health classification,
  unlinked-mention matching) as plain functions with no Apps Script globals, so they're
  testable in plain Node.
- `Sidebar.html` and `GraphModal.html` are the only two UI views — deliberately no
  shared component/templating layer beyond `Include.gs`'s `include()` helper plus
  `Stylesheet.html` (shared CSS) and `ClientUtil.html` (shared `runServer()` /
  `debounce()` client JS). Don't add a third shared file or a component abstraction
  unless a third view actually gets built.
- `GraphModal.html`'s force-directed graph is hand-rolled (Canvas/SVG), no CDN
  `<script src>` — keep it that way; Apps Script's HtmlService sandbox makes bundling
  the small amount of needed code simpler and safer than vendoring a library.

## Heading anchors

Cross-document heading links use Google Docs' own permalink mechanism: the Advanced
Docs Service exposes a heading's `paragraphStyle.headingId` (same ID Docs' own "Copy
heading link" uses), and a plain external hyperlink of the form
`https://docs.google.com/document/d/{targetDocId}/edit#heading={headingId}` set via
`Text.setLinkUrl()` works without any custom bookmark bookkeeping. Fall back to a
whole-document link only when `headingId` comes back null (a heading created via API
that's never been rendered once in the Docs UI — Google generates the ID lazily).

## Deployment model

Must be a standalone Editor Add-on (`addOns.docs` in the manifest), not a
container-bound script — it needs to inject its menu/sidebar into every Doc the user
opens, since it reads/writes across many docs in a folder, not just its own container.
Early feature development still happens against a container-bound script in a
throwaway Doc for iteration speed; see `README.md`.
