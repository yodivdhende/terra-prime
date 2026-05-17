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
| POST | `/api/authentication/register` | Public | `{ userId: number, roles: string[] }` (JSON) | Register new user; sets session cookie |
| POST | `/api/authentication/login` | Public | `{ token: string, roles: string[], name: string }` (JSON) | Login with `{ email, password }`; sets session cookie |
| POST | `/api/authentication/login/token` | Public | `{ token: string }` (JSON) | Set session cookie from existing token `{ token }` |

---

## Sessions

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/sessions` | admin | `Session[]` (JSON) | List all sessions |
| POST | `/api/sessions` | admin | `string` (JSON-encoded token) | Create session; body: `NewSession` |
| DELETE | `/api/sessions/[token]` | — | empty body (200) | Delete session by token |

---

## Users

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/users` | admin | `User[]` (JSON) | List all users |
| GET | `/api/users/[id]` | Public | `User` (JSON) | Get user by ID |
| POST | `/api/users/[id]` | Public | empty body (200) | Update user; body: `{ user: User }` |

---

## Skills

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/skills` | admin/user | `Skill[]` (JSON) — `Skill = { id: number \| null, name: string, description: string, groupId: number, groupName: string, cost?: number }` | List all skills |
| PUT | `/api/skills` | admin | empty body (200) | Create/update skill; body: `Skill` |
| GET | `/api/skills/[id]` | admin | `Skill` (JSON) | Get skill by ID |
| POST | `/api/skills/[id]` | admin | empty body (200) | Update skill; body: `Skill` |
| DELETE | `/api/skills/[id]` | admin | empty body (200) | Delete skill |
| GET | `/api/skills/groups` | admin/user | `SkillGroup[]` (JSON) — `SkillGroup = { id: number \| null, name: string, description: string }` | List all skill groups |
| PUT | `/api/skills/groups` | admin | empty body (200) | Create/update skill group; body: `SkillGroup` |
| GET | `/api/skills/groups/[id]` | admin | `SkillGroup` (JSON) | Get skill group by ID |
| POST | `/api/skills/groups/[id]` | admin | empty body (200) | Update skill group; body: `SkillGroup` |
| DELETE | `/api/skills/groups/[id]` | admin | empty body (200) | Delete skill group |

---

## Items

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/items` | admin/user | `Item[]` (JSON) — `Item = { id: number \| null, name: string, description: string, cost?: number }` | List all items |
| PUT | `/api/items` | admin | empty body (200) | Create/update item; body: `Item` |
| GET | `/api/items/[id]` | admin | `Item` (JSON) | Get item by ID |
| POST | `/api/items/[id]` | admin | empty body (200) | Update item; body: `Item` |
| DELETE | `/api/items/[id]` | admin | empty body (200) | Delete item |

---

## Implants

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/implants` | admin/user | `Implant[]` (JSON) — `Implant = { id: number \| null, name: string, description: string, cost?: number }` | List all implants |
| PUT | `/api/implants` | admin | empty body (200) | Create/update implant; body: `Implant` |
| GET | `/api/implants/[id]` | admin | `Implant` (JSON) | Get implant by ID |
| POST | `/api/implants/[id]` | admin | empty body (200) | Update implant; body: `Implant` |
| DELETE | `/api/implants/[id]` | admin | empty body (200) | Delete implant |

---

## Characters

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/characters` | admin | `Character[]` (JSON) | List all characters |
| PUT | `/api/characters` | user | `{ id: number \| undefined }` (JSON) | Create character; body: `NewCharacter` |
| GET | `/api/characters/[characterId]` | user | `Character` (JSON) | Get character by ID |
| POST | `/api/characters/[characterId]` | user | empty body (200) | Update character; body: `Character \| NewCharacter` |
| GET | `/api/characters/[characterId]/events/[eventId]` | user | `{ characterVersion: CharacterVersionBare \| undefined }` (JSON) | Get the character version used for a specific event |

### Character Versions

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| PUT | `/api/characters/versions` | user | `{ id: number }` (JSON) | Create character version; body: `CharacterVersionBare` |
| GET | `/api/characters/versions/[versionId]` | user | `CharacterVersionBare \| null` (JSON; null when not found) | Get character version by ID |
| PUT | `/api/characters/versions/[versionId]` | user | `number` (JSON-encoded id) | Update character version; body: `CharacterVersionBare` |
| GET | `/api/characters/versions/[versionId]/full` | user | `{}` (JSON) | Get full version detail — **not yet implemented** |
| PUT | `/api/characters/versions/[versionId]/skills` | user | empty body (200) | Replace version skills; body: `CharacterVersionSkill[]` |

