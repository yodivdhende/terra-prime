# API Routes

All handlers use `handleRequest()` for error handling and extract tokens via `getSessionToken(cookies)` or the `authentication` header.

## Auth helpers

- `authGuard(token, roles)` — validates token, throws 403 if missing required role
- `authGuardForUser(token, roles)` — same, but also returns `{ userId, roles }` for downstream use
- Roles: `'admin'` | `'user'`
- Numeric path params validated via `isNumberOrError(param)`

All responses are JSON unless explicitly noted (file streams, HTML, `204 No Content`).

---

## Authentication

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| POST | `/api/authentication/register` | Public | `{ userId: number, roles: string[] }` | Register new user; sets session cookie |
| POST | `/api/authentication/login` | Public | `{ token: string, roles: string[], name: string }` | Login with `{ email, password }`; sets session cookie |
| POST | `/api/authentication/login/token` | Public | `{ token: string }` | Set session cookie from existing token `{ token }` |

---

## Sessions

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/sessions` | admin | `Session[]` | List all sessions |
| POST | `/api/sessions` | admin | `string` (token) | Create session; body: `newSessionType` |
| DELETE | `/api/sessions/[token]` | — | `204 No Content` | Delete session by token |

---

## Users

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/users` | admin | `User[]` | List all users |
| GET | `/api/users/[id]` | Public | `User` | Get user by ID |
| POST | `/api/users/[id]` | Public | `204 No Content` | Update user; body: `{ user: User }` |

---

## Skills

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/skills` | admin/user | `Skill[]` | List all skills (with `cost`) |
| PUT | `/api/skills` | admin | `204 No Content` | Create/update skill; body: `Skill` |
| GET | `/api/skills/[id]` | admin | `Skill` | Get skill by ID |
| POST | `/api/skills/[id]` | admin | `204 No Content` | Update skill; body: `Skill` |
| DELETE | `/api/skills/[id]` | admin | `204 No Content` | Delete skill |
| GET | `/api/skills/groups` | admin/user | `SkillGroup[]` | List all skill groups |
| PUT | `/api/skills/groups` | admin | `204 No Content` | Create/update skill group; body: `SkillGroup` |
| GET | `/api/skills/groups/[id]` | admin | `SkillGroup` | Get skill group by ID |
| POST | `/api/skills/groups/[id]` | admin | `204 No Content` | Update skill group; body: `SkillGroup` |
| DELETE | `/api/skills/groups/[id]` | admin | `204 No Content` | Delete skill group |

---

## Items

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/items` | admin/user | `Item[]` | List all items (with `cost`) |
| PUT | `/api/items` | admin | `204 No Content` | Create/update item; body: `Item` |
| GET | `/api/items/[id]` | admin | `Item` | Get item by ID |
| POST | `/api/items/[id]` | admin | `204 No Content` | Update item; body: `Item` |
| DELETE | `/api/items/[id]` | admin | `204 No Content` | Delete item |

---

## Implants

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/implants` | admin/user | `Implant[]` | List all implants (with `cost`) |
| PUT | `/api/implants` | admin | `204 No Content` | Create/update implant; body: `Implant` |
| GET | `/api/implants/[id]` | admin | `Implant` | Get implant by ID |
| POST | `/api/implants/[id]` | admin | `204 No Content` | Update implant; body: `Implant` |
| DELETE | `/api/implants/[id]` | admin | `204 No Content` | Delete implant |

---

## Characters

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/characters` | admin | `Character[]` | List all characters |
| PUT | `/api/characters` | user | `{ id: number }` | Create character; body: `newCharacter` |
| GET | `/api/characters/[characterId]` | user | `Character` | Get character by ID |
| POST | `/api/characters/[characterId]` | user | `204 No Content` | Update character; body: `Character \| newCharacter` |
| GET | `/api/characters/[characterId]/events/[eventId]` | user | `{ characterVersion: CharacterVersion \| undefined }` | Get the character version used for a specific event |

