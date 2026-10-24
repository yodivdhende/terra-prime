---
id: TP-0017
title: Mobile-friendly codex - phone home-screen UI
status: To Do
assignee: []
created_date: '2026-06-01 15:05'
labels:
  - codex
  - frontend
  - ui
dependencies: []
references:
  - site/src/routes/codex/+page.svelte
  - site/src/lib/codex/components/desktop.svelte
  - site/src/lib/codex/components/desktop-icons.svelte
  - site/src/lib/codex/components/window.svelte
  - site/src/lib/codex/components/window-content.svelte
  - site/src/lib/codex/managers/window-manager.svelte.ts
  - site/src/lib/codex/managers/icon-manager.svelte.ts
priority: high
ordinal: 60000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The `/codex` page is a desktop-metaphor UI (SvelteKit 5 + vanilla CSS, green-phosphor terminal aesthetic): a two-column icon grid (left = local icons, right = Drive files), draggable/resizable floating windows opened from those icons, and a bottom taskbar (search, login, status tray). It is not mobile-friendly — a fixed 3-column icon grid, absolutely positioned mouse-only windows, and no responsive handling beyond one padding tweak.

This parent ticket coordinates a phone-style presentation of `/codex`. On narrow viewports the codex automatically switches to a mobile interface: the desktop icons become **app tiles** on a home screen, and tapping a tile opens that "app" **full-screen** with a **close button in the top-right** that returns to the home screen.

The work is purely additive and presentational — it reuses the existing state layer (`WINDOW_MANAGER`, `ICON_MANAGER`, `window-content.svelte`) and only adds a parallel mobile presentation that branches on viewport width. No backend, DB, or auth changes.

Confirmed decisions:
- Activation: auto-switch to the phone layout below a viewport-width breakpoint (CSS/media-query driven).
- Navigation: one app full-screen over the home grid; a top-right close button returns home (no app-switcher / multitasking).
- App set: all existing window types appear as apps (files, folders, docs, PDFs, images, plus login, settings, playtest/register).

Out of scope: touch drag/resize of windows, and any multitasking / app-switcher view.

Sub-tasks:
- TP-0017.01 — Viewport breakpoint detection for codex layout switching
- TP-0017.02 — Mobile home screen: app-tile grid
- TP-0017.03 — Full-screen mobile app shell
- TP-0017.04 — Mobile status bar & dock (search / login / clock)
- TP-0017.05 — Wire mobile layout into the codex root
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Below the breakpoint, `/codex` renders the phone UI instead of the desktop window UI
- [ ] #2 Every desktop icon appears as an app tile on the home screen
- [ ] #3 Tapping a tile opens that app full-screen
- [ ] #4 A close button in the top-right of a full-screen app returns to the home screen
- [ ] #5 Resizing across the breakpoint swaps layouts without losing `WINDOW_MANAGER` state
- [ ] #6 CRT / scanline / vignette effects still apply in mobile mode
- [ ] #7 Desktop layout is unchanged on wide screens
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
<!-- SECTION:FINAL_SUMMARY:END -->