---

## Events

Event dates (`start`, `end`) are sent as ISO strings and converted to `Date` objects before validation.

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/events` | admin | `LarpEvent[]` (JSON) | List all events |
| PUT | `/api/events` | admin | empty body (200) | Create event; body: `LarpEvent` (dates as ISO strings) |
| GET | `/api/events/open` | admin/user | `LarpEvent[]` (JSON) | List events with status `Open` |
| GET | `/api/events/[eventId]` | admin/user | `LarpEvent` (JSON; 404 if not found) | Get event by ID |
| POST | `/api/events/[eventId]` | admin | empty body (200) | Update event; body: `LarpEvent` (dates as ISO strings) |
| DELETE | `/api/events/[eventId]` | admin | empty body (200) | Delete event |

### Event Participants

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/events/[eventId]/participants` | admin | `Character[]` (JSON) — repo returns the characters playing in this event | List all participants for event |
| PUT | `/api/events/[eventId]/participants` | admin | empty body (200) | Register a participant; body: `{ eventId, userId, characterVerionId }` |
| DELETE | `/api/events/[eventId]/participants` | admin | empty body (200) | Remove participant; body: `EventParticipant` (`{ eventId, userId, characterVersion }`) |
| GET | `/api/events/[eventId]/participants/characters/[characterId]` | user | `EventParticipant \| null` (JSON; null when not found) | Get participation record for a specific character |

---

## Drive (Google Drive integration)

All drive endpoints are public (no auth). Responses are non-JSON where noted.

| Method | Path | Returns | Description |
|--------|------|---------|-------------|
| GET | `/api/drive/search?q=<query>` | `DriveFile[]` (JSON; `[]` if query < 2 chars) | Search Drive files |
| GET | `/api/drive/[fileId]` | `ReadableStream` — `Content-Type: application/pdf`, `Cache-Control: private, max-age=3600` | Stream file as PDF |
| GET | `/api/drive/[fileId]/dir` | `DriveFile[]` (JSON) | List files in a Drive folder |
| GET | `/api/drive/[fileId]/doc` | `string` — `Content-Type: text/html; charset=utf-8`, `Cache-Control: no-store` | Export Google Doc as HTML; black/white colors are inverted for dark-mode compatibility |

---

## My (current-user scoped)

All endpoints under `/api/my/...` operate on the authenticated user. Auth: `user` role unless stated otherwise. Use these instead of branching on roles inside a shared handler.

| Method | Path | Returns | Description |
|--------|------|---------|-------------|
| GET | `/api/my/user` | `User` (JSON) | Get the currently authenticated user |
| GET | `/api/my/characters` | `Character[]` (JSON) | List characters owned by the current user |
| GET | `/api/my/characters/with-events` | `(Character & { events: Array<{ id: number, name: string }> })[]` (JSON) | List the current user's characters, each with an `events` array |
| GET | `/api/my/characters/versions` | `FullCharacterVersion[]` (JSON) — `FullCharacterVersion = { characterId: number, characterName: string, ownerId: number, ownerName: string, versionId: number, versionName: string, lastEvent: { id: number, name: string } \| null, skills: { id: number, group: number, groupName: string, value: number }[], items: { id: number, count: number }[], implants: number[] }` | List all versions for the current user with full detail |
| GET | `/api/my/events/[eventId]/participants` | `{ characterId: number, characterVersionId: number }` (JSON, 200) or empty body (204 when not registered) | Get the current user's participation for an event |
| POST | `/api/my/events/[eventId]/participants` | empty body (201) | Register the current user for an event; body: `{ draft: CharacterDraft }` where `CharacterDraft = { id: number \| null; name: string; version: { id: number \| null; name; skills; items; implants } }`. Handles three flows in one call based on which ids are null: new character (`id: null`, `version.id: null`), new version on existing character (`id: number`, `version.id: null`), update existing version (`id: number`, `version.id: number`). Renames the character if `name` differs from the stored value. Ownership-checked |
