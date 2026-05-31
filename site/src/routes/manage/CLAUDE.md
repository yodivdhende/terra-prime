# Manage — Admin Interface

## Layout (`+layout.svelte`)

The manage layout is the root shell for all admin pages. It renders:
- `<Navigation />` — left-sidebar nav
- `{@render children()}` — page content, shown only when `sectionManager.showSection` is true
- `<aside>` — side panel, controlled by `sidePanelManager`
- `<Toast />` — mounted once here; do not re-mount in child components

## Shared Managers

Import from `$lib/managers/`:

| Manager | Export | Purpose |
|---|---|---|
| `section-manager.svelte` | `sectionManager` | Controls whether the main section is visible |
| `side-panel-manager.svelte` | `sidePanelManager` | Opens/closes the right-side panel with a dynamic component |
| `toast-manager.svelte` | `TOAST_MANAGER` | Global toast notifications |

## Toast Notifications

Import path: `$lib/managers/toast-manager.svelte`

| Scenario | Call | Color |
|---|---|---|
| Successful save | `TOAST_MANAGER.success(msg)` | `--color-accent` |
| Validation warning | `TOAST_MANAGER.warning(msg)` | `--color-warning` |
| Server / unexpected error | `TOAST_MANAGER.error(msg)` | `--color-warning` |

`<Toast />` is mounted once in `+layout.svelte`. Do not mount it again in child components.
