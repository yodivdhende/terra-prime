---
id: TP-0008
title: Rename /main to /manage and convert into admin CRUD interface
status: Done
assignee: []
created_date: '2026-05-18 07:05'
updated_date: '2026-05-18 07:47'
labels: []
dependencies: []
priority: high
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rename src/routes/main → src/routes/manage and rework it into an admin-only management interface for database objects (Users, Characters, Events, Sessions, Skills, Items, Implants). All mutations and reads in manage pages must go through /api/* endpoints, and those endpoints must require admin authGuard. Player-facing routes currently living under /main (login, register, sign-up flow, /api/my-based views) are deleted — player flows are handled elsewhere (codex windows). Tree is flattened: /manage/{users,characters,events,sessions,skills,items,implants}. Child tasks cover the structural move and each database object in turn.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/routes/main no longer exists; src/routes/manage exists at the flattened layout (no dashboard/ or inner manage/ nesting)
- [ ] #2 All /main/* href and action references in the codebase are updated to /manage/*
- [ ] #3 Every page under /manage loads data and mutates state via fetch to /api/*; no direct repo imports in +page.server.ts files under /manage
- [ ] #4 Every /api/* endpoint reachable from /manage runs authGuard(getSessionToken(cookies), ['admin']) (or returns equivalent denial)
- [ ] #5 Player routes (login, register, event sign-up at /events/[eventId], /api/my-based character list) are removed from /manage
- [ ] #6 All child tasks (route restructure + one per database object) are Done
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All 6 subtasks complete. src/routes/main deleted, src/routes/manage created with flat tree. Admin auth guard on layout. All manage pages use fetch to API (no direct repo imports). API endpoints hardened: users/[id] GET+POST require admin, characters PUT/GET/POST allow admin+user, events/[eventId] DELETE+POST param bug fixed, sessions/[token] DELETE requires admin, sessions new form fixed for multi-select roles, skills catalog server loads use API instead of repo.
<!-- SECTION:FINAL_SUMMARY:END -->
