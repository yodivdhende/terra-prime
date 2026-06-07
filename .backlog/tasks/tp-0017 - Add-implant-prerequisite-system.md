---
id: TP-0017
title: Add implant prerequisite system
status: Done
assignee: []
created_date: '2026-06-02'
updated_date: '2026-06-02'
labels:
  - implants
  - backend
  - frontend
dependencies: []
priority: medium
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Some implants should only be purchasable if the character already owns a specific prerequisite implant (e.g. "Internal Carapace Silver" requires "Internal Carapace Bronze"). Currently all implants are independently selectable with no dependency checks.

This task adds a nullable `Prerequisite` FK column to the `Implants` table, threads it through the repo, API, and admin form, and enforces the constraint in the player-facing shop UI.

Sub-tasks:
- TP-0017.01 — DB migration
- TP-0017.02 — Repo: fetch & save prerequisite
- TP-0017.03 — Shop UI: enforce prerequisite
- TP-0017.04 — Admin: prerequisite picker in implant form
- TP-0017.05 — API: propagate prerequisite through endpoints
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An implant can have an optional prerequisite implant set by admins
- [ ] #2 In the player shop, an implant with a prerequisite is locked (buy disabled) until the prerequisite is owned
- [ ] #3 Removing an implant that is a prerequisite for another owned implant is blocked
- [ ] #4 A "requires: <name>" hint is shown on locked implants in the shop
<!-- AC:END -->
