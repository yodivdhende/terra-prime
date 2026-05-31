---
id: TP-0014
title: Implement global toast notification component
status: Done
assignee: []
created_date: '2026-05-30'
updated_date: '2026-05-31 11:54'
labels: []
dependencies: []
priority: medium
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a shared toast notification system accessible from both the Codex desktop UI and the Manage admin interface. The toast manager is a singleton that lives in `src/lib/managers/` so both sides can import it without cross-boundary coupling.

### Files to create

**`src/lib/managers/toast-manager.svelte.ts`**
- Singleton `TOAST_MANAGER` using the function factory pattern with Svelte 5 runes
- Internal `$state` queue of toast items: `{ id: string; message: string; type: 'success' | 'error' | 'warning' }`
- Public methods: `success(message: string)`, `error(message: string)`, `warning(message: string)`
- Each call pushes a toast with a generated ID; auto-removes it after ~3 s
- Expose the queue via a getter so components can reactively iterate it

**`src/lib/components/toast.svelte`**
- Renders the active toast queue from `TOAST_MANAGER`
- Position: fixed, bottom-right corner, stacked vertically
- Colors:
  - `success` → `var(--color-accent)`
  - `error` → `var(--color-warning)` (with higher visual weight, e.g. border or background tint)
  - `warning` → `var(--color-warning)`
- Each toast shows the message and dismisses on click or after the auto-remove timeout
- Use a Svelte transition (e.g. `fly` from `svelte/transition`) for enter/exit

### Mount points

**Codex** (`src/lib/codex/components/desktop.svelte`)
- Import and render `<Toast />` once inside the desktop root

**Manage** (`src/routes/manage/+layout.svelte`)
- Import and render `<Toast />` once inside the layout root

### CLAUDE.md updates

As part of this task, add a Toast Notifications section to:
- `src/lib/codex/CLAUDE.md` — append at the end alongside the other manager sections
- `src/routes/manage/CLAUDE.md` — create this file if it does not exist; document the manage layout and shared managers along with the toast section

The toast section should document:
- Import path: `$lib/managers/toast-manager.svelte`
- A table mapping scenario → call → color:
  - Successful save → `TOAST_MANAGER.success(msg)` → `--color-accent`
  - Validation warning → `TOAST_MANAGER.warning(msg)` → `--color-warning`
  - Server / unexpected error → `TOAST_MANAGER.error(msg)` → `--color-warning`
- A note that `<Toast />` is mounted once at the layout root and should not be re-mounted in child components
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `TOAST_MANAGER.success(msg)` renders a toast with `--color-accent` styling in both Codex and Manage
- [ ] #2 `TOAST_MANAGER.error(msg)` renders a toast with `--color-warning` styling in both Codex and Manage
- [ ] #3 `TOAST_MANAGER.warning(msg)` renders a toast with `--color-warning` styling in both Codex and Manage
- [ ] #4 Toasts auto-dismiss after ~3 s and can be manually dismissed by clicking
- [ ] #5 Multiple toasts stack without overlap (FIFO order, newest on top or bottom — pick one and stay consistent)
- [ ] #6 `<Toast />` is mounted exactly once in each layout root (desktop.svelte for Codex, +layout.svelte for Manage)
- [ ] #7 The manager file follows the `<domain>-manager.svelte.ts` naming convention and lives in `src/lib/managers/`
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Created toast-manager.svelte.ts singleton (function factory pattern) in src/lib/managers/ with success/error/warning methods and 3s auto-dismiss. Created toast.svelte component with fly transition, bottom-right fixed positioning, color-coded by type. Mounted <Toast /> in desktop.svelte (Codex) and +layout.svelte (Manage). Added Toast Notifications section to src/lib/codex/CLAUDE.md and created src/routes/manage/CLAUDE.md documenting the layout and all shared managers.
<!-- SECTION:FINAL_SUMMARY:END -->
