---
id: TP-0004
title: Abstract character overview and add standalone characters window
status: To Do
assignee: []
created_date: '2026-05-13'
labels:
  - codex
  - characters
  - frontend
dependencies: []
references:
  - site/src/lib/codex/components/register-step-characters.svelte
  - site/src/lib/codex/components/window-content.svelte
  - site/src/lib/codex/managers/window-factories.ts
  - site/src/lib/codex/managers/window-manager.svelte.ts
  - site/src/lib/codex/managers/icon-manager.svelte.ts
  - site/src/lib/codex/components/desktop-windows.svelte
priority: medium
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The character listing and version history logic currently lives inside `register-step-characters.svelte`, tightly coupled to the registration wizard. This task extracts that UI into a reusable `character-overview.svelte` component and adds a new standalone Codex window (`characters-window.svelte`) so players can browse all their characters and version history at any time — without having to start or be in a registration flow.

Work breaks into two parts:

1. **Abstract the component** — extract character listing, version badges, and event history display from `register-step-characters.svelte` into `site/src/lib/codex/components/character-overview.svelte`. The registration step should then import and use this shared component (no behaviour change to the wizard).

2. **New window** — create `site/src/lib/codex/components/characters-window.svelte` that renders `character-overview.svelte` in read-only / browse mode (no event selection, no "select character" action). Wire it up as a new window type (`'characters'`) in `window-factories.ts`, `window-content.svelte`, and `icon-manager.svelte.ts` with a desktop icon (left/local side).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A new `character-overview.svelte` component exists and renders the full list of the logged-in user's characters with their version history / past events
- [ ] #2 `register-step-characters.svelte` uses `character-overview.svelte` internally — existing registration wizard behaviour is unchanged
- [ ] #3 A new `characters-window.svelte` wraps `character-overview.svelte` in browse-only mode (no event selector prop, no "select" action, no "create new" button)
- [ ] #4 A `'characters'` window type is added to `window-factories.ts` with sensible default dimensions
- [ ] #5 `window-content.svelte` routes the `'characters'` type to `characters-window.svelte`
- [ ] #6 A desktop icon (left/local side) opens the characters window from the Codex desktop
- [ ] #7 The window is accessible whether or not the user is in a registration flow
<!-- AC:END -->
