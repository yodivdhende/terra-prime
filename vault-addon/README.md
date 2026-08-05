# Vault Links

Google Docs Editor Add-on that mimics a subset of Obsidian's note-linking workflow,
scoped to one configured Google Drive folder ("vault") and its subfolders: a sidebar
for browsing/linking vault docs, a node graph of how they link to each other (plus a
lightweight `#tag` system), `[[`-triggered header-link suggestions, unlinked-mention
detection, and a broken-link health check.

Tracked as [TP-0182](https://github.com/yodivdhende/terra-prime/issues/182) and its subtasks.

---

## Why this exists, and what it can't do

Google Docs add-ons cannot hook into keystrokes or render floating popups inside the
actual document canvas — it's a closed rendering surface with no DOM/keyboard access
for add-ons. So unlike Obsidian, there's no true "popup at your cursor on hotkey."
Instead, the sidebar polls your cursor position (~1x/sec), detects an unclosed `[[`
immediately before it, and shows live-filtered header suggestions **in the sidebar**;
picking one inserts the link at your cursor.

---

## Prerequisites

- A Google account with access to Google Drive/Docs
- [`clasp`](https://github.com/google/clasp) (`npm install -g @google/clasp`)
- `clasp login` (opens a browser OAuth flow — not available in a sandboxed CI/agent
  environment, must be run on a machine with browser access)

---

## Setup

1. `clasp login`
2. From `vault-addon/`, either:
   - `clasp create --type standalone --title "Vault Links"` (creates a new Apps
     Script project and writes a fresh `.clasp.json` — copy its `scriptId` into
     the committed `.clasp.json`, keeping `rootDir: "src"`), or
   - if a script project already exists, replace `REPLACE_WITH_YOUR_APPS_SCRIPT_ID`
     in `.clasp.json` with its script ID.
3. `clasp push`
4. Open any Google Doc → `Extensions` → the Apps Script project → confirm it opens,
   then reload the Doc and confirm the **Vault Links** menu appears.

## Development

```sh
# from vault-addon/
clasp push     # push local src/ to the Apps Script backend
clasp pull     # pull remote changes back down
clasp open     # open the project in the Apps Script web editor
```

Early development (through the vault-index/link-graph/heading features) happens
against a **container-bound** script in a throwaway test Doc for fast iteration —
`Extensions > Apps Script` from that Doc gives instant "Run" access without the
install-flow friction of a real add-on deployment. The project migrates to a real
standalone Editor Add-on deployment later (TP-0182.11), once the core logic is proven.

## Testing

Pure logic (link-graph construction, `[[` trigger detection, tag parsing, broken-link
classification, unlinked-mention matching) lives in plain functions with no Apps
Script globals, each exported at the bottom of its `.gs` file behind a guard that's
inert under Apps Script's V8 runtime:

```js
if (typeof module !== 'undefined') module.exports = { ... };
```

Run with:

```sh
cd vault-addon
node --test
```

## Manual QA checklist

To be filled in as features land (TP-0182.02 onward); see the parent issue for the
full list of scenarios each subtask should be verified against. At minimum, before
calling TP-0182.11 done, re-run all of the following against a real installed add-on:

- [ ] Add-on installs for your own account; **Vault Links** menu appears in
      `Extensions` on an arbitrary real Doc
- [ ] First-run vault-folder setup persists across sidebar reopens and across docs
- [ ] Nested test-vault (root/sub1/sub2) with mixed file types indexes only the
      in-vault Google Docs, recursively
- [ ] Cross-linking two vault docs populates both the backlinks and outbound panels
- [ ] A heading-anchored link actually scrolls to the right heading on click
- [ ] Tagging docs with `#tag` groups them correctly in the tag browser and graph
- [ ] "Check links" correctly flags a link whose target doc was removed from the
      vault, and one whose target heading was deleted
- [ ] A plain-text mention of another doc's title surfaces under unlinked mentions,
      and disappears once linked
- [ ] Typing `[[` plus partial heading text shows suggestions within ~1s; selecting
      one inserts the correct link; `]]` before selecting hides suggestions
- [ ] Graph modal shows zero external network requests (devtools Network tab) and
      stays responsive on a ~20-30 doc vault
