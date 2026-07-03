# Codex Lib — Window & Icon Architecture

## Overview

This directory implements a desktop-UI metaphor: windows opened from icons, backed by Google Drive files. All state is Svelte 5 runes (`$state`, `$derived`).

---

## Directory Structure

```
codex/
├── managers/
│   ├── window-manager.svelte.ts   # Window state & lifecycle
│   ├── window-factories.ts        # Factory functions for each window type
│   ├── icon-manager.svelte.ts     # Icons derived from window state
│   └── effects-manager.svelte.ts  # CRT / scanline / vignette toggles
└── components/
    ├── desktop.svelte             # Root layout: logo, grid, icons, windows
    ├── desktop-icons.svelte       # Renders icon grid (left=local, right=drive)
    ├── desktop-windows.svelte     # Renders all open windows
    ├── window.svelte              # Draggable/resizable window shell
    ├── window-content.svelte      # Routes window.type → specific component
    ├── dir-window.svelte          # Folder browser: tree + preview pane
    ├── pdf-window.svelte          # PDF viewer
    ├── doc-window.svelte          # HTML document viewer
    ├── image-window.svelte        # Image viewer
    ├── login-window.svelte        # Auth form
    ├── settings-window.svelte     # Effects toggles
    ├── taskbar.svelte             # Bottom bar: search, login button, status icons
    ├── task-icons.svelte          # Status tray: clock, DHVT logo
    └── search-bar.svelte          # Drive file search with dropdown
```

---

## Window Structure

### `CodexWindow` type (defined in `window-factories.ts`)

```typescript
type CodexWindow = {
	id: string;
	type: 'pdf' | 'dir' | 'doc' | 'image' | 'settings' | 'login';
	state: 'open' | 'hidden' | 'closed';
	dimension: { w: number; h: number }; // pixels
	position: { x: number; y: number; z: number }; // x/y coords + z-index
	contentData: string; // Drive file ID or content key
	title: string;
	icon?: Icon; // null = no desktop icon
};
```

**States:**

- `open` — rendered and visible
- `closed` — not rendered at all
- `hidden` — parsed but invisible (currently unused in rendering)

**Initial state convention:** files whose name starts with `!` are created in `'open'` state; all others default to `'closed'`.

### Window Factories

Each factory in `window-factories.ts` creates a pre-configured `CodexWindow` with sensible defaults:

| Factory                  | Dimensions       | Notes               |
| ------------------------ | ---------------- | ------------------- |
| `createSettingsWindow()` | 400×300          | Fixed size          |
| `createLoginWindow()`    | 320×280          | Conditionally added |
| `createFolderWindow()`   | 55%×60% viewport | Drive folders       |
| `createPdfWindow()`      | 40%×75% viewport | PDF files           |
| `createDocWindow()`      | 45%×65% viewport | HTML docs           |
| `createImageWindow()`    | 35%×55% viewport | Images              |

### Window Manager (`window-manager.svelte.ts`)

Singleton `WINDOW_MANAGER` with `$state` array of `CodexWindow[]`.

Key methods:

- `addWindows(files)` — creates windows from Drive file metadata, maps MIME type → window type
- `openWindow(id)` / `closeWindow(id)` — mutate `state`
- `focusWindow(id)` — moves window to top of z-stack, reassigns `position.z` for all windows
- `setLoginEnabled(boolean)` — adds or removes the login window dynamically

### Window UI (`window.svelte`)

- Positioned absolutely using `position.x/y/z`
- Title bar: draggable, click-to-focus, close button
- Edges: resizable on s / e / w / se / sw (6px hit area)
- Content area: `overflow: auto`
- Click anywhere on window → `focusWindow()`

### Content Routing (`window-content.svelte`)

Dispatches `window.type` to the matching component. Each component fetches its own data via `/api/drive/` endpoints.

---

## Icon Structure

### `Icon` type (defined in `window-factories.ts` and used in `icon-manager.svelte.ts`)

```typescript
// In window-factories.ts (attached to CodexWindow)
type Icon = {
	type: 'file' | 'dir' | 'image' | 'settings' | 'login';
	side: 'left' | 'right';
};

// In icon-manager.svelte.ts (display model)
type Icon = {
	windowId: string;
	title: string;
	type: 'file' | 'dir' | 'image' | 'settings' | 'login';
	side: 'left' | 'right';
};
```

- `side: 'left'` — local/system icons (settings, login)
- `side: 'right'` — Google Drive file icons
- Windows with `icon == null` have no desktop icon

### Icon Manager (`icon-manager.svelte.ts`)

Singleton `ICON_MANAGER`. Uses `$derived` to compute icons from `WINDOW_MANAGER.windows[]` — automatically updates when windows change.

### Icon Rendering (`desktop-icons.svelte`)

Two sections: `.local` (left column) and `.drive` (right column), 3-column grid each.

Lucide icons by type:

| Type                   | Icon        |
| ---------------------- | ----------- |
| `file` / `doc` / `pdf` | `File`      |
| `dir`                  | `Folder`    |
| `image`                | `Image`     |
| `settings`             | `Settings`  |
| `login`                | `UserRound` |

Click → `openWindow(windowId)` + `focusWindow(windowId)`

---

## Data Flow

```
Drive files (from route)
  → WINDOW_MANAGER.addWindows()
  → WINDOW_MANAGER.windows[]    ($state)
  → ICON_MANAGER.icons[]        ($derived)
  → desktop-icons.svelte        (renders icon grid)
  → desktop-windows.svelte      (renders open windows)
  → window.svelte               (shell)
  → window-content.svelte       (routes by type)
  → PdfWindow / DirWindow / …
```

---

## Effects Manager (`effects-manager.svelte.ts`)

Singleton `EFFECTS_MANAGER` with three boolean `$state` toggles:

- `crt` — barrel distortion SVG filter
- `scanlines` — repeating-linear-gradient overlay
- `vignette` — radial-gradient overlay

Toggled from `settings-window.svelte`.

---

## Toast Notifications

Import path: `$lib/managers/toast-manager.svelte`

| Scenario                  | Call                         | Color             |
| ------------------------- | ---------------------------- | ----------------- |
| Successful save           | `TOAST_MANAGER.success(msg)` | `--color-accent`  |
| Validation warning        | `TOAST_MANAGER.warning(msg)` | `--color-warning` |
| Server / unexpected error | `TOAST_MANAGER.error(msg)`   | `--color-warning` |

`<Toast />` is mounted once in `desktop.svelte`. Do not mount it again in child components.
