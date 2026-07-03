# Feature Flag System

Feature flags are managed via a Google Spreadsheet and loaded into every request through SvelteKit's server hooks. Flags are cached server-side for 5 minutes to avoid hitting the Sheets API on every request.

---

## Spreadsheet Structure

**Spreadsheet ID:** `1cpFltTFhzOR6wUvolhYdwugmQDNxuTMFQDNgPrXWfpk`

| Column A | Column B |
|----------|----------|
| Name     | Active   |
| my-flag  | ☑ (TRUE) |
| beta-ui  | ☐ (FALSE)|

- Row 1 is the header (`Name` / `Active`) and is skipped automatically.
- Column A holds the flag name (string).
- Column B holds a checkbox — Google Sheets sends `"TRUE"` or `"FALSE"`.

---

## Setup

Share the spreadsheet with your service account email (`VITE_GOOGLE_CLIENT_EMAIL`) and grant it **Viewer** access. This is the same service account already used for Drive/Sheets access elsewhere in the project.

---

## How It Works

### 1. `feature-flags.ts` — Core module

Located at `src/lib/server/feature-flags.ts`.

Fetches rows `A2:B201` from the spreadsheet, parses them into a `Record<string, boolean>`, and stores the result in an in-memory cache.

```ts
export type FeatureFlags = Record<string, boolean>;
```

**Cache:** Results are kept for **5 minutes** (`CACHE_TTL_MS = 5 * 60 * 1000`). The next request after expiry triggers a fresh fetch. The cache resets on server restart.

### 2. `hooks.server.ts` — Request hook

Every incoming request runs through `src/hooks.server.ts`, which calls `getFeatureFlags()` and attaches the result to `event.locals`:

```ts
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.featureFlags = await getFeatureFlags();
  return resolve(event);
};
```

If the Sheets API call fails (network error, auth issue), it logs the error and falls back to `{}` — all flags default to `false`, the app keeps running.

### 3. `app.d.ts` — Type safety

`App.Locals` is typed so `locals.featureFlags` is fully typed everywhere:

```ts
interface Locals {
  featureFlags: FeatureFlags;
}
```

---

## Using Flags

### In a `+page.server.ts`

```ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const showNewDashboard = locals.featureFlags['new-dashboard'] ?? false;
  return { showNewDashboard };
};
```

### With the `isEnabled` helper

```ts
import { isEnabled } from '$lib/server/feature-flags';

export const load: PageServerLoad = async ({ locals }) => {
  if (isEnabled(locals.featureFlags, 'beta-feature')) {
    // load extra data
  }
};
```

`isEnabled(flags, name)` returns `true` only when the flag exists **and** is explicitly `true`. Missing flags are treated as disabled.

---

## Cache Invalidation

To force an immediate refresh (e.g. from an admin endpoint):

```ts
import { invalidateFeatureFlagCache } from '$lib/server/feature-flags';

invalidateFeatureFlagCache();
```

The next call to `getFeatureFlags()` will fetch fresh data from the spreadsheet.
