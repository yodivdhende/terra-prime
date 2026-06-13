<CRITICAL_INSTRUCTION>

## TASK MANAGEMENT

This project uses **GitHub Issues** (via the `gh` CLI) for all task tracking. The repo is `yodivdhende/terra-prime`.

### Issue title and body
- Every issue title must be prefixed with its TP ID (see **TP ID scheme** below)
- Every task must have a step-by-step implementation plan in its body
- Plans are numbered steps, plain text, no markdown headers
- Each step names the specific file(s) to create or modify and what to do
- Keep plans under 300 words

### TP ID scheme
- Every issue gets a TP ID in its title: `[TP-NNNN] <title>` where NNNN is the GitHub issue number zero-padded to 4 digits
- After creating an issue, read back its number with `gh issue create ... | tail -1` (the URL contains the number), then immediately rename it: `gh issue edit <N> --title "[TP-NNNN] <title>"`
- Subtasks use their **parent's** TP number plus a two-digit sequence: `[TP-NNNN.SS] <title>` (SS = 01, 02, 03…)
- To find the next SS for a parent, count existing subtasks listed in the parent body and increment

### Parent / subtask relationships
- Parent issues get the `epic` label
- Parent body ends with a `### Subtasks` section containing a checklist of `- [ ] #N [TP-NNNN.SS] <title>` lines
- Subtask body starts with `Parent: #N` so the link is bidirectional
- Tick the checkbox in the parent when a subtask is closed

### Rules
- Use `gh issue list` before creating new tasks (avoid duplicates)
- Use `gh issue list --search "<keyword>"` to find a specific task
- Use `gh issue create --title "[TP-NNNN] <title>" --body "<plan>"` (add `--label epic` for parents); apply the TP ID immediately after creation once the issue number is known
- Mark work-in-progress by assigning yourself: `gh issue edit <N> --add-assignee @me`
- Close with `gh issue close <N>` when complete — don't batch updates
- Use `gh issue edit <N> --body "<new>"` to update; pass the full new body (it replaces, not appends)
- Use `gh issue delete <N>` to remove a task

</CRITICAL_INSTRUCTION>

# Terra-Prime

Full-stack SvelteKit + TypeScript web app for managing LARP events and characters. MySQL backend, real-time WebSocket support, and an Arduino/ESP32 companion device (`/cyd`).

## Project structure

```
site/   - SvelteKit app (frontend + REST API)
db/     - MySQL init scripts and migrations
cyd/    - Arduino/ESP32 firmware (PlatformIO)
```

## Running the app

```bash
cd site
pnpm dev          # dev server
pnpm build        # production build
pnpm start        # run production build
```

Docker Compose starts MySQL + PhpMyAdmin:
```bash
docker compose up
```

## Running tests

```bash
cd site
pnpm test          # run once
pnpm test:watch    # watch mode
```

Tests live in `site/src/tests/`. The test runner is **Vitest** (`site/vitest.config.ts`).

## API

All API routes are SvelteKit server files under `site/src/routes/api/`. They follow the pattern:

```
GET/POST/PUT/DELETE /api/<domain>/+server.ts
```

Key utilities:
- `$lib/utils/request.ts` — `handleRequest`, `authGuard`, `authGuardForUser`
- `$lib/utils/cookies.ts` — `getSessionToken`, `setSessionToken`
- `$lib/types/errors.ts` — `BadRequest`, `NotFoundRequest`, `UnAutherizedRequestError`, `NoAccesRequest`
- `$lib/db/*.repo.ts` — all database access (repository pattern, mysql2)

## Testing rules

**Whenever you add or modify an API route handler, you must also add or update the corresponding tests.**

- Tests go in `site/src/tests/<domain>/`
- Use `mockCookies(token?)` from `src/tests/helpers/mockCookies` to simulate auth
- Use `mockRequest(body?)` from `src/tests/helpers/mockRequest` to build a request body
- Use `createSessionRepoMock(session?)` from `src/tests/mocks/sessionRepo` and `vi.mock('$lib/db/session.repo', ...)` to stub auth
- Every handler test must cover at minimum:
  - Happy path (correct response body + status)
  - Missing/invalid auth (expect rejection or error)
  - Invalid request body where applicable (expect 400)

Example test skeleton:

```ts
import { describe, it, expect, vi } from 'vitest';
import { mockCookies } from '../../tests/helpers/mockCookies';
import { createSessionRepoMock } from '../../tests/mocks/sessionRepo';

vi.mock('$lib/db/session.repo', () => ({ sessionRepo: createSessionRepoMock() }));
vi.mock('$lib/db/skills.repo', () => ({ skillRepo: { getAll: vi.fn().mockResolvedValue([]) } }));

import { GET } from '../../routes/api/skills/+server';

describe('GET /api/skills', () => {
  it('returns 200 with skills for an admin', async () => {
    const res = await GET({ cookies: mockCookies('valid-token') } as any);
    expect(res.status).toBe(200);
  });
});
```

## Auth roles

`admin` | `player` | `extra` | `user`

Most write endpoints require `admin`. Read endpoints vary — check the `authGuard` / `authGuardForUser` call in each handler.