### Character Versions

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| PUT | `/api/characters/versions` | user | `{ id: number }` | Create character version; body: `CharacterVersionBare` |
| GET | `/api/characters/versions/[versionId]` | user | `CharacterVersion` | Get character version by ID |
| PUT | `/api/characters/versions/[versionId]` | user | `number` (id) | Update character version; body: `CharacterVersionBare` |
| GET | `/api/characters/versions/[versionId]/full` | user | `{}` | Get full version detail — **not yet implemented** |
| PUT | `/api/characters/versions/[versionId]/skills` | user | `204 No Content` | Replace version skills; body: `CharacterVersionSkill[]` |

---

## Events

Event dates (`start`, `end`) are sent as ISO strings and converted to `Date` objects before validation.

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/events` | admin | `LarpEvent[]` | List all events |
| PUT | `/api/events` | admin | `204 No Content` | Create event; body: `LarpEvent` (dates as ISO strings) |
| GET | `/api/events/open` | admin/user | `LarpEvent[]` | List events with status `Open` |
| GET | `/api/events/[eventId]` | admin/user | `LarpEvent` | Get event by ID (includes `budget`) |
| POST | `/api/events/[eventId]` | admin | `204 No Content` | Update event; body: `LarpEvent` (dates as ISO strings) |
| DELETE | `/api/events/[eventId]` | admin | `204 No Content` | Delete event |

### Event Participants

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/events/[eventId]/participants` | admin | `EventParticipant[]` | List all participants for event |
| PUT | `/api/events/[eventId]/participants` | admin | `204 No Content` | Register a participant; body: `{ eventId, userId, characterVerionId }` |
| DELETE | `/api/events/[eventId]/participants` | admin | `204 No Content` | Remove participant; body: `EventParticipant` |
| GET | `/api/events/[eventId]/participants/characters/[characterId]` | user | `EventParticipant` | Get participation record for a specific character |

---

## Drive (Google Drive integration)

All drive endpoints are public (no auth). Responses are non-JSON where noted.

| Method | Path | Returns | Description |
|--------|------|---------|-------------|
| GET | `/api/drive/search?q=<query>` | `DriveFile[]` | Search Drive files; query must be ≥ 2 characters |
| GET | `/api/drive/[fileId]` | PDF stream (non-JSON) | Stream file as PDF (`Cache-Control: private, max-age=3600`) |
| GET | `/api/drive/[fileId]/dir` | `DriveFile[]` | List files in a Drive folder |
| GET | `/api/drive/[fileId]/doc` | HTML (non-JSON) | Export Google Doc as HTML; black/white colors are inverted for dark-mode compatibility |

---

## My (current-user scoped)

All endpoints under `/api/my/...` operate on the authenticated user. Auth: `user` role unless stated otherwise. Use these instead of branching on roles inside a shared handler.

| Method | Path | Returns | Description |
|--------|------|---------|-------------|
| GET | `/api/my/user` | `User` | Get the currently authenticated user |
| GET | `/api/my/characters` | `Character[]` | List characters owned by the current user |
| GET | `/api/my/characters/with-events` | `(Character & { events: Array<{ id: number, name: string }> })[]` | List the current user's characters, each with an `events` array |
| GET | `/api/my/characters/versions` | `CharacterVersionFull[]` | List all versions for the current user with full detail: character info, last event, skills (id/group/value), item ids, implant ids |
| GET | `/api/my/events/[eventId]/participants` | `EventParticipant` or `204 No Content` | Get the current user's participation for an event; 204 if not registered |
| POST | `/api/my/events/[eventId]/participants` | `201 Created` | Register the current user for an event; body: `{ draft: CharacterDraft }` where `CharacterDraft = { id: number \| null; name: string; version: { id: number \| null; name; skills; items; implants } }`. Handles four flows in one call based on which ids are null: new character (`id: null`, `version.id: null`), new version on existing character (`id: number`, `version.id: null`), update existing version (`id: number`, `version.id: number`). Renames the character if `name` differs from the stored value. Ownership-checked |
