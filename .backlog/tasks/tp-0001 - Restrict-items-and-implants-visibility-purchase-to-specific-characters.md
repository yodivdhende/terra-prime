---
id: TP-0001
title: Restrict items and implants visibility/purchase to specific characters
status: To Do
assignee: []
created_date: '2026-05-12 15:30'
labels:
  - database
  - items
  - implants
  - access-control
dependencies: []
references:
  - site/db/migrations/0001_initial_schema.sql
  - site/src/lib/db/items.repo.ts
  - site/src/lib/db/implants.repo.ts
  - site/src/lib/components/items-shop.svelte
  - site/src/lib/components/implants-shop.svelte
  - site/src/lib/components/item-form.svelte
  - site/src/lib/components/implant-form.svelte
priority: medium
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Currently all items and implants in the `Items` and `Implants` tables are visible and purchasable by every character. We need a whitelist system: when an item/implant has character assignments, only those characters can see and buy it. Items/implants with no assignments remain available to all characters (default open).

This requires:
- A new DB migration adding `Character_Restricted_Items` and `Character_Restricted_Implants` junction tables
- Updated repo queries that filter catalog entries based on the active character
- Updated API endpoints to accept character context
- Updated shop UIs to filter accordingly
- Updated admin forms so organizers can assign character restrictions to items/implants

Key files: `db/migrations/`, `site/src/lib/db/items.repo.ts`, `site/src/lib/db/implants.repo.ts`, `site/src/routes/api/items/`, `site/src/routes/api/implants/`, `site/src/lib/components/items-shop.svelte`, `site/src/lib/components/implants-shop.svelte`, `site/src/lib/components/item-form.svelte`, `site/src/lib/components/implant-form.svelte`
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A new SQL migration adds `Character_Restricted_Items` (ItemId FK → Items, CharacterId FK → Characters) and `Character_Restricted_Implants` (ImplantId FK → Implants, CharacterId FK → Characters) junction tables
- [ ] #2 Items/implants with no rows in the restriction tables remain visible and purchasable by all characters (open-by-default behaviour)
- [ ] #3 Items/implants that have at least one restriction row are hidden from characters not listed in that table — they do not appear in the shop list and cannot be purchased
- [ ] #4 Admin item-form and implant-form allow assigning zero or more characters as the allowed audience for that item/implant
- [ ] #5 The items-shop and implants-shop components only display entries the active character is allowed to see
- [ ] #6 API endpoints GET /api/items and GET /api/implants accept an optional `characterId` query param and filter accordingly; without it (e.g. admin view) all items are returned
- [ ] #7 Removing all character restrictions from an item/implant makes it visible to everyone again
- [ ] #8 Existing seed data and tests are unaffected (no existing item/implant gets a restriction assigned by default)
<!-- AC:END -->
