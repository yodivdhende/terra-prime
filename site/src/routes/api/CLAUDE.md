# API Routes

All handlers use `handleRequest()` for error handling and extract tokens via `getSessionToken(cookies)` or the `authentication` header.

## Auth helpers

- `authGuard(token, roles)` — validates token, throws 403 if missing required role
- `authGuardForUser(token, roles)` — same, but also returns `{ userId, roles }` for downstream use
- Roles: `'admin'` | `'user'`
- Numeric path params validated via `isNumberOrError(param)`

---

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/authentication/register` | Public | Register new user; sets session cookie; returns `{ userId, roles }` |
| POST | `/api/authentication/login` | Public | Login with `{ email, password }`; sets session cookie; returns `{ token, roles, name }` |
| POST | `/api/authentication/login/token` | Public | Set session cookie from existing token `{ token }` |

---

## Sessions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/sessions` | admin | List all sessions |
| POST | `/api/sessions` | admin | Create session; body: `newSessionType`; returns token |
| DELETE | `/api/sessions/[token]` | — | Delete session by token |

---

## Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users` | admin | List all users |
| GET | `/api/users/active` | user | Get the currently authenticated user |
| GET | `/api/users/[id]` | Public | Get user by ID |
| POST | `/api/users/[id]` | Public | Update user; body: `User` |

---

## Skills

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/skills` | admin | List all skills |
| PUT | `/api/skills` | admin | Create/update skill; body: `Skill` |
| GET | `/api/skills/[id]` | admin | Get skill by ID |
| POST | `/api/skills/[id]` | admin | Update skill; body: `Skill` |
| DELETE | `/api/skills/[id]` | admin | Delete skill |
| GET | `/api/skills/groups` | admin | List all skill groups |
| PUT | `/api/skills/groups` | admin | Create/update skill group; body: `SkillGroup` |
| GET | `/api/skills/groups/[id]` | admin | Get skill group by ID |
| POST | `/api/skills/groups/[id]` | admin | Update skill group; body: `SkillGroup` |
| DELETE | `/api/skills/groups/[id]` | admin | Delete skill group |

---

## Items

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/items` | admin | List all items |
| PUT | `/api/items` | admin | Create/update item; body: `Item` |
| GET | `/api/items/[id]` | admin | Get item by ID |
| POST | `/api/items/[id]` | admin | Update item; body: `Item` |
| DELETE | `/api/items/[id]` | admin | Delete item |

---

## Implants

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/implants` | admin | List all implants |
| PUT | `/api/implants` | admin | Create/update implant; body: `Implant` |
| GET | `/api/implants/[id]` | admin | Get implant by ID |
| POST | `/api/implants/[id]` | admin | Update implant; body: `Implant` |
| DELETE | `/api/implants/[id]` | admin | Delete implant |

---

## Characters

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/characters` | admin/user | Admins see all; users see only their own |
| PUT | `/api/characters` | user | Create character; body: `newCharacter` |
| GET | `/api/characters/with-events` | user | Characters owned by current user, each with an `events` array |
| GET | `/api/characters/[characterId]` | user | Get character by ID |
| POST | `/api/characters/[characterId]` | user | Update character; body: `Character \| newCharacter` |
| GET | `/api/characters/[characterId]/events/[eventId]` | user | Get the character version used for a specific event |

### Character Versions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | `/api/characters/versions` | user | Create character version; body: `CharacterVersionBare`; returns saved version |
| GET | `/api/characters/versions/[versionId]` | user | Get character version by ID |
| PUT | `/api/characters/versions/[versionId]` | user | Update character version; body: `CharacterVersionBare`; returns updated version |
| GET | `/api/characters/versions/[versionId]/full` | user | Get full version detail — **not yet implemented** |
| PUT | `/api/characters/versions/[versionId]/skills` | user | Replace version skills; body: `CharacterVersionSkill[]` |

---

## Events

Event dates (`start`, `end`) are sent as ISO strings and converted to `Date` objects before validation.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/events` | admin | List all events |
| PUT | `/api/events` | admin | Create event; body: `LarpEvent` (dates as ISO strings) |
| GET | `/api/events/open` | admin/user | List events with status `Open` |
| GET | `/api/events/[eventId]` | admin | Get event by ID |
| POST | `/api/events/[eventId]` | admin | Update event; body: `LarpEvent` (dates as ISO strings) |
| DELETE | `/api/events/[eventId]` | admin | Delete event |

### Event Participants

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/events/[eventId]/participants` | admin | List all participants for event |
| PUT | `/api/events/[eventId]/participants` | admin | Register a participant; body: `{ eventId, userId, characterVerionId }` |
| DELETE | `/api/events/[eventId]/participants` | admin | Remove participant; body: `EventParticipant` |
| GET | `/api/events/[eventId]/participants/me` | user | Get current user's own participation; 204 if not registered |
| GET | `/api/events/[eventId]/participants/characters/[characterId]` | user | Get participation record for a specific character |

---

## Drive (Google Drive integration)

All drive endpoints are public (no auth).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/drive/search?q=<query>` | Search Drive files; query must be ≥ 2 characters |
| GET | `/api/drive/[fileId]` | Stream file as PDF (`Cache-Control: private, max-age=3600`) |
| GET | `/api/drive/[fileId]/dir` | List files in a Drive folder |
| GET | `/api/drive/[fileId]/doc` | Export Google Doc as HTML; black/white colors are inverted for dark-mode compatibility |
