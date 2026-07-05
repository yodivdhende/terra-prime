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
| POST | `/api/authentication/verify-email` | Public | `{ ok: true, userId: number }` (JSON) | Consume a verification token; body: `{ token: string }`. Returns 400 if invalid/expired |
| POST | `/api/authentication/verify-email/resend` | user/admin | `{ ok: true }` (JSON) | Resend verification email to the current session user. Returns 400 if already verified |
| POST | `/api/authentication/forgot-password` | Public | `{ ok: true }` (JSON) | Request a password reset email; body: `{ email: string }`. Always returns 200 even when the email is unknown (no enumeration) |
| POST | `/api/authentication/reset-password` | Public | `{ ok: true, userId: number }` (JSON) | Consume a password reset token and update the user's password; body: `{ token: string, password: string }`. Returns 400 for invalid/expired token or password shorter than 8 characters |

---

## Email & Admin

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| POST | `/api/admin/emails/send` | admin | `{ ok: true }` (JSON) | Send any template to any recipient; body: `{ to: string, templateKey: string, link?: string }`. Throws 400 for unknown template keys |
| POST | `/api/admin/users/[id]/resend-verification` | admin | `{ ok: true }` (JSON) | Resend verification email to a specific user. Returns 400 if already verified |
| POST | `/api/admin/users/[id]/send-password-reset` | admin | `{ ok: true }` (JSON) | Send a password reset email to a specific user |

---

## Email Templates

Templates are `{ id, key, docUrl }` rows. `docUrl` is a Google Doc URL whose HTML is fetched via the Drive service at send-time. Subjects are hardcoded per `key` in `src/lib/server/email.service.ts`. Templates support a literal `[[LINK]]` marker that is replaced (HTML-escaped) when a `link` is provided to the sender.

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/email-templates` | admin | `EmailTemplate[]` (JSON) — `EmailTemplate = { id: number \| null, key: string, docUrl: string }` | List all templates |
| PUT | `/api/email-templates` | admin | `{ id: number }` (JSON) | Upsert template; body: `EmailTemplate`. Insert when `id` is null, update otherwise |
| GET | `/api/email-templates/[id]` | admin | `EmailTemplate` (JSON; 404 if not found) | Get template by ID |
| POST | `/api/email-templates/[id]` | admin | empty body (200) | Update template; body: `EmailTemplate` |
| DELETE | `/api/email-templates/[id]` | admin | empty body (200) | Delete template |

---

## Sessions

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/sessions` | admin | `Session[]` (JSON) | List all sessions |
| POST | `/api/sessions` | admin | `string` (JSON-encoded token) | Create session; body: `NewSession` |
| DELETE | `/api/sessions/[token]` | admin | empty body (200) | Delete session by token |

---

## Users

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/users` | admin | `User[]` (JSON) | List all users |
| GET | `/api/users/[id]` | admin | `User` (JSON) | Get user by ID |
| POST | `/api/users/[id]` | admin | empty body (200) | Update user; body: `User` (raw, no wrapper) |

---

## Skills

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/skills` | admin/user | `Skill[]` (JSON) — `Skill = { id: number \| null, name: string, description: string, groupId: number, groupName: string, cost?: number }` | List all skills |
| PUT | `/api/skills` | admin | empty body (200) | Create/update skill; body: `Skill` |
| GET | `/api/skills/[id]` | admin | `Skill` (JSON) | Get skill by ID |
| POST | `/api/skills/[id]` | admin | empty body (200) | Update skill; body: `Skill` |
| DELETE | `/api/skills/[id]` | admin | empty body (200) | Delete skill |
| POST | `/api/skills/bulk` | admin | empty body (200) | Bulk update skills; body: `Skill[]` |
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
| POST | `/api/items/bulk` | admin | empty body (200) | Bulk update items; body: `Item[]` |

---

## Implants

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/implants` | admin/user | `Implant[]` (JSON) — `Implant = { id: number \| null, name: string, description: string, cost?: number }` | List all implants |
| PUT | `/api/implants` | admin | empty body (200) | Create/update implant; body: `Implant` |
| GET | `/api/implants/[id]` | admin | `Implant` (JSON) | Get implant by ID |
| POST | `/api/implants/[id]` | admin | empty body (200) | Update implant; body: `Implant` |
| DELETE | `/api/implants/[id]` | admin | empty body (200) | Delete implant |
| POST | `/api/implants/bulk` | admin | empty body (200) | Bulk update implants; body: `Implant[]` |

---

## Characters

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/characters` | admin | `Character[]` (JSON) | List all characters |
| PUT | `/api/characters` | admin/user | `{ id: number \| undefined }` (JSON) | Create character; body: `NewCharacter` |
| GET | `/api/characters/[characterId]` | admin/user | `Character` (JSON) | Get character by ID |
| POST | `/api/characters/[characterId]` | admin/user | empty body (200) | Update character; body: `Character \| NewCharacter` |
| GET | `/api/characters/[characterId]/events/[eventId]` | user | `{ characterVersion: CharacterVersionBare \| undefined }` (JSON) | Get the character version used for a specific event |

