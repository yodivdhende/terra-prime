# Codex Route

Entry point for the `/codex` page. Initialises the desktop environment and wires server data into the managers.

See `site/src/lib/codex/CLAUDE.md` for full window & icon architecture.

---

## Files

### `+page.server.ts`

Server-side load function. Returns:
```typescript
{
  files: { name: string; mimeType: string; id: string }[];
  loginEnabled: boolean;   // from feature flag 'Login' in locals
}
```

Data is fetched from Google Drive via `getGoogleDriveService().getHomeFiles()`.

### `+page.svelte`

Receives `data` from the server load. Responsibilities:

1. **Initialise windows** — `$effect` calls `WINDOW_MANAGER.addWindows(data.files)` to create a `CodexWindow` for each Drive file based on its MIME type.
2. **Login window** — `$effect` calls `WINDOW_MANAGER.setLoginEnabled(data.loginEnabled)` to conditionally add or remove the login window.
3. **CRT filter** — generates an inline SVG `<filter id="crt-barrel">` for barrel-distortion; applied as `filter: url('#crt-barrel')` on the main wrapper.
4. **Layout** — renders `<Desktop>` (icons + windows) and `<Taskbar>` (search, login button, status icons), plus scanline and vignette overlay divs driven by `EFFECTS_MANAGER`.

#### Layout tree
```
main (backdrop)
├── <Desktop>           ← logo, grid bg, icon grid, open windows
├── <Taskbar>           ← search bar, login shortcut, clock/logo tray
├── scanlines overlay   ← repeating-gradient, pointer-events:none
└── vignette overlay    ← radial-gradient, pointer-events:none
```

---

## Adding a new window type

1. Add a factory in `window-factories.ts` returning a `CodexWindow` with the new `type`.
2. Map the relevant MIME type(s) in `WINDOW_MANAGER.addWindows()` (or call the factory directly where needed).
3. Create the display component in `site/src/lib/codex/components/`.
4. Register it in `window-content.svelte` switch/if block.
5. Add an `Icon` entry with the correct `type` and `side` if a desktop icon is needed.
