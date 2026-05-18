---
id: TP-0009
title: 'Admin: edit character version skills/items/implants in /manage'
status: Done
assignee: []
created_date: '2026-05-18 13:08'
updated_date: '2026-05-18 13:52'
labels: []
dependencies: []
priority: high
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add an admin panel under /manage/characters that lets an admin edit a character version's skills, items, and implants — using the same shop controls as the player-facing register-step-create-character flow. Today the manage page only edits character name/owner; there is no UI for adjusting a CharacterVersion's loadout. This parent task tracks the abstraction work, the new route, the API surface, and wiring it into the existing characters list. Subtasks split it up.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Admin can navigate from /manage/characters to a per-version editor for any character version
- [ ] #2 Editor uses the same skills/items/implants shop UI as register-step-create-character.svelte (skills, items, implants tabs + budget summary)
- [ ] #3 Shop layout is shared code — no duplicate copy between register flow and admin flow
- [ ] #4 Saving from the admin editor persists skills/items/implants via an admin-authed API endpoint
- [ ] #5 Register-step-create-character continues to work unchanged after refactor
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All 6 subtasks complete. Shared character-version-shop.svelte extracted; register step refactored to thin wrapper; admin API endpoints added; budget=no-cap for admin; versions list added to manage/characters/[id]; admin version editor at manage/characters/[id]/versions/[versionId] implemented.
<!-- SECTION:FINAL_SUMMARY:END -->