### Character Versions

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| PUT | `/api/characters/versions` | user | `{ id: number }` (JSON) | Create character version; body: `CharacterVersionBare` |
| GET | `/api/characters/versions/[versionId]` | user | `CharacterVersionBare \| null` (JSON; null when not found) | Get character version by ID |
| PUT | `/api/characters/versions/[versionId]` | user | `number` (JSON-encoded id) | Update character version; body: `CharacterVersionBare` |
| DELETE | `/api/characters/versions/[versionId]` | admin | empty body (200) | Delete character version and its skills/items/implants |
| GET | `/api/characters/versions/[versionId]/full` | user | `{}` (JSON) | Get full version detail — **not yet implemented** |
| PUT | `/api/characters/versions/[versionId]/skills` | user | empty body (200) | Replace version skills; body: `CharacterVersionSkill[]` |

---

## Events

Event dates (`start`, `end`) are sent as ISO strings and converted to `Date` objects before validation. `LarpEvent` also carries `formId?: string | null` — the bare Google Form ID (no URL) attached to this event — and `sheetId?: string | null` — the linked Google Spreadsheet ID for responses (server-assigned, not set by the admin UI). Saving an event with `formId` set and `sheetId` null eagerly creates the response spreadsheet in Drive folder `1fxhnT9gEr6CWyfBgGQ1ZWYoGkpLH4c-J` and persists its ID.

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
| PUT | `/api/events/[eventId]/participants` | admin | empty body (200) | Register a participant; body: `CharacterWithVersions` (`{ id: number \| null, name, ownerId, ownerName, versions: CharacterVersionBare[] }`). Creates the character when `id` is null, otherwise updates it; then creates/updates the **last** entry in `versions` (create when its `id` is null) and registers that version for the event under `ownerId` |
| DELETE | `/api/events/[eventId]/participants` | admin | empty body (200) | Remove participant; body: `EventParticipant` (`{ eventId, userId, characterVersion }`) |
| GET | `/api/events/[eventId]/participants/characters/[characterId]` | user | `EventParticipant \| null` (JSON; null when not found) | Get participation record for a specific character |

---

## Forms (Google Forms integration)

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/forms/[formId]` | Public | `GoogleForm` (JSON) | Fetch a Google Form's structure |

Form submission is no longer a public Forms-API call. It writes a row to the event's linked Google Sheet via `POST /api/my/events/[eventId]/form-submit` (see the "My" section). The sheet is created in workspace Drive folder `1fxhnT9gEr6CWyfBgGQ1ZWYoGkpLH4c-J` and its ID is stored on `Events.SheetId`.

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
| GET | `/api/my/characters/versions` | `MyCharacterVersionsResponse` (JSON) — `{ characters: (Character & { versions: CharacterVersionFull[] })[] }` where each version's `skills`/`items`/`implants` are joined with the catalog and `events` is the list of events the version is registered for: `skills: { id, name, group, groupName, value }[]`, `items: { id, name, description, count }[]`, `implants: { id, name, description }[]`, `events: { id, name }[]` | List the current user's characters with their versions, each version's skill/item/implant IDs resolved to full catalog entries plus the events the version is registered for |
| GET | `/api/my/events/[eventId]/participants` | `{ characterId: number, characterVersionId: number }` (JSON, 200) or empty body (204 when not registered) | Get the current user's participation for an event |
| POST | `/api/my/events/[eventId]/participants` | empty body (201) | Register the current user for an event; body: `{ draft: CharacterDraft }` where `CharacterDraft = { id: number \| null; name: string; version: { id: number \| null; name; skills; items; implants } }`. Handles three flows in one call based on which ids are null: new character (`id: null`, `version.id: null`), new version on existing character (`id: number`, `version.id: null`), update existing version (`id: number`, `version.id: number`). Renames the character if `name` differs from the stored value. Ownership-checked |
| POST | `/api/my/events/[eventId]/form-submit` | `{ ok: true, status: 200 }` (JSON) | Append the current user's Google Form answers as a row in the event's linked spreadsheet. Body: `AnswerMap` (`Record<string, string \| string[]>` keyed by `questionId`). Returns 404 if the event has no `formId`. Row layout: `[ISO timestamp, userId, name, email, ...answers in form order]`. If the form's question titles no longer match the latest tab's header, a new `Responses <ISO>` tab is added to the same spreadsheet for the new schema |
